import { twd } from 'twd-js';
import { publish } from '@open-cells/core';

/**
 * Navigate an Open Cells app.
 *
 * Open Cells runs with `useHistory: false`, so its router is driven by the URL
 * hash (`#!/...`) and the native `hashchange` event, not the History API. We set
 * `location.hash` directly, exactly like the app's own `<a href="#!/...">` links
 * do. This is the one Cells-specific helper the page tests need.
 */
export async function visit(path) {
  window.location.hash = '#!' + (path.startsWith('/') ? path : `/${path}`);
  await twd.wait(100); // let hashchange + the route's dynamic import settle
}

/**
 * Reset the shared favourites state between tests.
 *
 * Open Cells keeps liked recipes in an in-memory channel that outlives a single
 * test, so `localStorage.clear()` isn't enough. Publish an empty set (the same
 * `publish()` the app uses) in `beforeEach` to keep favourites tests independent
 * of execution order.
 */
export function resetFavourites() {
  publish('liked-recipes', new Set());
}
