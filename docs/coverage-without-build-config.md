# Coverage without touching the build config

**Goal:** produce `window.__coverage__` (Istanbul format) with no `vite.config`
change and no `vite-plugin-istanbul`, so `twd-cli` collects coverage exactly as
it does today.

**Key fact that makes this possible:** `twd-cli` does not instrument anything.
Its entire collection step is:

```js
// twd-cli src/index.js (paraphrased)
const coverage = await page.evaluate(() => window.__coverage__);
fs.writeFileSync('.nyc_output/out.json', JSON.stringify(coverage));
// then: npx nyc report
```

So the only problem to solve is **populating `window.__coverage__` by some other
means.** Everything downstream (collection, `nyc report`) is unchanged.

The idea: TWD already ships a same-origin service worker for request mocking. In
Vite dev, every app module is a normal HTTP request. Teach the worker to run
Istanbul over app modules on the fly, in a coverage mode, and the instrumented
code fills `window.__coverage__` as the app runs.

This is framework-agnostic: it works for any app whose dev server serves ES
modules over HTTP on the same origin (React, Vue, Solid, Lit/Cells, vanilla).

---

## The pipeline

```
initTWD({ coverage: true })
   -> registers the SW with a coverage flag (e.g. /mock-sw.js?coverage=1)

browser requests /src/pages/recipe/recipe-page.ts  (transformed JS + source map)
   -> SW intercepts (fetch event)
   -> SW fetches the real module, runs istanbul-lib-instrument on it
      feeding Vite's source map as inputSourceMap
   -> returns instrumented JS

app runs (dev sidebar OR twd-cli headless)
   -> each instrumented module registers counters into window.__coverage__

twd-cli:  page.evaluate(() => window.__coverage__)  ->  .nyc_output/out.json
npx nyc report  ->  HTML / lcov, mapped back to original .ts via inputSourceMap
```

Nothing in `twd-cli` changes. The only new code lives in the service worker plus
a one-line flag in `initTWD`.

---

## Step 1 — Tell the worker it is in coverage mode (before any module loads)

App modules are fetched at boot, so the worker must know it is instrumenting
*before* it handles the first request. The cleanest way is to pass the flag on
the registration URL, which the worker can read synchronously at activation from
`self.location`:

```js
// initTWD, when { coverage: true }
await navigator.serviceWorker.register('/mock-sw.js?coverage=1&include=/src/');
```

```js
// inside mock-sw.js — read config the moment the worker starts
const swParams = new URL(self.location.href).searchParams;
const COVERAGE = swParams.get('coverage') === '1';
const INCLUDE = swParams.get('include') || '/src/';
```

You can also support a runtime toggle for the dev sidebar (turn coverage on/off
without re-registering) via `postMessage`:

```js
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SET_COVERAGE') coverageEnabled = e.data.enabled;
});
```

> Race note: a service worker does not control the page it was registered on
> until it activates. Modules fetched during that first load bypass the worker
> and are not instrumented. Two fixes: (a) have `twd-cli` reload once after the
> worker is active so every module re-fetches through it, or (b) rely on lazy
> route imports (Cells imports pages on navigation, which happens after control
> is established). For full coverage, do (a).

---

## Step 2 — Decide what to instrument

Only same-origin application source. Skip `node_modules`, the Vite client, HMR,
the test files, twd-js itself, and non-JS.

```js
function shouldInstrument(url) {
  const u = new URL(url);
  if (u.origin !== self.location.origin) return false;     // app origin only
  if (!u.pathname.startsWith(INCLUDE)) return false;        // e.g. /src/
  if (/\.(css|json|svg|png|woff2?)$/.test(u.pathname)) return false;
  if (u.pathname.includes('/node_modules/')) return false;
  if (u.pathname.includes('/@vite/') || u.pathname.includes('/@id/')) return false;
  if (/\.twd\.test\.[jt]sx?($|\?)/.test(u.pathname)) return false; // don't cover the tests
  return true;
}
```

Vite requests carry query strings (`?t=...`, `?import`); match on
`u.pathname`, not the full URL.

---

## Step 3 — Intercept the fetch and instrument the response

Slots into the worker's existing `fetch` handler, after the mock-rule check and
before the default pass-through:

```js
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1) existing behaviour: if a mock rule matches, serve the mock
  const rule = matchRule(request);
  if (rule) return event.respondWith(serveMock(rule, request));

  // 2) new behaviour: instrument app modules in coverage mode
  if (COVERAGE && request.method === 'GET' && shouldInstrument(request.url)) {
    return event.respondWith(instrumentModule(request));
  }

  // 3) otherwise let it hit the network as before (no respondWith)
});
```

