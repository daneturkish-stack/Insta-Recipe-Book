import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import { randomUUID } from "crypto";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface PageContent {
  text: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  profileImageUrl: string | null;
}

async function fetchPageContent(url: string): Promise<PageContent> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.log(`Failed to fetch ${url}: ${response.status}`);
      return { text: null, imageUrl: null, videoUrl: null, profileImageUrl: null };
    }

    const html = await response.text();
    
    const extractedContent: string[] = [];
    let imageUrl: string | null = null;
    let videoUrl: string | null = null;
    let profileImageUrl: string | null = null;
    
    // Helper to decode HTML entities
    const decodeHtmlEntities = (str: string) => {
      return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    };
    
    // Extract image URL (og:image)
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImageMatch) {
      imageUrl = decodeHtmlEntities(ogImageMatch[1]);
    }
    
    // Extract video URL (og:video)
    const ogVideoMatch = html.match(/<meta[^>]*property=["']og:video["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:video["']/i) ||
                         html.match(/<meta[^>]*property=["']og:video:url["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:video:url["']/i);
    if (ogVideoMatch) {
      videoUrl = decodeHtmlEntities(ogVideoMatch[1]);
    }
    
    // Also try to find video URLs in JSON data
    const videoUrlPatterns = [
      /"video_url"\s*:\s*"([^"]+)"/,
      /"playback_url"\s*:\s*"([^"]+)"/,
      /"contentUrl"\s*:\s*"([^"]+)"/,
    ];
    
    if (!videoUrl) {
      for (const pattern of videoUrlPatterns) {
        const match = html.match(pattern);
        if (match) {
          videoUrl = match[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
          break;
        }
      }
    }
    
    // Also try to find high-res images in JSON
    const imageUrlPatterns = [
      /"display_url"\s*:\s*"([^"]+)"/,
      /"thumbnail_url"\s*:\s*"([^"]+)"/,
    ];
    
    if (!imageUrl) {
      for (const pattern of imageUrlPatterns) {
        const match = html.match(pattern);
        if (match) {
          imageUrl = match[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
          break;
        }
      }
    }
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      extractedContent.push(`Page Title: ${titleMatch[1]}`);
    }
    
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    if (metaDescMatch) {
      extractedContent.push(`Description: ${metaDescMatch[1]}`);
    }
    
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
    if (ogDescMatch) {
      extractedContent.push(`Post Content: ${ogDescMatch[1]}`);
    }
    
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    if (ogTitleMatch) {
      extractedContent.push(`Post Title: ${ogTitleMatch[1]}`);
    }

    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const jsonData = JSON.parse(match[1]);
        if (jsonData.description) {
          extractedContent.push(`Structured Data: ${jsonData.description}`);
        }
        if (jsonData.name) {
          extractedContent.push(`Name: ${jsonData.name}`);
        }
        if (jsonData.caption) {
          extractedContent.push(`Caption: ${jsonData.caption}`);
        }
        // Extract media from JSON-LD
        if (jsonData.thumbnailUrl && !imageUrl) {
          imageUrl = jsonData.thumbnailUrl;
        }
        if (jsonData.contentUrl && !videoUrl) {
          videoUrl = jsonData.contentUrl;
        }
      } catch (e) {
      }
    }

    const captionPatterns = [
      /"caption"\s*:\s*"([^"]+)"/g,
      /"text"\s*:\s*"([^"]+)"/g,
      /"description"\s*:\s*"([^"]+)"/g,
    ];
    
    for (const pattern of captionPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const text = match[1];
        if (text.length > 50 && text.length < 5000 && !extractedContent.some(c => c.includes(text))) {
          extractedContent.push(`Content: ${text.replace(/\\n/g, '\n').replace(/\\u[\dA-Fa-f]{4}/g, '')}`);
        }
      }
    }

    // Extract profile/avatar image
    const profileImagePatterns = [
      /"profile_pic_url"\s*:\s*"([^"]+)"/,
      /"profile_pic_url_hd"\s*:\s*"([^"]+)"/,
      /"avatarThumb"\s*:\s*"([^"]+)"/,
      /"avatarMedium"\s*:\s*"([^"]+)"/,
      /"avatar"\s*:\s*"([^"]+)"/,
      /"owner"\s*:\s*\{[^}]*"profile_pic_url"\s*:\s*"([^"]+)"/,
    ];
    
    for (const pattern of profileImagePatterns) {
      const match = html.match(pattern);
      if (match) {
        profileImageUrl = decodeHtmlEntities(match[1].replace(/\\u0026/g, '&').replace(/\\/g, ''));
        break;
      }
    }

    console.log(`Extracted media - Image: ${imageUrl ? 'found' : 'none'}, Video: ${videoUrl ? 'found' : 'none'}, Profile: ${profileImageUrl ? 'found' : 'none'}`);

    return {
      text: extractedContent.length > 0 ? extractedContent.join('\n\n') : null,
      imageUrl,
      videoUrl,
      profileImageUrl,
    };
  } catch (error) {
    console.error("Error fetching page content:", error);
    return { text: null, imageUrl: null, videoUrl: null, profileImageUrl: null };
  }
}

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

      // Fetch actual content from the page
      console.log(`Fetching content from: ${url}`);
      const pageData = await fetchPageContent(url);
      console.log(`Extracted content: ${pageData.text ? 'Found text' : 'No text'}`);
      console.log(`Image URL: ${pageData.imageUrl || 'none'}`);
      console.log(`Video URL: ${pageData.videoUrl || 'none'}`);

      const systemPrompt = `You are a professional recipe extraction assistant for the Kitch app. Your job is to extract and structure recipes from social media food posts.

CRITICAL: You MUST extract the ACTUAL recipe from the provided content. Do NOT make up or hallucinate recipes. The recipe title, ingredients, and instructions should come directly from the content provided.

If the content describes a specific dish (like "almond tart", "chocolate cake", "pasta carbonara"), the recipe you output MUST be for that exact dish.

Extract and categorize with:
1. dishType: One from [Breakfast, Lunch, Dinner, Dessert, Snack, Appetizer, Soup, Salad, Pasta, Rice & Grains, Sandwich, Pizza, Seafood, Meat, Vegetarian, Baked Goods, Drinks, Sauce]
2. vibeTags: 2-4 tags from [Quick & Easy, 15-Min Meals, 30-Min Meals, One-Pot, Meal Prep, Budget-Friendly, High-Protein, Low-Carb, Vegan, Vegetarian, Gluten-Free, Dairy-Free, Keto, Comfort Food, Healthy, Indulgent, Kid-Friendly, Date Night, Lazy Sunday, Party Food, Batch Cooking]
3. creatorHandle: Extract from content if available
4. creatorName: Extract from content if available
5. isEstimated: Set to true if you had to estimate/infer ANY ingredient quantities, measurements, or steps that were not explicitly stated in the source content. Set to false only if all details were explicitly provided.

If specific measurements or steps are not provided, make reasonable estimates based on the dish type, but NEVER change what dish it is.

Respond ONLY with a valid JSON object:
{
  "title": "Recipe Name",
  "description": "A brief appetizing description (2-3 sentences)",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "dishType": "Dessert",
  "vibeTags": ["Quick & Easy", "Indulgent"],
  "creatorHandle": "@foodcreator",
  "creatorName": "Chef Name",
  "isEstimated": true,
  "ingredients": [
    {"name": "ingredient name", "amount": "1", "unit": "cup"}
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ]
}`;

      let userPrompt: string;
      
      if (pageData.text) {
        userPrompt = `Extract the recipe from this ${platform} food post.

SOURCE URL: ${url}

EXTRACTED CONTENT FROM THE POST:
${pageData.text}

Based on the above content, extract the EXACT recipe being shown. The recipe title and dish type MUST match what's described in the content. Include:
- The actual recipe title from the post
- Brief description
- Prep and cook times (estimate if not provided)
- Number of servings (estimate if not provided)
- Appropriate dish type category
- 2-4 relevant tags
- Creator info if available
- Complete ingredient list with measurements
- Step-by-step instructions

IMPORTANT: Do NOT make up a different recipe. Extract what's actually in the post.`;
      } else {
        userPrompt = `I need to extract a recipe from this ${platform} URL, but I couldn't fetch the full content: ${url}

Please analyze the URL carefully. If it contains any hints about the recipe (like keywords in the URL path), use those to determine what dish this is.

If you cannot determine the specific recipe from the URL, respond with this error format:
{
  "error": "Could not extract recipe content. Please try pasting the recipe description or ingredients directly.",
  "title": null
}

Otherwise, if you can identify the dish from the URL, provide a complete recipe for that specific dish.`
      }

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

      // Check if AI returned an error response
      if (recipeData.error || !recipeData.title) {
        return res.status(400).json({
          error: recipeData.error || "Could not extract recipe from this post. The content may not contain a recipe, or try pasting the recipe text directly.",
        });
      }

      const recipe = {
        id: randomUUID(),
        title: recipeData.title,
        description: recipeData.description || "",
        imageUrl: pageData.imageUrl || null,
        videoUrl: pageData.videoUrl || null,
        sourceUrl: url,
        prepTime: recipeData.prepTime || null,
        cookTime: recipeData.cookTime || null,
        servings: recipeData.servings || null,
        dishType: recipeData.dishType || null,
        vibeTags: recipeData.vibeTags || [],
        creatorHandle: recipeData.creatorHandle || creatorHandle || null,
        creatorName: recipeData.creatorName || null,
        creatorAvatar: pageData.profileImageUrl || null,
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        originalTranscript: pageData.text || null,
        isEstimated: recipeData.isEstimated ?? true,
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
