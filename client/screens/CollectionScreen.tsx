import React, { useState, useCallback, useMemo } from "react";
import { StyleSheet, View, FlatList, RefreshControl, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeCardSkeleton } from "@/components/RecipeCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { RemyChatBar } from "@/components/RemyChatBar";
import { useTheme } from "@/hooks/useTheme";
import { useRecipes, useSmartSearch, usePantry } from "@/hooks/useRecipes";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { Recipe } from "@/types/recipe";
import { getApiUrl } from "@/lib/query-client";

const emptyImage = require("../../assets/images/empty-collection.png");

type QuickAction = "pantry" | "quick" | "healthy" | null;

interface RemyResponse {
  message: string;
  matchedRecipeIds: string[];
  suggestion?: string;
}

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { data: recipes, isLoading, refetch, isRefetching } = useRecipes();
  const { data: pantryItems } = usePantry();
  const smartSearch = useSmartSearch();

  const [isRemyThinking, setIsRemyThinking] = useState(false);
  const [remyResponse, setRemyResponse] = useState<RemyResponse | null>(null);
  const [activeQuickAction, setActiveQuickAction] = useState<QuickAction>(null);
  const [filteredIds, setFilteredIds] = useState<string[] | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());

  const quickActions = [
    { id: "pantry" as QuickAction, label: "What can I make?", icon: "package" as const },
    { id: "quick" as QuickAction, label: "15-min meals", icon: "zap" as const },
    { id: "healthy" as QuickAction, label: "Healthy options", icon: "heart" as const },
  ];

  const askRemy = useCallback(async (query: string, quickAction?: QuickAction) => {
    if (!recipes || recipes.length === 0) {
      setRemyResponse({
        message: "You don't have any saved recipes yet! Save some recipes from Instagram or TikTok and I'll help you find the perfect dish.",
        matchedRecipeIds: [],
      });
      return;
    }

    setIsRemyThinking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const pantryContext = pantryItems?.map(item => item.name).join(", ") || "";
      
      let systemPrompt = "";
      if (quickAction === "pantry") {
        systemPrompt = `User wants to know what they can cook with their pantry items: ${pantryContext || "No pantry items saved"}. Find recipes that match their available ingredients.`;
      } else if (quickAction === "quick") {
        systemPrompt = "User wants quick meals that take 15 minutes or less total time (prep + cook).";
      } else if (quickAction === "healthy") {
        systemPrompt = "User wants healthy recipe options. Look for recipes with 'Healthy', 'Light', 'Vegan', 'Vegetarian', or low-calorie vibes.";
      }

      const response = await fetch(
        new URL("/api/remy/search", getApiUrl()).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: query || systemPrompt,
            recipes,
            pantryItems: pantryItems || [],
            quickAction,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setRemyResponse({
        message: data.message,
        matchedRecipeIds: data.matchedRecipeIds || [],
        suggestion: data.suggestion,
      });
      setFilteredIds(data.matchedRecipeIds || null);
    } catch (error) {
      setRemyResponse({
        message: "Oops! I had a little hiccup. Let me show you all your recipes instead.",
        matchedRecipeIds: [],
      });
      setFilteredIds(null);
    } finally {
      setIsRemyThinking(false);
    }
  }, [recipes, pantryItems]);

  const handleQuickAction = (action: QuickAction) => {
    setActiveQuickAction(action);
    askRemy("", action);
  };

  const handleChatSubmit = useCallback((query: string) => {
    setActiveQuickAction(null);
    askRemy(query);
  }, [askRemy]);

  const handleShowAll = () => {
    setRemyResponse(null);
    setFilteredIds(null);
    setActiveQuickAction(null);
    Haptics.selectionAsync();
  };

  const displayedRecipes = useMemo(() => {
    if (!recipes) return [];
    if (filteredIds === null) return recipes;
    if (filteredIds.length === 0) return [];
    
    const orderMap = new Map(filteredIds.map((id, i) => [id, i]));
    return recipes
      .filter((r) => filteredIds.includes(r.id))
      .sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
  }, [recipes, filteredIds]);

  const handleRecipePress = useCallback((recipe: Recipe) => {
    navigation.navigate("RecipeDetail", { recipeId: recipe.id });
  }, [navigation]);

  const handleLongPress = useCallback((recipeId: string) => {
    setIsSelectMode(true);
    setSelectedRecipeIds(new Set([recipeId]));
  }, []);

  const handleToggleSelect = useCallback((recipeId: string) => {
    setSelectedRecipeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
        if (newSet.size === 0) {
          setIsSelectMode(false);
        }
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  }, []);

  const handleCancelSelect = useCallback(() => {
    setIsSelectMode(false);
    setSelectedRecipeIds(new Set());
  }, []);

  const handleCreateShoppingList = useCallback(() => {
    const selectedRecipes = recipes?.filter((r) => selectedRecipeIds.has(r.id)) || [];
    navigation.navigate("CreateShoppingList", { recipes: selectedRecipes });
    handleCancelSelect();
  }, [recipes, selectedRecipeIds, navigation]);

  const renderItem = useCallback(({ item, index }: { item: Recipe; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={styles.cardWrapper}
    >
      <RecipeCard 
        recipe={item} 
        onPress={() => handleRecipePress(item)}
        onLongPress={() => handleLongPress(item.id)}
        isSelectable={isSelectMode}
        isSelected={selectedRecipeIds.has(item.id)}
        onSelect={() => handleToggleSelect(item.id)}
      />
    </Animated.View>
  ), [handleRecipePress, handleLongPress, isSelectMode, selectedRecipeIds, handleToggleSelect]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        image={emptyImage}
        title={remyResponse ? "No matching recipes" : "No recipes yet"}
        subtitle={remyResponse 
          ? remyResponse.suggestion || "Try a different question or save more recipes"
          : "Save your first recipe from Instagram or TikTok and build your personal cookbook"
        }
      />
    </View>
  );

  const renderLoading = () => (
    <View style={styles.grid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.cardWrapper}>
          <RecipeCardSkeleton />
        </View>
      ))}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Remy Greeting & Chat Bar */}
      <RemyChatBar 
        onSubmit={handleChatSubmit}
        disabled={isRemyThinking}
      />

      {/* Quick Action Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickActionsContainer}
        contentContainerStyle={styles.quickActionsContent}
      >
        {quickActions.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => handleQuickAction(action.id)}
            style={[
              styles.quickActionChip,
              { 
                backgroundColor: activeQuickAction === action.id ? theme.primary : theme.backgroundDefault,
                borderColor: activeQuickAction === action.id ? theme.primary : theme.border,
              },
            ]}
          >
            <Feather 
              name={action.icon} 
              size={14} 
              color={activeQuickAction === action.id ? "#FFF" : theme.text} 
            />
            <ThemedText 
              type="caption" 
              style={{ 
                color: activeQuickAction === action.id ? "#FFF" : theme.text,
                fontWeight: "600",
                marginLeft: Spacing.xs,
              }}
            >
              {action.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Remy Response Bubble */}
      {isRemyThinking ? (
        <Animated.View 
          entering={FadeIn.duration(200)}
          style={[styles.remyResponseBubble, { backgroundColor: theme.primary + "15", borderColor: theme.primary + "30" }]}
        >
          <View style={styles.thinkingContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
            <ThemedText type="body" style={[styles.thinkingText, { color: theme.textSecondary }]}>
              Remi is thinking...
            </ThemedText>
          </View>
        </Animated.View>
      ) : remyResponse ? (
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={[styles.remyResponseBubble, { backgroundColor: theme.primary + "15", borderColor: theme.primary + "30" }]}
        >
          <View style={styles.responseHeader}>
            <View style={[styles.remyAvatarSmall, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.remyEmojiSmall}>👨‍🍳</ThemedText>
            </View>
            <ThemedText type="bodyMedium" style={{ color: theme.text, flex: 1 }}>
              {remyResponse.message}
            </ThemedText>
          </View>
          <Pressable onPress={handleShowAll} style={styles.showAllLink}>
            <ThemedText type="caption" style={{ color: theme.primary, fontWeight: "600" }}>
              Show all recipes
            </ThemedText>
            <Feather name="x" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
          </Pressable>
        </Animated.View>
      ) : null}

      {/* Results Count */}
      {!isLoading && recipes && recipes.length > 0 ? (
        <View style={styles.resultsHeader}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {filteredIds !== null 
              ? `${displayedRecipes.length} recipe${displayedRecipes.length !== 1 ? 's' : ''} found`
              : `${recipes.length} saved recipe${recipes.length !== 1 ? 's' : ''}`
            }
          </ThemedText>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        key="recipe-grid"
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: tabBarHeight + Spacing.xl + (isSelectMode ? 80 : 0),
            flexGrow: isLoading || displayedRecipes?.length === 0 ? 1 : undefined,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={isLoading ? [] : displayedRecipes}
        keyExtractor={(item) => item.id}
        renderItem={isLoading ? () => null : renderItem}
        numColumns={2}
        columnWrapperStyle={isLoading || (displayedRecipes?.length ?? 0) === 0 ? undefined : styles.row}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={isLoading ? renderLoading : renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
      
      {isSelectMode ? (
        <Animated.View 
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.selectionBar,
            { 
              backgroundColor: theme.backgroundDefault,
              paddingBottom: insets.bottom + Spacing.md,
            }
          ]}
        >
          <View style={styles.selectionBarContent}>
            <Pressable onPress={handleCancelSelect} style={styles.selectionCancelButton}>
              <Feather name="x" size={20} color={theme.text} />
            </Pressable>
            <ThemedText type="bodyMedium" style={{ color: theme.text, flex: 1, textAlign: "center" }}>
              {selectedRecipeIds.size} recipe{selectedRecipeIds.size !== 1 ? "s" : ""} selected
            </ThemedText>
            <Pressable 
              onPress={handleCreateShoppingList}
              style={[styles.shoppingListButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="shopping-cart" size={18} color="#FFF" />
              <ThemedText type="bodyMedium" style={{ color: "#FFF", marginLeft: Spacing.sm }}>
                Add to List
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  quickActionsContainer: {
    marginBottom: Spacing.md,
    marginHorizontal: -Spacing.lg,
  },
  quickActionsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  quickActionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  remyResponseBubble: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  remyAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  remyEmojiSmall: {
    fontSize: 14,
  },
  thinkingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  thinkingText: {
    marginLeft: Spacing.sm,
  },
  showAllLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    alignSelf: "flex-end",
  },
  resultsHeader: {
    marginTop: Spacing.sm,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  cardWrapper: {
    width: "48%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  selectionBar: {
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
  selectionBarContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectionCancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  shoppingListButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
});
