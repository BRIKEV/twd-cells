// Shared TWD test fixtures modelled on TheMealDB response shapes.
// API base: https://www.themealdb.com/api/json/v1/1/

export const API_BASE = 'https://www.themealdb.com/api/json/v1/1';

// categories.php -> { categories: [...] }
export const mockCategories = [
  {
    idCategory: '1',
    strCategory: 'Beef',
    strCategoryThumb: 'https://example.com/beef.png',
    strCategoryDescription: 'Beef is the culinary name for meat from cattle.',
  },
  {
    idCategory: '2',
    strCategory: 'Chicken',
    strCategoryThumb: 'https://example.com/chicken.png',
    strCategoryDescription: 'Chicken is a type of domesticated fowl.',
  },
  {
    idCategory: '3',
    strCategory: 'Dessert',
    strCategoryThumb: 'https://example.com/dessert.png',
    strCategoryDescription: 'Dessert is a course that concludes a meal.',
  },
];

// random.php / lookup.php -> { meals: [ <full meal> ] }
export const teriyakiRecipe = {
  idMeal: '52772',
  strMeal: 'Teriyaki Chicken Casserole',
  strMealThumb: 'https://example.com/teriyaki.jpg',
  strCategory: 'Chicken',
  strArea: 'Japanese',
  strInstructions:
    'Preheat oven to 350 degrees F.\nCombine soy sauce and water in a bowl.\nBake for 35 minutes and serve.',
  strYoutube: 'https://www.youtube.com/watch?v=4aZr5hZXP_s',
  strIngredient1: 'Soy Sauce',
  strIngredient2: 'Water',
  strIngredient3: 'Brown Sugar',
  strMeasure1: '3/4 cup',
  strMeasure2: '1/2 cup',
  strMeasure3: '1/4 cup',
  strIngredient4: '',
  strMeasure4: '',
};

// A second full recipe, used by the "add to favorites" flow so it doesn't
// collide with the persistent recipe page cached by the recipe detail test.
export const koftaRecipe = {
  idMeal: '52819',
  strMeal: 'Kofta',
  strMealThumb: 'https://example.com/kofta.jpg',
  strCategory: 'Beef',
  strArea: 'Egyptian',
  strInstructions: 'Mix the meat and spices.\nShape into koftas.\nGrill until cooked through.',
  strYoutube: 'https://www.youtube.com/watch?v=example',
  strIngredient1: 'Minced Beef',
  strIngredient2: 'Onion',
  strMeasure1: '500g',
  strMeasure2: '1',
};

// filter.php?c=Beef -> { meals: [ <lightweight meal> ] }
export const beefMeals = [
  { idMeal: '52874', strMeal: 'Beef and Mustard Pie', strMealThumb: 'https://example.com/pie.jpg' },
  { idMeal: '52878', strMeal: 'Beef and Oyster Pie', strMealThumb: 'https://example.com/oyster.jpg' },
];
