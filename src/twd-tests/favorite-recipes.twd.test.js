import { twd, userEvent, screenDom } from 'twd-js';
import { describe, it, beforeEach } from 'twd-js/runner';
import { visit } from './support.js';
import { API_BASE, koftaRecipe } from './mocks/recipes.js';

describe('Favorite recipes page', () => {
  beforeEach(() => {
    twd.clearRequestMockRules();
    localStorage.clear();
  });

  it('shows the empty state when there are no favorites', async () => {
    await visit('/favorite-recipes');

    twd.should(await screenDom.findByRole('heading', { name: 'Favorite recipes' }), 'be.visible');
    twd.should(await screenDom.findByText('No favorite recipes yet'), 'be.visible');
  });

  // End-to-end favourites flow. This is the payoff of testing in a real
  // browser: a Material Web toggle button, an Open Cells channel, and the
  // browser's own localStorage all take part — nothing is stubbed but the
  // network. We favourite a recipe, assert it was persisted to localStorage,
  // then navigate to the favourites page and see it listed.
  it('favouriting a recipe persists it and lists it on the favourites page', async () => {
    await twd.mockRequest('recipeDetail', {
      method: 'GET',
      url: `${API_BASE}/lookup.php?i=${koftaRecipe.idMeal}`,
      response: { meals: [koftaRecipe] },
    });

    await visit(`/recipe/${koftaRecipe.idMeal}`);
    await screenDom.findByRole('heading', { name: koftaRecipe.strMeal });

    // The favourite toggle is a Material Web <md-outlined-icon-button>. Its
    // real <button> lives in the component's shadow root, so we reach across
    // the shadow boundary to click it — exactly what a user's click hits.
    const recipePage = document.querySelector('recipe-page');
    const favouriteButton = recipePage.querySelector(
      'md-outlined-icon-button[aria-label="Add receipe to favorite"]',
    );
    const innerButton = favouriteButton.shadowRoot.querySelector('button');
    await userEvent.click(innerButton);

    // The click flows through the Open Cells "liked-recipes" channel, which the
    // app persists to real localStorage.
    await twd.waitFor(
      () => {
        const stored = localStorage.getItem('_likedRecipes') || '';
        if (!stored.includes(koftaRecipe.strMeal)) {
          throw new Error('recipe not persisted to localStorage yet');
        }
      },
      { message: 'favourite to be saved in localStorage' },
    );

    // And it now appears on the favourites page. Cells keeps the persistent
    // recipe page mounted, so we scope the assertion to the favourites page
    // element to avoid matching the recipe title still in the DOM.
    await visit('/favorite-recipes');
    const favouritesPage = await twd.waitFor(() => {
      const page = document.querySelector('favorite-recipes-page');
      if (!page || !page.textContent.includes(koftaRecipe.strMeal)) {
        throw new Error('favourite recipe is not on the favourites page yet');
      }
      return page;
    });
    twd.should(favouritesPage, 'contain.text', koftaRecipe.strMeal);
  });
});
