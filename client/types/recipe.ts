export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  sourceUrl: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients: Ingredient[];
  instructions: string[];
  createdAt: string;
}
