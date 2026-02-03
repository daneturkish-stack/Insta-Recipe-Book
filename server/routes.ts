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

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/recipes/generate", async (req: Request, res: Response) => {
    try {
      const { url } = req.body as GenerateRecipeRequest;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const instagramPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels)\/[\w-]+/i;
      if (!instagramPattern.test(url)) {
        return res.status(400).json({ error: "Invalid Instagram URL" });
      }

      const systemPrompt = `You are a professional recipe extraction assistant. Your job is to take Instagram food post URLs and generate complete, cookbook-quality recipes.

When given an Instagram URL, analyze what the post might contain based on the URL and generate a realistic, detailed recipe. Since you cannot actually access the Instagram content, create a plausible recipe based on the URL patterns (like the post ID or username if visible).

Generate recipes that are:
- Complete with all ingredients (with precise measurements)
- Clear step-by-step instructions
- Realistic cooking and prep times
- Appropriate serving sizes

Always respond with a valid JSON object in this exact format:
{
  "title": "Recipe Name",
  "description": "A brief appetizing description of the dish",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "ingredients": [
    {"name": "ingredient name", "amount": "1", "unit": "cup"}
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ]
}

Make the recipes diverse - include various cuisines, dietary preferences, and cooking techniques. Be creative but realistic.`;

      const userPrompt = `Generate a complete, detailed recipe from this Instagram food post: ${url}

Create a realistic, delicious recipe that someone might share on Instagram. Include:
- A catchy, appetizing title
- Brief description (2-3 sentences)
- Realistic prep and cook times in minutes
- Number of servings
- Complete ingredient list with precise measurements
- Detailed step-by-step cooking instructions (5-10 steps)

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
        sourceUrl: url,
        prepTime: recipeData.prepTime || null,
        cookTime: recipeData.cookTime || null,
        servings: recipeData.servings || null,
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
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

  const httpServer = createServer(app);
  return httpServer;
}