---

## Step 4 — The instrumentation itself

```js
// A prebuilt browser bundle of istanbul-lib-instrument (+ its Babel deps),
// loaded only in coverage mode so normal dev pays nothing.
importScripts('/twd-istanbul-instrumenter.js'); // exposes self.TwdInstrumenter

const instrumenter = self.TwdInstrumenter.createInstrumenter({
  esModules: true,          // Vite serves ES modules — must parse import/export
  compact: true,
  coverageVariable: '__coverage__',
  autoWrap: true,
});

const cache = new Map(); // url -> instrumented code (skip re-instrumenting)

async function instrumentModule(request) {
  const res = await fetch(request);

  // Only touch JS the server actually returned as a module.
  const type = res.headers.get('content-type') || '';
  if (!/javascript|ecmascript/.test(type)) return res;

  const url = new URL(request.url);
  const cacheKey = url.pathname + url.search;
  if (cache.has(cacheKey)) {
    return new Response(cache.get(cacheKey), { headers: res.headers });
  }

  const source = await res.text();
  const inputSourceMap = extractInlineSourceMap(source); // may be undefined
  const filename = url.pathname; // becomes the key in window.__coverage__

  let out;
  try {
    out = instrumenter.instrumentSync(stripSourceMapComment(source), filename, inputSourceMap);
  } catch {
    return new Response(source, { headers: res.headers }); // never break the app
  }

  cache.set(cacheKey, out);
  const headers = new Headers(res.headers);
  headers.delete('content-length'); // body size changed
  return new Response(out, { status: res.status, headers });
}
```

The instrumented module contains a self-registering snippet that does roughly
`(globalThis.__coverage__ ||= {})[filename] = coverageData` and bumps counters as
the code runs. That is what fills `window.__coverage__`.

---

## Step 5 — Source maps (the part that makes the report readable)

Vite serves already-transformed code (TS gone, Lit decorators expanded). If you
instrument that and stop there, the report points at transformed JS, which is
useless. Passing Vite's source map as `inputSourceMap` makes Istanbul record the
original `.ts` positions, and `nyc report` remaps to them.

Vite inlines the map as a base64 comment on transformed modules:

```js
function extractInlineSourceMap(code) {
  const m = code.match(
    /\/\/[#@]\s*sourceMappingURL=data:application\/json;(?:charset=[^;]+;)?base64,([A-Za-z0-9+/=]+)/,
  );
  if (!m) return undefined;
  try { return JSON.parse(self.atob(m[1])); } catch { return undefined; }
}

function stripSourceMapComment(code) {
  return code.replace(/\n?\/\/[#@]\s*sourceMappingURL=[^\n]*/, '');
}
```

If a project serves the map as a separate `.map` URL instead of inline, fetch it
from the `sourceMappingURL` and parse that. Handle both.

---

## Step 6 — Collect and report (unchanged)

`twd-cli` already reads the global and writes `.nyc_output/out.json`:

```js
const coverage = await page.evaluate(() => window.__coverage__);
```

Then, as the TWD docs already describe:

```bash
npx nyc report --reporter=html --reporter=text
```

The only optional `twd-cli` tweak is Step 1's reload-after-activation so boot
modules are captured.

---

## Why it generalizes

Nothing here is Cells-specific. It keys off "the dev server returns ES modules
over HTTP on the same origin," which is true for every Vite app and most modern
dev servers. Swap `include=/src/` per project and it works for React, Vue, Solid,
or vanilla. The instrumentation, collection, and reporting are identical.

## Honest limitations

- **Activation race:** modules loaded on the very first paint, before the worker
  controls the page, are missed unless you reload once after activation.
- **Source-map fidelity:** branch coverage inside heavily transformed code (Lit
  decorators, TS enums) is only as good as Vite's dev source maps.
- **Instrumenter size:** the browser bundle of `istanbul-lib-instrument` + Babel
  is a few hundred KB to low MB. It loads only in coverage mode and never ships
  to production (the mock worker is stripped from prod builds already).
- **Scope:** covers fetched modules only, not inline `<script>` in `index.html`.

## The pitch

"Coverage with no build-config access." In an org where the Vite/build pipeline
is centrally managed and a developer cannot add a plugin, this turns coverage
from a blocked request into a drop-in. It rides the existing `window.__coverage__`
contract, so it works identically in the in-browser sidebar and in CI.
