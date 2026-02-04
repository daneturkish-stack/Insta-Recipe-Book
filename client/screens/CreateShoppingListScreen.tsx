import React, { useState, useMemo, useCallback } from "react";
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { usePantry, useSaveShoppingList, useShoppingList } from "@/hooks/useRecipes";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { CollectionStackParamList } from "@/navigation/CollectionStackNavigator";
import type { Recipe, Ingredient, ShoppingListItem, AisleCategory } from "@/types/recipe";

type RouteParams = RouteProp<CollectionStackParamList, "CreateShoppingList">;

interface AggregatedIngredient {
  name: string;
  amounts: { amount: string; unit: string }[];
  recipeIds: string[];
  recipeTitles: string[];
}

function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/\s+/g, " ")
    .replace(/s$/, "");
}

function aggregateIngredients(recipes: Recipe[]): AggregatedIngredient[] {
  const ingredientMap = new Map<string, AggregatedIngredient>();

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients || []) {
      const normalizedName = normalizeIngredientName(ingredient.name);
      const existing = ingredientMap.get(normalizedName);

      if (existing) {
        existing.amounts.push({ amount: ingredient.amount, unit: ingredient.unit });
        if (!existing.recipeIds.includes(recipe.id)) {
          existing.recipeIds.push(recipe.id);
          existing.recipeTitles.push(recipe.title);
        }
      } else {
        ingredientMap.set(normalizedName, {
          name: ingredient.name,
          amounts: [{ amount: ingredient.amount, unit: ingredient.unit }],
          recipeIds: [recipe.id],
          recipeTitles: [recipe.title],
        });
      }
    }
  }

  return Array.from(ingredientMap.values());
}

function formatAmounts(amounts: { amount: string; unit: string }[]): { amount: string; unit: string } {
  if (amounts.length === 1) {
    return amounts[0];
  }

  const unitGroups = new Map<string, number>();
  for (const { amount, unit } of amounts) {
    const numAmount = parseFloat(amount) || 0;
    const normalizedUnit = unit.toLowerCase().trim();
    unitGroups.set(normalizedUnit, (unitGroups.get(normalizedUnit) || 0) + numAmount);
  }

  if (unitGroups.size === 1) {
    const [unit, total] = Array.from(unitGroups.entries())[0];
    return { amount: total.toString(), unit };
  }

  const parts: string[] = [];
  for (const [unit, total] of unitGroups.entries()) {
    parts.push(`${total}${unit ? " " + unit : ""}`);
  }
  return { amount: parts.join(" + "), unit: "" };
}

