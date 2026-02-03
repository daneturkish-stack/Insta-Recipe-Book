import React, { useState, useCallback, useMemo } from "react";
import { StyleSheet, View, FlatList, RefreshControl, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeCardSkeleton } from "@/components/RecipeCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { RemyChat, RemyFloatingButton } from "@/components/RemyChat";
import { useTheme } from "@/hooks/useTheme";
import { useRecipes, useSmartSearch } from "@/hooks/useRecipes";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { Recipe } from "@/types/recipe";
import { DISH_TYPES } from "@/types/recipe";

const emptyImage = require("../../assets/images/empty-collection.png");

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { data: recipes, isLoading, refetch, isRefetching } = useRecipes();
  const smartSearch = useSmartSearch();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [smartSearchResults, setSmartSearchResults] = useState<string[] | null>(null);
  const [showRemyChat, setShowRemyChat] = useState(false);

  const handleSmartSearch = async () => {
    if (!searchQuery.trim() || !recipes || recipes.length === 0) return;
    
    const result = await smartSearch.mutateAsync({
      query: searchQuery,
      recipes,
    });
    setSmartSearchResults(result);
  };

  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];

    let result = recipes;

    if (smartSearchResults !== null && searchQuery.trim()) {
      result = result.filter((recipe) => smartSearchResults.includes(recipe.id));
      const orderMap = new Map(smartSearchResults.map((id, i) => [id, i]));
      result = [...result].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
    } else if (searchQuery.trim() && !smartSearch.isPending) {
      const query = searchQuery.toLowerCase();
      result = result.filter((recipe) =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.ingredients?.some((i) => i.name.toLowerCase().includes(query)) ||
        recipe.creatorHandle?.toLowerCase().includes(query) ||
        recipe.dishType?.toLowerCase().includes(query) ||
        recipe.vibeTags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    if (selectedFilter) {
      result = result.filter((recipe) => recipe.dishType === selectedFilter);
    }

    return result;
  }, [recipes, searchQuery, selectedFilter, smartSearchResults, smartSearch.isPending]);

  const availableFilters = useMemo(() => {
    if (!recipes) return [];
    const types = new Set(recipes.map((r) => r.dishType).filter(Boolean));
    return DISH_TYPES.filter((t) => types.has(t));
  }, [recipes]);

  const handleRecipePress = useCallback((recipe: Recipe) => {
    navigation.navigate("RecipeDetail", { recipeId: recipe.id });
  }, [navigation]);

  const handleCancelSearch = () => {
    setIsSearchVisible(false);
    setSearchQuery("");
    setSmartSearchResults(null);
  };

  const renderItem = useCallback(({ item, index }: { item: Recipe; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={styles.cardWrapper}
    >
      <RecipeCard recipe={item} onPress={() => handleRecipePress(item)} />
    </Animated.View>
  ), [handleRecipePress]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        image={emptyImage}
        title={searchQuery.trim() ? "No recipes found" : "No recipes yet"}
        subtitle={searchQuery.trim() 
          ? "Try a different search term or use AI search"
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

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {isSearchVisible ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.searchContainer,
            {
              paddingTop: headerHeight + Spacing.sm,
              backgroundColor: theme.backgroundRoot,
            },
          ]}
        >
          <View style={[styles.searchInputContainer, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="search" size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Try: 'that chicken pasta from TikTok'"
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setSmartSearchResults(null);
              }}
              onSubmitEditing={handleSmartSearch}
              returnKeyType="search"
              autoFocus
            />
            {smartSearch.isPending ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : searchQuery.length > 0 ? (
              <Pressable onPress={() => { setSearchQuery(""); setSmartSearchResults(null); }}>
                <Feather name="x" size={18} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>
          <Pressable onPress={handleCancelSearch}>
            <ThemedText type="link" style={{ marginLeft: Spacing.md }}>Cancel</ThemedText>
          </Pressable>
        </Animated.View>
      ) : null}

      <FlatList
        key="recipe-grid"
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: isSearchVisible ? Spacing.lg : headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
            flexGrow: isLoading || filteredRecipes?.length === 0 ? 1 : undefined,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={isLoading ? [] : filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={isLoading ? () => null : renderItem}
        numColumns={2}
        columnWrapperStyle={isLoading || (filteredRecipes?.length ?? 0) === 0 ? undefined : styles.row}
        ListHeaderComponent={
          !isSearchVisible && availableFilters.length > 0 && (recipes?.length ?? 0) > 0 ? (
            <Animated.ScrollView
              entering={FadeIn.duration(300)}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersContainer}
              contentContainerStyle={styles.filtersContent}
            >
              <Pressable
                onPress={() => setSelectedFilter(null)}
                style={[
                  styles.filterChip,
                  { 
                    backgroundColor: selectedFilter === null ? theme.primary : theme.backgroundDefault,
                  },
                ]}
              >
                <ThemedText 
                  type="caption" 
                  style={{ color: selectedFilter === null ? "#FFF" : theme.text, fontWeight: "600" }}
                >
                  All
                </ThemedText>
              </Pressable>
              {availableFilters.map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => setSelectedFilter(filter === selectedFilter ? null : filter)}
                  style={[
                    styles.filterChip,
                    { 
                      backgroundColor: selectedFilter === filter ? theme.primary : theme.backgroundDefault,
                    },
                  ]}
                >
                  <ThemedText 
                    type="caption" 
                    style={{ color: selectedFilter === filter ? "#FFF" : theme.text, fontWeight: "500" }}
                  >
                    {filter}
                  </ThemedText>
                </Pressable>
              ))}
            </Animated.ScrollView>
          ) : null
        }
        ListEmptyComponent={isLoading ? renderLoading : renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {!isSearchVisible && (recipes?.length ?? 0) > 0 ? (
        <Pressable
          onPress={() => setIsSearchVisible(true)}
          style={[styles.searchFab, { backgroundColor: theme.backgroundDefault }]}
        >
          <Feather name="search" size={20} color={theme.text} />
        </Pressable>
      ) : null}

      <RemyFloatingButton 
        onPress={() => setShowRemyChat(true)} 
        testID="remy-floating-button-collection"
      />
      
      <RemyChat
        visible={showRemyChat}
        onClose={() => setShowRemyChat(false)}
        allRecipes={recipes}
      />
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
  row: {
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.xs,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  searchFab: {
    position: "absolute",
    top: 100,
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
