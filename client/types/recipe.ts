export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  aisle?: AisleCategory; // Added for Phase 2 grouping
  isEstimated?: boolean; // Labeling specific AI-filled gaps
}

export type RecipeSourceType = 
  | "creator_website"      // Full recipe found on creator's website
  | "authoritative_source" // Details filled in from top chefs/publications
  | "video_transcript"     // Extracted primarily from video content
  | "social_post_only"     // Only had caption/post text to work with
  | "ai_generated";         // Added for when source is thin

export type ConfidenceLevel = "high" | "medium" | "low";

export type VerificationMethod = 'domain_match' | 'instagram_link' | 'unverified' | 'user_manual';

export interface RecipeSource {
  type: RecipeSourceType;
  name?: string;           // e.g., "halfbakedharvest.com" or "Serious Eats"
  url?: string;            // Link to the source
  note?: string;           // Explanation of what was sourced
  isVerified?: boolean;    // Whether the source was verified as the creator's actual site
  verificationMethod?: VerificationMethod; // How the source was verified
}

export interface InstructionStep {
  text: string;
  timestamp?: number;
}

export type Instruction = string | InstructionStep;

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
  instructions: (string | InstructionStep)[];
  // Smart categorization
  dishType?: string; // Breakfast, Pasta, Dessert, etc.
  vibeTags?: string[]; // Vegan, High-Protein, Quick, etc.
  creatorHandle?: string; // @username from source
  creatorName?: string;
  creatorAvatar?: string; // Profile picture URL
  creatorRecipeUrl?: string; // Link to full recipe on creator's website/blog
  manualSearchQuery?: string; // Search query if no recipe URL found
  // Transparency & verification
  originalTranscript?: string; // Raw extracted text from post
  isEstimated?: boolean; // True if AI had to infer details
  isEstimatedInstructions?: boolean; // Added for Phase 1
  confidence?: ConfidenceLevel; // How accurate this recipe is to the original
  recipeSource?: RecipeSource; // Where the recipe details came from
  authoritativeReference?: string; // If filled from a known source
  // Metadata
  createdAt: string;
  platform?: "instagram" | "tiktok" | "youtube" | "manual"; // Added YouTube
}

export interface PantryItem {
  id: string;
  name: string;
  category: "protein" | "produce" | "dairy" | "pantry" | "spices" | "other";
  addedAt: string;
}

export const DISH_TYPES = [
  "Breakfast", "Lunch", "Dinner", "Dessert", "Snack", "Appetizer", 
  "Soup", "Salad", "Pasta", "Rice & Grains", "Sandwich", "Pizza", 
  "Seafood", "Meat", "Vegetarian", "Baked Goods", "Drinks", "Sauce",
] as const;

export const VIBE_TAGS = [
  "Quick & Easy", "15-Min Meals", "30-Min Meals", "One-Pot", "Meal Prep", 
  "Budget-Friendly", "High-Protein", "Low-Carb", "Vegan", "Vegetarian", 
  "Gluten-Free", "Dairy-Free", "Keto", "Comfort Food", "Healthy", 
  "Indulgent", "Kid-Friendly", "Date Night", "Lazy Sunday", "Party Food", "Batch Cooking",
] as const;

export const PANTRY_CATEGORIES = [
  { id: "protein", label: "Proteins", icon: "drumstick-bite" },
  { id: "produce", label: "Produce", icon: "carrot" },
  { id: "dairy", label: "Dairy & Eggs", icon: "cheese" },
  { id: "pantry", label: "Pantry Staples", icon: "jar" },
  { id: "spices", label: "Spices & Herbs", icon: "leaf" },
  { id: "other", label: "Other", icon: "box" },
] as const;

export type AisleCategory = 
  | "produce" | "meat" | "seafood" | "dairy" | "bakery" 
  | "frozen" | "pantry" | "spices" | "beverages" | "other";

export const AISLE_CATEGORIES: { id: AisleCategory; label: string; icon: string }[] = [
  { id: "produce", label: "Produce", icon: "leaf" },
  { id: "meat", label: "Meat & Poultry", icon: "package" },
  { id: "seafood", label: "Seafood", icon: "droplet" },
  { id: "dairy", label: "Dairy & Eggs", icon: "circle" },
  { id: "bakery", label: "Bakery", icon: "box" },
  { id: "frozen", label: "Frozen", icon: "thermometer" },
  { id: "pantry", label: "Pantry & Dry Goods", icon: "archive" },
  { id: "spices", label: "Spices & Seasonings", icon: "sun" },
  { id: "beverages", label: "Beverages", icon: "coffee" },
  { id: "other", label: "Other", icon: "more-horizontal" },
];

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  aisle: AisleCategory;
  isChecked: boolean;
  inPantry: boolean;
  recipeIds: string[];
  recipeTitles: string[];
}