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
  videoUrl?: string;
  sourceUrl: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients: Ingredient[];
  instructions: string[];
  // Smart categorization
  dishType?: string; // Breakfast, Pasta, Dessert, etc.
  vibeTags?: string[]; // Vegan, High-Protein, Quick, etc.
  creatorHandle?: string; // @username from source
  creatorName?: string;
  // Transparency & verification
  originalTranscript?: string; // Raw extracted text from post for user verification
  isEstimated?: boolean; // True if AI had to infer details not explicitly stated
  // Metadata
  createdAt: string;
  platform?: "instagram" | "tiktok" | "manual";
}

export interface PantryItem {
  id: string;
  name: string;
  category: "protein" | "produce" | "dairy" | "pantry" | "spices" | "other";
  addedAt: string;
}

export const DISH_TYPES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Dessert",
  "Snack",
  "Appetizer",
  "Soup",
  "Salad",
  "Pasta",
  "Rice & Grains",
  "Sandwich",
  "Pizza",
  "Seafood",
  "Meat",
  "Vegetarian",
  "Baked Goods",
  "Drinks",
  "Sauce",
] as const;

export const VIBE_TAGS = [
  "Quick & Easy",
  "15-Min Meals",
  "30-Min Meals",
  "One-Pot",
  "Meal Prep",
  "Budget-Friendly",
  "High-Protein",
  "Low-Carb",
  "Vegan",
  "Vegetarian",
  "Gluten-Free",
  "Dairy-Free",
  "Keto",
  "Comfort Food",
  "Healthy",
  "Indulgent",
  "Kid-Friendly",
  "Date Night",
  "Lazy Sunday",
  "Party Food",
  "Batch Cooking",
] as const;

export const PANTRY_CATEGORIES = [
  { id: "protein", label: "Proteins", icon: "drumstick-bite" },
  { id: "produce", label: "Produce", icon: "carrot" },
  { id: "dairy", label: "Dairy & Eggs", icon: "cheese" },
  { id: "pantry", label: "Pantry Staples", icon: "jar" },
  { id: "spices", label: "Spices & Herbs", icon: "leaf" },
  { id: "other", label: "Other", icon: "box" },
] as const;
