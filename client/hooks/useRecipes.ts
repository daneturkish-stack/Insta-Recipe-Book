import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Recipe, PantryItem } from "@/types/recipe";
import { apiRequest, getApiUrl } from "@/lib/query-client";

const RECIPES_STORAGE_KEY = "@kitch_recipes";
const PANTRY_STORAGE_KEY = "@kitch_pantry";

// Recipe Storage
async function getStoredRecipes(): Promise<Recipe[]> {
  try {
    const data = await AsyncStorage.getItem(RECIPES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveRecipesToStorage(recipes: Recipe[]): Promise<void> {
  await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
}

// Pantry Storage
async function getStoredPantry(): Promise<PantryItem[]> {
  try {
    const data = await AsyncStorage.getItem(PANTRY_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function savePantryToStorage(items: PantryItem[]): Promise<void> {
  await AsyncStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(items));
}

// Recipe Hooks
export function useRecipes() {
  return useQuery<Recipe[]>({
    queryKey: ["recipes"],
    queryFn: getStoredRecipes,
    staleTime: Infinity,
  });
}

export function useRecipe(id: string) {
  const { data: recipes } = useRecipes();
  return recipes?.find((r) => r.id === id);
}

export function useSaveRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipe: Recipe) => {
      const recipes = await getStoredRecipes();
      const newRecipes = [recipe, ...recipes];
      await saveRecipesToStorage(newRecipes);
      return recipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: string) => {
      const recipes = await getStoredRecipes();
      const newRecipes = recipes.filter((r) => r.id !== recipeId);
      await saveRecipesToStorage(newRecipes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useGenerateRecipe() {
  return useMutation({
    mutationFn: async (sourceUrl: string): Promise<Recipe> => {
      const response = await apiRequest("POST", "/api/recipes/generate", {
        url: sourceUrl,
      });
      const data = await response.json();
      return data;
    },
  });
}

// Pantry Hooks
export function usePantry() {
  return useQuery<PantryItem[]>({
    queryKey: ["pantry"],
    queryFn: getStoredPantry,
    staleTime: Infinity,
  });
}

export function useAddPantryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<PantryItem, "id" | "addedAt">) => {
      const items = await getStoredPantry();
      const newItem: PantryItem = {
        ...item,
        id: Date.now().toString(),
        addedAt: new Date().toISOString(),
      };
      const newItems = [...items, newItem];
      await savePantryToStorage(newItems);
      return newItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pantry"] });
    },
  });
}

export function useRemovePantryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const items = await getStoredPantry();
      const newItems = items.filter((i) => i.id !== itemId);
      await savePantryToStorage(newItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pantry"] });
    },
  });
}

export function useClearPantry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await savePantryToStorage([]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pantry"] });
    },
  });
}

// Smart Search Hook
export function useSmartSearch() {
  return useMutation({
    mutationFn: async ({ query, recipes }: { query: string; recipes: Recipe[] }): Promise<string[]> => {
      const response = await apiRequest("POST", "/api/recipes/search", {
        query,
        recipes,
      });
      const data = await response.json();
      return data.matchingIds || [];
    },
  });
}

// Pantry Match Hook
export function usePantryMatch() {
  return useMutation({
    mutationFn: async ({ pantryItems, recipes }: { pantryItems: string[]; recipes: Recipe[] }) => {
      const response = await apiRequest("POST", "/api/recipes/pantry-match", {
        pantryItems,
        recipes,
      });
      const data = await response.json();
      return data.matches || [];
    },
  });
}
