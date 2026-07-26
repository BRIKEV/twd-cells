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

// lookup.php?i=53010 -> { meals: [ <full meal> ] }
// Real TheMealDB data (real image URL) so the recipe page renders cleanly for a
// screenshot. The mock still serves it, so the test stays deterministic/offline.
export const lambBurgersRecipe = {
  idMeal: '53010',
  strMeal: 'Lamb Tzatziki Burgers',
  strMealThumb: 'https://www.themealdb.com/images/media/meals/k420tj1585565244.jpg',
  strCategory: 'Lamb',
  strArea: 'Greek',
  strYoutube: 'https://www.youtube.com/watch?v=s7_TF4ZHjPc',
  strIngredient1: 'Bulgur Wheat',
  strMeasure1: '25g',
  strIngredient2: 'Lamb Mince',
  strMeasure2: '500g',
  strIngredient3: 'Cumin',
  strMeasure3: '1 tsp',
  strIngredient4: 'Coriander',
  strMeasure4: '1 tsp',
  strIngredient5: 'Paprika',
  strMeasure5: '1 tsp',
  strIngredient6: 'Garlic',
  strMeasure6: '1 clove finely chopped',
  strIngredient7: 'Olive Oil',
  strMeasure7: 'For frying',
  strIngredient8: 'Bun',
  strMeasure8: '4',
  strIngredient9: 'Cucumber',
  strMeasure9: 'Grated',
  strIngredient10: 'Greek Yogurt',
  strMeasure10: '200g',
  strIngredient11: 'Mint',
  strMeasure11: '2 tbs',
  strInstructions:
    'Tip the bulghar into a pan, cover with water and boil for 10 mins. Drain really well in a sieve, pressing out any excess water.\n' +
    'To make the tzatziki, squeeze and discard the juice from the cucumber, then mix into the yogurt with the chopped mint and a little salt.\n' +
    'Work the bulghar into the lamb with the spices, garlic and seasoning, then shape into 4 burgers. Brush with a little oil and fry or barbecue for about 5 mins each side until cooked all the way through.',
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
