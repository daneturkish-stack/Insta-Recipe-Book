import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import { randomUUID } from "crypto";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface GenerateRecipeRequest {
  url: string;
}

interface SmartSearchRequest {
  query: string;
  recipes: any[];
}

interface PantryMatchRequest {
  pantryItems: string[];
  recipes: any[];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate recipe from Instagram/TikTok URL
  app.post("/api/recipes/generate", async (req: Request, res: Response) => {
    try {
      const { url } = req.body as GenerateRecipeRequest;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const instagramPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels)\/[\w-]+/i;
      const tiktokPattern = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\//i;
      
      let platform: "instagram" | "tiktok" | "manual" = "manual";
      if (instagramPattern.test(url)) {
        platform = "instagram";
      } else if (tiktokPattern.test(url)) {
        platform = "tiktok";
      }

      // Extract creator handle from URL if possible
      const creatorMatch = url.match(/@([\w.]+)/);
      const creatorHandle = creatorMatch ? `@${creatorMatch[1]}` : null;

      const systemPrompt = `You are a professional recipe extraction and categorization assistant for the Kitch app. Your job is to take social media food post URLs and generate complete, cookbook-quality recipes with smart categorization.

When given a URL, generate a realistic, detailed recipe. Since you cannot access the actual content, create a plausible recipe based on the URL patterns.

IMPORTANT: You must also categorize the recipe with:
1. dishType: One category from [Breakfast, Lunch, Dinner, Dessert, Snack, Appetizer, Soup, Salad, Pasta, Rice & Grains, Sandwich, Pizza, Seafood, Meat, Vegetarian, Baked Goods, Drinks, Sauce]
2. vibeTags: 2-4 relevant tags from [Quick & Easy, 15-Min Meals, 30-Min Meals, One-Pot, Meal Prep, Budget-Friendly, High-Protein, Low-Carb, Vegan, Vegetarian, Gluten-Free, Dairy-Free, Keto, Comfort Food, Healthy, Indulgent, Kid-Friendly, Date Night, Lazy Sunday, Party Food, Batch Cooking]
3. creatorHandle: Extract from URL or generate a realistic food creator handle
4. creatorName: A realistic name for the creator

Generate diverse recipes including various cuisines and dietary preferences.

Respond ONLY with a valid JSON object:
{
  "title": "Recipe Name",
  "description": "A brief appetizing description (2-3 sentences)",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "dishType": "Pasta",
  "vibeTags": ["Quick & Easy", "Comfort Food"],
  "creatorHandle": "@foodcreator",
  "creatorName": "Chef Name",
  "ingredients": [
    {"name": "ingredient name", "amount": "1", "unit": "cup"}
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ]
}`;

      const userPrompt = `Generate a complete, detailed recipe from this social media food post: ${url}

Create a realistic, delicious recipe that someone might share on ${platform}. Include:
- A catchy, appetizing title
- Brief description (2-3 sentences)
- Realistic prep and cook times in minutes
- Number of servings
- Dish type category
- 2-4 vibe/diet tags
- Creator handle and name
- Complete ingredient list with precise measurements (8-15 ingredients)
- Detailed step-by-step cooking instructions (6-12 steps)

Respond only with the JSON object, no additional text.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const recipeData = JSON.parse(content);

      const recipe = {
        id: randomUUID(),
        title: recipeData.title || "Untitled Recipe",
        description: recipeData.description || "",
        imageUrl: null,
        videoThumbnail: null,
        sourceUrl: url,
        prepTime: recipeData.prepTime || null,
        cookTime: recipeData.cookTime || null,
        servings: recipeData.servings || null,
        dishType: recipeData.dishType || null,
        vibeTags: recipeData.vibeTags || [],
        creatorHandle: recipeData.creatorHandle || creatorHandle || null,
        creatorName: recipeData.creatorName || null,
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        platform,
        createdAt: new Date().toISOString(),
      };

      res.json(recipe);
    } catch (error: any) {
      console.error("Error generating recipe:", error);
      res.status(500).json({
        error: error.message || "Failed to generate recipe",
      });
    }
  });

  // Smart search with AI
  app.post("/api/recipes/search", async (req: Request, res: Response) => {
    try {
      const { query, recipes } = req.body as SmartSearchRequest;

      if (!query || !recipes || recipes.length === 0) {
        return res.json({ matchingIds: [] });
      }

      const recipeSummaries = recipes.map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        dishType: r.dishType,
        vibeTags: r.vibeTags,
        creatorHandle: r.creatorHandle,
        ingredients: r.ingredients?.map((i: any) => i.name).join(", "),
      }));

      const systemPrompt = `You are a smart recipe search assistant. Given a natural language query and a list of recipes, identify which recipes match the user's intent.

The user might ask things like:
- "that chicken pasta thing from last month"
- "something quick for dinner"
- "the TikTok recipe with the cheese pull"
- "healthy breakfast ideas"
- "recipes from @creator"

Return ONLY a JSON object with an array of matching recipe IDs, ranked by relevance:
{"matchingIds": ["id1", "id2"]}

If no recipes match, return: {"matchingIds": []}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Search query: "${query}"\n\nAvailable recipes:\n${JSON.stringify(recipeSummaries, null, 2)}` 
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 512,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.json({ matchingIds: [] });
      }

      const result = JSON.parse(content);
      res.json(result);
    } catch (error: any) {
      console.error("Error in smart search:", error);
      res.json({ matchingIds: [] });
    }
  });

  // Pantry-aware recipe matching
  app.post("/api/recipes/pantry-match", async (req: Request, res: Response) => {
    try {
      const { pantryItems, recipes } = req.body as PantryMatchRequest;

      if (!pantryItems || pantryItems.length === 0 || !recipes || recipes.length === 0) {
        return res.json({ matches: [] });
      }

      const recipeSummaries = recipes.map((r: any) => ({
        id: r.id,
        title: r.title,
        ingredients: r.ingredients?.map((i: any) => i.name) || [],
      }));

      const systemPrompt = `You are a pantry-aware recipe matching assistant. Given a list of ingredients the user has and a list of recipes, determine which recipes can be made.

For each recipe, calculate:
- matchPercentage: What percentage of ingredients the user already has (0-100)
- missingIngredients: List of ingredients they're missing

Return ONLY a JSON object with matches sorted by matchPercentage (highest first):
{
  "matches": [
    {"id": "recipe-id", "matchPercentage": 85, "missingIngredients": ["butter", "cream"]}
  ]
}

Only include recipes with at least 50% ingredient match.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `User's pantry ingredients: ${pantryItems.join(", ")}\n\nRecipes:\n${JSON.stringify(recipeSummaries, null, 2)}` 
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.json({ matches: [] });
      }

      const result = JSON.parse(content);
      res.json(result);
    } catch (error: any) {
      console.error("Error in pantry match:", error);
      res.json({ matches: [] });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
