import { twd, screenDom } from 'twd-js';
import { describe, it, beforeEach } from 'twd-js/runner';
import { visit } from './support.js';

describe('Home page', () => {
  beforeEach(() => {
    twd.clearRequestMockRules();
    localStorage.clear();
  });

  // The home page fires its "random meal" + "categories" requests once, at app
  // boot — before any test runs — so here we assert the always-present landing
  // shell. Request mocking is demonstrated on the pages that fetch on
  // navigation (see category.twd.test.js and recipe.twd.test.js).
  it('renders the landing shell', async () => {
    await visit('/');

    twd.should(await screenDom.findByText(/Welcome to Cells Recipes/i), 'be.visible');
    twd.should(await screenDom.findByText('Recipes Categories'), 'be.visible');
  });
});