export default function CreateShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const { recipes } = route.params;
  
  const { data: pantryItems } = usePantry();
  const { data: existingList } = useShoppingList();
  const saveShoppingList = useSaveShoppingList();

  const [isProcessing, setIsProcessing] = useState(false);
  const [categorizedItems, setCategorizedItems] = useState<ShoppingListItem[] | null>(null);

  const aggregatedIngredients = useMemo(() => aggregateIngredients(recipes), [recipes]);

  const pantryIngredientNames = useMemo(() => {
    return new Set(
      pantryItems?.map((item) => normalizeIngredientName(item.name)) || []
    );
  }, [pantryItems]);

  const categorizeIngredients = useCallback(async () => {
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const ingredientNames = aggregatedIngredients.map((i) => i.name);
      
      const response = await fetch(
        new URL("/api/shopping-list/categorize", getApiUrl()).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ingredients: ingredientNames }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const categoryMap = new Map<string, AisleCategory>(
        data.categories.map((c: { name: string; aisle: AisleCategory }) => [
          normalizeIngredientName(c.name),
          c.aisle,
        ])
      );

      const items: ShoppingListItem[] = aggregatedIngredients.map((ingredient) => {
        const normalizedName = normalizeIngredientName(ingredient.name);
        const formattedAmounts = formatAmounts(ingredient.amounts);
        const inPantry = pantryIngredientNames.has(normalizedName);
        
        return {
          id: Date.now().toString() + "_" + normalizedName.replace(/\s/g, "_"),
          name: ingredient.name,
          amount: formattedAmounts.amount,
          unit: formattedAmounts.unit,
          aisle: categoryMap.get(normalizedName) || "other",
          isChecked: false,
          inPantry,
          recipeIds: ingredient.recipeIds,
          recipeTitles: ingredient.recipeTitles,
        };
      });

      setCategorizedItems(items);
    } catch (error) {
      console.error("Error categorizing ingredients:", error);
      const items: ShoppingListItem[] = aggregatedIngredients.map((ingredient) => {
        const normalizedName = normalizeIngredientName(ingredient.name);
        const formattedAmounts = formatAmounts(ingredient.amounts);
        const inPantry = pantryIngredientNames.has(normalizedName);
        
        return {
          id: Date.now().toString() + "_" + normalizedName.replace(/\s/g, "_"),
          name: ingredient.name,
          amount: formattedAmounts.amount,
          unit: formattedAmounts.unit,
          aisle: "other",
          isChecked: false,
          inPantry,
          recipeIds: ingredient.recipeIds,
          recipeTitles: ingredient.recipeTitles,
        };
      });
      setCategorizedItems(items);
    } finally {
      setIsProcessing(false);
    }
  }, [aggregatedIngredients, pantryIngredientNames]);

  const handleSaveList = useCallback(async () => {
    if (!categorizedItems) return;
    
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const newItems = categorizedItems.filter((item) => !item.inPantry);
      const mergedList = [...(existingList || []), ...newItems];
      await saveShoppingList.mutateAsync(mergedList);
      navigation.replace("ShoppingList");
    } catch (error) {
      console.error("Error saving shopping list:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [categorizedItems, existingList, saveShoppingList, navigation]);

  const inPantryCount = categorizedItems?.filter((i) => i.inPantry).length || 0;
  const shoppingCount = categorizedItems?.filter((i) => !i.inPantry).length || 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText type="h3" style={[styles.sectionTitle, { color: theme.text }]}>
            Selected Recipes
          </ThemedText>
          <View style={styles.recipesList}>
            {recipes.map((recipe, index) => (
              <Animated.View
                key={recipe.id}
                entering={FadeInDown.delay(index * 50)}
                style={[styles.recipeChip, { backgroundColor: theme.backgroundDefault }]}
              >
                <ThemedText type="body" style={{ color: theme.text }}>
                  {recipe.title}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {recipe.ingredients?.length || 0} ingredients
                </ThemedText>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={[styles.sectionTitle, { color: theme.text }]}>
            Ingredients ({aggregatedIngredients.length})
          </ThemedText>
          
          {categorizedItems ? (
            <View style={styles.ingredientsList}>
              {inPantryCount > 0 ? (
                <View style={[styles.pantrySection, { backgroundColor: theme.primary + "10" }]}>
                  <View style={styles.pantrySectionHeader}>
                    <Feather name="check-circle" size={18} color={theme.primary} />
                    <ThemedText type="bodyMedium" style={{ color: theme.primary, marginLeft: Spacing.sm }}>
                      Already in your pantry ({inPantryCount})
                    </ThemedText>
                  </View>
                  {categorizedItems.filter((i) => i.inPantry).map((item) => (
                    <View key={item.id} style={styles.pantryItem}>
                      <ThemedText type="body" style={{ color: theme.textSecondary, textDecorationLine: "line-through" }}>
                        {item.name}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}

              <ThemedText type="bodyMedium" style={[styles.subheading, { color: theme.text }]}>
                To buy ({shoppingCount})
              </ThemedText>
              {categorizedItems.filter((i) => !i.inPantry).map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(index * 30)}
                  style={[styles.ingredientItem, { backgroundColor: theme.backgroundDefault }]}
                >
                  <View style={styles.ingredientMain}>
                    <ThemedText type="bodyMedium" style={{ color: theme.text }}>
                      {item.name}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {item.amount} {item.unit}
                    </ThemedText>
                  </View>
                  <View style={[styles.aisleBadge, { backgroundColor: theme.accent + "15" }]}>
                    <ThemedText type="caption" style={{ color: theme.accent, fontWeight: "600" }}>
                      {item.aisle.charAt(0).toUpperCase() + item.aisle.slice(1)}
                    </ThemedText>
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.generateSection}>
              <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginBottom: Spacing.lg }}>
                Generate your shopping list to see ingredients organized by aisle, with items you already have marked as "In Pantry"
              </ThemedText>
              <Pressable
                onPress={categorizeIngredients}
                disabled={isProcessing}
                style={[styles.generateButton, { backgroundColor: theme.primary }]}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Feather name="zap" size={20} color="#FFF" />
                    <ThemedText type="bodyMedium" style={{ color: "#FFF", marginLeft: Spacing.sm }}>
                      Generate Shopping List
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {categorizedItems ? (
        <Animated.View
          entering={FadeIn}
          style={[
            styles.bottomBar,
            { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.md },
          ]}
        >
          <Pressable
            onPress={handleSaveList}
            disabled={isProcessing || shoppingCount === 0}
            style={[
              styles.saveButton,
              { backgroundColor: shoppingCount > 0 ? theme.primary : theme.textSecondary },
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Feather name="check" size={20} color="#FFF" />
                <ThemedText type="bodyMedium" style={{ color: "#FFF", marginLeft: Spacing.sm }}>
                  {shoppingCount > 0 ? `Add ${shoppingCount} Items to List` : "Nothing to Add"}
                </ThemedText>
              </>
            )}
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  recipesList: {
    gap: Spacing.sm,
  },
  recipeChip: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ingredientsList: {
    gap: Spacing.sm,
  },
  pantrySection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  pantrySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  pantryItem: {
    paddingLeft: Spacing.xl,
    paddingVertical: Spacing.xs,
  },
  subheading: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ingredientItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ingredientMain: {
    flex: 1,
  },
  aisleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  generateSection: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
});
