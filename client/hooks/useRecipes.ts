import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Recipe, PantryItem, ShoppingListItem } from "@/types/recipe";
import { apiRequest, getApiUrl } from "@/lib/query-client";

const RECIPES_STORAGE_KEY = "@kitch_recipes";
const PANTRY_STORAGE_KEY = "@kitch_pantry";
const SHOPPING_LIST_STORAGE_KEY = "@kitch_shopping_list";

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

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedRecipe: Partial<Recipe> & { id: string }) => {
      const recipes = await getStoredRecipes();
      const newRecipes = recipes.map((r) =>
        r.id === updatedRecipe.id ? { ...r, ...updatedRecipe } : r
      );
      await saveRecipesToStorage(newRecipes);
      return newRecipes.find((r) => r.id === updatedRecipe.id);
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

// Shopping List Storage
async function getStoredShoppingList(): Promise<ShoppingListItem[]> {
  try {
    const data = await AsyncStorage.getItem(SHOPPING_LIST_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveShoppingListToStorage(items: ShoppingListItem[]): Promise<void> {
  await AsyncStorage.setItem(SHOPPING_LIST_STORAGE_KEY, JSON.stringify(items));
}

// Shopping List Hooks
export function useShoppingList() {
  return useQuery<ShoppingListItem[]>({
    queryKey: ["shoppingList"],
    queryFn: getStoredShoppingList,
    staleTime: Infinity,
  });
}

export function useSaveShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: ShoppingListItem[]) => {
      await saveShoppingListToStorage(items);
      return items;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
    },
  });
}

export function useToggleShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const items = await getStoredShoppingList();
      const newItems = items.map((item) =>
        item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
      );
      await saveShoppingListToStorage(newItems);
      return newItems;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
    },
  });
}

export function useRemoveShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const items = await getStoredShoppingList();
      const newItems = items.filter((item) => item.id !== itemId);
      await saveShoppingListToStorage(newItems);
      return newItems;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
    },
  });
}

export function useClearShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await saveShoppingListToStorage([]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
    },
  });
}

export function useAddToShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItems: Omit<ShoppingListItem, "id">[]) => {
      const existing = await getStoredShoppingList();
      const itemsWithIds: ShoppingListItem[] = newItems.map((item) => ({
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));
      const merged = [...existing, ...itemsWithIds];
      await saveShoppingListToStorage(merged);
      return merged;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
    },
  });
}

export function useClearCheckedItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const items = await getStoredShoppingList();
      const newItems = items.filter((item) => !item.isChecked);
      await saveShoppingListToStorage(newItems);
      return newItems;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
    },
  });
}
