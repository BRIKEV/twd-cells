import { twd, configureScreenDom } from 'twd-js';
import { publish } from '@open-cells/core';

// Dynamic route imports + a mocked network round-trip can take longer than
// Testing Library's 1s default, so give async queries a little more room.
configureScreenDom({ asyncUtilTimeout: 5000 });

/**
 * Reset the shared favourites state between tests.
 *
 * `localStorage.clear()` alone isn't enough: Open Cells keeps liked recipes in
 * an in-memory channel (a ReplaySubject) that outlives a single test. We publish
 * an empty set on that channel — the same `publish()` the app itself uses — which
 * the app then persists back to localStorage. Call this in `beforeEach` so tests
 * that touch favourites are independent of execution order.
 */
export function resetFavourites() {
  publish('liked-recipes', new Set());
}

/**
 * Wait until the mock service worker is actually controlling the page.
 *
 * Right after the first page load the worker may still be activating, so a
 * request fired too early would slip past the mocks and hit the real network.
 * Waiting for `serviceWorker.controller` makes request mocking deterministic
 * regardless of which test runs first.
 */
async function ensureRequestMockingReady() {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) return;
  await twd.waitFor(
    () => {
      if (!(navigator.serviceWorker && navigator.serviceWorker.controller)) {
        throw new Error('service worker is not controlling the page yet');
      }
    },
    { timeout: 5000, interval: 50, message: 'mock service worker to take control' },
  );
}

/**
 * Navigate an Open Cells app.
 *
 * Open Cells runs with `useHistory: false`, so its router is driven by the URL
 * hash (`#!/...`) and the native `hashchange` event — NOT the History API.
 * `twd.visit()` navigates via `pushState` + `popstate`, which this router
 * ignores, so here we set `location.hash` directly (the same thing the app's
 * own `<a href="#!/...">` links and `PageController.navigate()` do under the
 * hood). This is the one Cells-specific helper the page tests need.
 *
 * Cells keeps "common"/persistent pages alive across navigations, so we first
 * bounce through the not-found route: that leaves the current page, giving each
 * test a clean mount (and a fresh, mockable fetch) of its target page.
 *
 * @param {string} path App path, e.g. `/`, `/category/beef`, `/recipe/52772`.
 */
export async function visit(path) {
  await ensureRequestMockingReady();
  const target = '#!' + (path.startsWith('/') ? path : `/${path}`);
  const resetRoute = target === '#!/not-found' ? '#!/' : '#!/not-found';

  if (window.location.hash !== resetRoute) {
    window.location.hash = resetRoute;
    await twd.wait(50);
  }

  window.location.hash = target;
  await twd.wait(80); // let hashchange + the route's dynamic import settle
}
