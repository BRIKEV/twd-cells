import { twd, screenDom } from 'twd-js';
import { describe, it, beforeEach } from 'twd-js/runner';
import { visit } from './support.js';
import { API_BASE, mockCategories, beefMeals } from './mocks/recipes.js';

describe('Category page', () => {
  beforeEach(() => {
    twd.clearRequestMockRules();
    localStorage.clear();
  });

  it('lists the recipes returned for a category', async () => {
    // The "categories" channel may already be warm from app boot, so mock
    // categories.php defensively but don't wait on it. filter.php is always
    // requested when the category page mounts.
    await twd.mockRequest('categories', {
      method: 'GET',
      url: `${API_BASE}/categories.php`,
      response: { categories: mockCategories },
    });
    await twd.mockRequest('categoryRecipes', {
      method: 'GET',
      url: `${API_BASE}/filter.php?c=Beef`,
      response: { meals: beefMeals },
    });

    await visit('/category/beef');

    // Category title is a plain <h2> rendered in light DOM.
    twd.should(await screenDom.findByRole('heading', { name: 'Beef' }), 'be.visible');

    // The recipes returned by our mocked filter.php are rendered as cards.
    // findByText retries until the mocked response has been fetched + rendered.
    twd.should(await screenDom.findByText('Beef and Mustard Pie'), 'be.visible');
    twd.should(await screenDom.findByText('Beef and Oyster Pie'), 'be.visible');
  });
});
