# TWD Project Patterns

## Project Configuration

- **Framework**: Lit 3 + Open Cells (`@open-cells/core`)
- **Vite base path**: /
- **Dev server port**: 5173
- **App URL**: http://localhost:5173
- **Dev command**: npm run dev
- **Default branch**: main
- **Entry point**: src/components/app-index.ts (`<app-index id="app-content">` in index.html)
- **Public folder**: public/
- **Test location**: src/twd-tests/ (plain JS, `*.twd.test.js`)
- **Closing run**: full suite

TWD is wired through the `twd()` Vite plugin in `vite.config.ts` (`rootSelector: '#app-content'`) — there is no `initTWD` code in the entry file or `index.html`. Coverage instrumentation is opt-in via `npm run dev:ci` (`COVERAGE=true`).

### Runner Commands

twd-cli drives its own headless browser — only the dev server has to be up (`npm run dev`, or `npm run dev:ci` for coverage).

```bash
# Run all tests
npm run test:ci

# Run specific tests by name (matches "suite > test", case-insensitive; repeatable)
npx twd-cli run --test "should render the list"
npx twd-cli run --test "should create" --test "should show the error"

# Only the tests this branch added or changed
npx twd-cli run --changed-since origin/main

# Record a run to video (one clip per matched test, needs ffmpeg)
npx twd-cli run --record --test "should render the list"
```

Every run writes `.twd/report/`: `run.json` (the result), `summary.md` and `index.html`. The folder is replaced on each run.

## Standard Imports

```javascript
import { twd, userEvent, screenDom } from 'twd-js';
import { describe, it, beforeEach } from 'twd-js/runner';
import { visit, resetFavourites } from './support.js';
import { API_BASE /*, fixtures */ } from './mocks/recipes.js';
```

## Visit Paths

Open Cells routes by URL hash (`#!/...`), not the History API, so tests navigate with the `visit()` helper from `src/twd-tests/support.js` instead of `twd.visit()`:

```javascript
await visit('/');
await visit('/category/Beef');
```

## Standard beforeEach

```javascript
beforeEach(() => {
  twd.clearRequestMockRules();
  localStorage.clear();
  // resetFavourites(); // only in files touching favourites — Open Cells keeps
  //                    // liked recipes in an in-memory channel that outlives a test
});
```

## API Service Types

API calls live in `src/components/meals.ts` (TheMealDB, base URL in `src/config/app.config.js`). Shared fixtures and `API_BASE` are in `src/twd-tests/mocks/recipes.js`.

The home page fetches once at app boot, before any test registers a mock — request mocking is only meaningful on pages that fetch on navigation (category, recipe).

## CSS / Component Library

- **Library**: Material Web (`@material/web`)
- **Docs**: https://material-web.dev/

When writing tests, refer to library docs for correct ARIA roles and component structure.

## Portals and Dialogs

Use `screenDomGlobal` instead of `screenDom` for elements rendered in portals (modals, dropdowns, tooltips):

```javascript
import { screenDomGlobal } from 'twd-js';
const modal = screenDomGlobal.getByRole('dialog');
```
