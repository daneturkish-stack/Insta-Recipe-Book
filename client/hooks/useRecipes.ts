import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Recipe } from "@/types/recipe";
import { apiRequest, getApiUrl } from "@/lib/query-client";

const RECIPES_STORAGE_KEY = "@kitch_recipes";

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
    mutationFn: async (instagramUrl: string): Promise<Recipe> => {
      const response = await apiRequest("POST", "/api/recipes/generate", {
        url: instagramUrl,
      });
      const data = await response.json();
      return data;
    },
  });
}
