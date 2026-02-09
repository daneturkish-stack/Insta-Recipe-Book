import React, { useState, useCallback, useMemo } from "react";
import { StyleSheet, View, FlatList, RefreshControl, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeCardSkeleton } from "@/components/RecipeCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { RemyChatBar } from "@/components/RemyChatBar";
import { useTheme } from "@/hooks/useTheme";
import { useRecipes, useSmartSearch, usePantry, usePantryMatch } from "@/hooks/useRecipes";
import { useShakeDetector } from "@/hooks/useShakeDetector";
import { Spacing, BorderRadius, KitchColors } from "@/constants/theme";
import type { Recipe } from "@/types/recipe";
import { getApiUrl } from "@/lib/query-client";

const emptyImage = require("../../assets/images/empty-collection.png");

type QuickAction = "pantry" | "quick" | "healthy" | null;
type ViewMode = "grid-2" | "grid-1" | "list";

interface RemyResponse {
  message: string;
  matchedRecipeIds: string[];
  suggestion?: string;
}

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { data: recipes, isLoading, refetch, isRefetching } = useRecipes();
  const { data: pantryItems } = usePantry();
  const smartSearch = useSmartSearch();
  const pantryMatch = usePantryMatch();

  const [isRemyThinking, setIsRemyThinking] = useState(false);
  const [remyResponse, setRemyResponse] = useState<RemyResponse | null>(null);
  const [activeQuickAction, setActiveQuickAction] = useState<QuickAction>(null);
  const [filteredIds, setFilteredIds] = useState<string[] | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const [isRouletteActive, setIsRouletteActive] = useState(false);
  const [rouletteRecipe, setRouletteRecipe] = useState<Recipe | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid-2");

  const rouletteScale = useSharedValue(0);
  const rouletteOpacity = useSharedValue(0);

  const rouletteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rouletteScale.value }],
    opacity: rouletteOpacity.value,
  }));

  const handleRecipeRoulette = useCallback(async () => {
    if (!recipes || recipes.length === 0 || isRouletteActive) return;

    setIsRouletteActive(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    let eligibleRecipes = recipes;

    if (pantryItems && pantryItems.length > 0) {
      try {
        const matches = await pantryMatch.mutateAsync({
          pantryItems: pantryItems.map(p => p.name),
          recipes,
        });
        
        const matchedIds = matches
          .filter((m: any) => m.matchPercentage >= 50)
          .map((m: any) => m.id);
        
        if (matchedIds.length > 0) {
          eligibleRecipes = recipes.filter(r => matchedIds.includes(r.id));
        }
      } catch (error) {
        console.log("Pantry match failed, using all recipes");
      }
    }

    const randomIndex = Math.floor(Math.random() * eligibleRecipes.length);
    const selectedRecipe = eligibleRecipes[randomIndex];
    setRouletteRecipe(selectedRecipe);

    rouletteScale.value = withSequence(
      withSpring(1.1, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 150 })
    );
    rouletteOpacity.value = withTiming(1, { duration: 200 });

    setTimeout(() => {
      setIsRouletteActive(false);
    }, 3000);
  }, [recipes, pantryItems, pantryMatch, isRouletteActive]);

  const handleRouletteNavigate = useCallback(() => {
    if (rouletteRecipe) {
      rouletteOpacity.value = withTiming(0, { duration: 200 });
      rouletteScale.value = withTiming(0, { duration: 200 });
      navigation.navigate("RecipeDetail", { recipeId: rouletteRecipe.id });
      setRouletteRecipe(null);
    }
  }, [rouletteRecipe, navigation]);

  const handleRouletteCook = useCallback(() => {
    if (rouletteRecipe) {
      rouletteOpacity.value = withTiming(0, { duration: 200 });
      rouletteScale.value = withTiming(0, { duration: 200 });
      navigation.navigate("CookMode", { recipeId: rouletteRecipe.id });
      setRouletteRecipe(null);
    }
  }, [rouletteRecipe, navigation]);

  const dismissRoulette = useCallback(() => {
    rouletteOpacity.value = withTiming(0, { duration: 200 });
    rouletteScale.value = withTiming(0, { duration: 200 });
    setTimeout(() => setRouletteRecipe(null), 200);
  }, []);

  useShakeDetector({
    onShake: handleRecipeRoulette,
    enabled: isFocused && !isLoading && !isRemyThinking && !isRouletteActive,
  });

  const handleSwipeToCook = useCallback((recipe: Recipe) => {
    navigation.navigate("CookMode", { recipeId: recipe.id });
  }, [navigation]);

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

  const cycleViewMode = useCallback(() => {
    setViewMode((prev) => {
      if (prev === "grid-2") return "grid-1";
      if (prev === "grid-1") return "list";
      return "grid-2";
    });
    Haptics.selectionAsync();
  }, []);

  const getViewModeIcon = (): "grid" | "square" | "list" => {
    if (viewMode === "grid-2") return "grid";
    if (viewMode === "grid-1") return "square";
    return "list";
  };

  const getCardVariant = (): "grid" | "large" | "list" => {
    if (viewMode === "grid-2") return "grid";
    if (viewMode === "grid-1") return "large";
    return "list";
  };

  const handleCreateShoppingList = useCallback(() => {
    const selectedRecipes = recipes?.filter((r) => selectedRecipeIds.has(r.id)) || [];
    navigation.navigate("CreateShoppingList", { recipes: selectedRecipes });
    handleCancelSelect();
  }, [recipes, selectedRecipeIds, navigation]);

  const renderItem = useCallback(({ item, index }: { item: Recipe; index: number }) => {
    const cardVariant = getCardVariant();
    const wrapperStyle = viewMode === "list" 
      ? styles.listCardWrapper 
      : viewMode === "grid-1" 
        ? styles.largeCardWrapper 
        : styles.cardWrapper;
    
    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 50, 300)).duration(300)}
        style={wrapperStyle}
      >
        <RecipeCard 
          recipe={item} 
          onPress={() => handleRecipePress(item)}
          onLongPress={() => handleLongPress(item.id)}
          isSelectable={isSelectMode}
          isSelected={selectedRecipeIds.has(item.id)}
          onSelect={() => handleToggleSelect(item.id)}
          onSwipeToCook={() => handleSwipeToCook(item)}
          index={index}
          variant={cardVariant}
        />
      </Animated.View>
    );
  }, [handleRecipePress, handleLongPress, isSelectMode, selectedRecipeIds, handleToggleSelect, handleSwipeToCook, viewMode]);

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

      {/* Results Count & View Toggle */}
      {!isLoading && recipes && recipes.length > 0 ? (
        <View style={styles.resultsHeader}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {filteredIds !== null 
              ? `${displayedRecipes.length} recipe${displayedRecipes.length !== 1 ? 's' : ''} found`
              : `${recipes.length} saved recipe${recipes.length !== 1 ? 's' : ''}`
            }
          </ThemedText>
          <Pressable 
            onPress={cycleViewMode} 
            style={[styles.viewToggleButton, { backgroundColor: theme.backgroundSecondary }]}
            testID="view-toggle-button"
          >
            <Feather name={getViewModeIcon()} size={18} color={theme.text} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        key={`recipe-${viewMode}`}
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
        numColumns={viewMode === "grid-2" ? 2 : 1}
        columnWrapperStyle={viewMode === "grid-2" && !isLoading && (displayedRecipes?.length ?? 0) > 0 ? styles.row : undefined}
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
        ItemSeparatorComponent={viewMode !== "grid-2" ? () => <View style={{ height: Spacing.md }} /> : undefined}
      />
      
      {isSelectMode ? (
        <Animated.View 
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.selectionBar,
            { 
              backgroundColor: isDark ? 'rgba(30, 27, 36, 0.95)' : 'rgba(255, 255, 255, 0.9)',
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

      {rouletteRecipe ? (
        <Animated.View 
          style={[
            styles.rouletteOverlay,
            rouletteAnimatedStyle,
          ]}
        >
          <Pressable 
            style={styles.rouletteBackdrop}
            onPress={dismissRoulette}
          />
          <View style={[styles.rouletteCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.rouletteHeader, { backgroundColor: KitchColors.primary }]}>
              <Feather name="shuffle" size={24} color="#FFF" />
              <ThemedText type="h4" style={styles.rouletteTitle}>
                Recipe Roulette!
              </ThemedText>
            </View>
            <View style={styles.rouletteContent}>
              <ThemedText type="h3" style={{ color: theme.text, textAlign: "center" }}>
                {rouletteRecipe.title}
              </ThemedText>
              {rouletteRecipe.prepTime || rouletteRecipe.cookTime ? (
                <View style={styles.rouletteMeta}>
                  <Feather name="clock" size={16} color={theme.textSecondary} />
                  <ThemedText type="body" style={{ color: theme.textSecondary, marginLeft: 6 }}>
                    {(rouletteRecipe.prepTime || 0) + (rouletteRecipe.cookTime || 0)} min
                  </ThemedText>
                </View>
              ) : null}
              <View style={styles.rouletteActions}>
                <Pressable
                  onPress={handleRouletteNavigate}
                  style={[styles.rouletteButton, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <Feather name="eye" size={18} color={theme.text} />
                  <ThemedText type="bodyMedium" style={{ color: theme.text, marginLeft: 8 }}>
                    View Recipe
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleRouletteCook}
                  style={[styles.rouletteButton, { backgroundColor: KitchColors.primary }]}
                >
                  <Feather name="play" size={18} color="#FFF" />
                  <ThemedText type="bodyMedium" style={{ color: "#FFF", marginLeft: 8 }}>
                    Cook Now
                  </ThemedText>
                </Pressable>
              </View>
            </View>
            <Pressable onPress={dismissRoulette} style={styles.rouletteDismiss}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Tap anywhere to dismiss
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
    paddingTop: 60, // Editorial top spacing
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: Spacing.xl,
  },
  // Refined Editorial Search/Action Bar
  quickActionsContainer: {
    marginBottom: Spacing.xl,
    marginHorizontal: -Spacing.lg,
  },
  quickActionsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  quickActionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  // AI/Remy interaction: More cohesive and less like a separate block
  remyResponseBubble: {
    padding: Spacing.lg,
    borderRadius: 24,
    borderWidth: 0,
    marginBottom: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  resultsHeader: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  // Bento Grid Logic
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrapper: {
    width: "48%", // Two-column bento style
    marginBottom: Spacing.lg,
  },
  largeCardWrapper: {
    width: "100%", // Hero item
    marginBottom: Spacing.xl,
  },
  // Selection/Shopping list bar: Frosted glass effect
  selectionBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 9999,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  selectionBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shoppingListButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: '#10B981', // Brand Emerald
  },
  // Roulette: Modern "Surprise Me" overlay
  rouletteCard: {
    width: "90%",
    maxWidth: 360,
    borderRadius: 32, // Extra rounded for special components
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  rouletteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 9999,
    backgroundColor: '#FBBF24',
  },
  listCardWrapper: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  thinkingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  thinkingText: {
    fontSize: 14,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  remyAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  remyEmojiSmall: {
    fontSize: 14,
  },
  showAllLink: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    paddingVertical: 4,
  },
  selectionCancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rouletteOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  rouletteBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  rouletteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  rouletteTitle: {
    color: "#FFF",
    fontSize: 18,
  },
  rouletteContent: {
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.lg,
  },
  rouletteMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  rouletteActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  rouletteDismiss: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
  },
});