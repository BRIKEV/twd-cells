import { twd, screenDom } from 'twd-js';
import { describe, it, beforeEach } from 'twd-js/runner';
import { visit } from './support.js';
import { API_BASE, lambBurgersRecipe } from './mocks/recipes.js';

describe('Recipe page', () => {
  beforeEach(() => {
    twd.clearRequestMockRules();
    localStorage.clear();
  });

  it('shows a recipe with its ingredients and instructions', async () => {
    await twd.mockRequest('recipeDetail', {
      method: 'GET',
      url: `${API_BASE}/lookup.php?i=${lambBurgersRecipe.idMeal}`,
      response: { meals: [lambBurgersRecipe] },
    });

    await visit(`/recipe/${lambBurgersRecipe.idMeal}`);

    // Recipe title heading (plain <h2>). findByRole retries until the mocked
    // lookup.php response has been fetched and rendered.
    twd.should(
      await screenDom.findByRole('heading', { name: lambBurgersRecipe.strMeal }),
      'be.visible',
    );

    // Ingredients section with two of the mocked ingredients.
    twd.should(await screenDom.findByText('Ingredients'), 'be.visible');
    twd.should(await screenDom.findByText('Lamb Mince'), 'be.visible');
    twd.should(await screenDom.findByText('Cumin'), 'be.visible');

    // Instructions section: strInstructions is split on newlines into <p> lines.
    twd.should(await screenDom.findByText('Instructions'), 'be.visible');
    twd.should(await screenDom.findByText(/Tip the bulghar into a pan/), 'be.visible');
  });
});
