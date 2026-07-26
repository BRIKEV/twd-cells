# Cells Recipes × TWD

A small [Open Cells](https://www.opencells.dev) + [Lit](https://lit.dev) recipes
app (built on Material Web components and TheMealDB API), used here to show how
[**TWD (Test While Developing)**](https://twd.dev) fits a real Cells application.

> **The pitch, in one line:** TWD runs your tests *inside the real browser*,
> against the real DOM, real Web Components (Shadow DOM and all), and real
> `localStorage`, mocking only the network. No jsdom, no Shadow DOM shims, no
> re-implementing the runtime.

---

## Why this matters for a Cells app

Open Cells apps are built from Web Components. Testing them in a Node/jsdom
runner means fighting the exact things that make them work: Shadow DOM, custom
element upgrades, Material Web internals, the hash router, and browser APIs like
`localStorage`. TWD sidesteps all of that by running the assertions in the page
itself.

In this repo, every test:

- drives the **real Open Cells hash router** (`#!/...`),
- renders **real `@material/web` components** with their Shadow DOM intact,
- reads and writes **real `localStorage`** (the favourites feature),
- and **mocks only HTTP** to TheMealDB, so the tests are deterministic and offline.

The only thing faked is the network. Everything else is the app as your users run it.

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 and the **TWD sidebar** appears on the left in dev.
Click any test to run it live against the app while you build.

Tests live in [`src/twd-tests/`](src/twd-tests) and are discovered automatically
(`./**/*.twd.test.{js,ts}`). TWD is wired up by its vite plugin in
[`vite.config.ts`](vite.config.ts), so there is nothing to add to `index.html`.

### Run headless / in CI

The same tests run headless with [`twd-cli`](https://twd.dev/ci-execution), no
rewriting, no separate suite:

```bash
# with the dev server running on http://localhost:5173
npx twd-cli run
```

Configuration lives in [`twd.config.json`](twd.config.json).

### Code coverage

`npm run dev:ci` serves the app with Istanbul instrumentation (via
[`vite-plugin-istanbul`](https://www.npmjs.com/package/vite-plugin-istanbul)), so
it exposes `window.__coverage__`. twd-cli collects it as-is:

```bash
npm run dev:ci           # instrumented dev server
npx twd-cli run          # collects window.__coverage__ into .nyc_output/
npm run coverage:report  # nyc -> text + HTML at coverage/index.html
```

No changes to twd-js or twd-cli. For apps whose build config is locked down, see
[`docs/coverage-without-build-config.md`](docs/coverage-without-build-config.md).

---

## What's covered

| Page | Test file | What it proves |
|------|-----------|----------------|
| Home | [`home.twd.test.js`](src/twd-tests/home.twd.test.js) | The landing shell renders |
| Category | [`category.twd.test.js`](src/twd-tests/category.twd.test.js) | Recipes render from a **mocked** `filter.php` response |
| Recipe | [`recipe.twd.test.js`](src/twd-tests/recipe.twd.test.js) | A **mocked** recipe's ingredients + instructions render |
| Favourites | [`favorite-recipes.twd.test.js`](src/twd-tests/favorite-recipes.twd.test.js) | Empty state, **and** an end-to-end favourite flow (click → real `localStorage` → shows on the favourites page) |
| Not found | [`not-found.twd.test.js`](src/twd-tests/not-found.twd.test.js) | The 404 page renders |

### A test, end to end

```js
import { twd, screenDom } from 'twd-js';
import { describe, it, beforeEach } from 'twd-js/runner';
import { visit } from './support.js';
import { API_BASE, teriyakiRecipe } from './mocks/recipes.js';

describe('Recipe page', () => {
  beforeEach(() => {
    twd.clearRequestMockRules();
    localStorage.clear();
  });

  it('shows a recipe with its ingredients and instructions', async () => {
    await twd.mockRequest('recipeDetail', {
      method: 'GET',
      url: `${API_BASE}/lookup.php?i=${teriyakiRecipe.idMeal}`,
      response: { meals: [teriyakiRecipe] },
    });

    await visit(`/recipe/${teriyakiRecipe.idMeal}`);

    twd.should(await screenDom.findByRole('heading', { name: teriyakiRecipe.strMeal }), 'be.visible');
    twd.should(await screenDom.findByText('Soy Sauce'), 'be.visible');
    twd.should(await screenDom.findByText(/Preheat oven to 350 degrees F\./), 'be.visible');
  });
});
```

The favourites test is the one to show off: it clicks a Material Web toggle,
lets the click travel through an Open Cells channel, and asserts the recipe was
persisted to the browser's own `localStorage`, then navigates to the favourites
page and finds it listed. Nothing is stubbed but the network.

---

## Cells-specific notes (things worth knowing)

Getting TWD green on a Cells app surfaced a few framework realities. They're
small, but they're the difference between "tests don't run" and "tests just work":

1. **The service worker must have root scope.** Request mocking is a Service
   Worker. Served from `/src/mock-sw.js` its scope is `/src/`, so it can't
   intercept requests from the app at `/`. It lives in
   [`public/mock-sw.js`](public/mock-sw.js) → served at `/mock-sw.js` → root scope.

2. **Open Cells uses hashbang routing.** With `useHistory: false`, the router
   listens to `hashchange` on `#!/...` URLs, not the History API. The one helper
   the tests need, [`visit()`](src/twd-tests/support.js), drives `location.hash`
   directly, exactly what the app's own links do.

3. **`#app-content` is the app root.** `rootSelector: '#app-content'` in the
   TWD vite plugin scopes `screenDom` queries to the Cells app container.

4. **Material Web toggles update `selected` asynchronously.** The favourite
   button flips its `selected` state *after* a synthetic click, while the page
   reads `event.target.selected` synchronously. The favourites test sets the
   toggle's intended state, then clicks, a clean and deterministic interaction.

None of these required changing how the app works (the one app tweak, marking
`/not-found` as the real 404 route, is a genuine improvement).

---

## Tech

Lit · Open Cells (`@open-cells/*`) · Material Web (`@material/web`) · Vite ·
TWD (`twd-js`, `twd-cli`) · data from [TheMealDB](https://www.themealdb.com).
