import React, { useState, useCallback } from "react";
import { StyleSheet, View, FlatList, RefreshControl, TextInput, Pressable } from "react-native";
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
import { useTheme } from "@/hooks/useTheme";
import { useRecipes } from "@/hooks/useRecipes";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { Recipe } from "@/types/recipe";

const emptyImage = require("../../assets/images/empty-collection.png");

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { data: recipes, isLoading, refetch, isRefetching } = useRecipes();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const filteredRecipes = recipes?.filter((recipe) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      recipe.title.toLowerCase().includes(query) ||
      recipe.ingredients?.some((i) => i.name.toLowerCase().includes(query))
    );
  });

  const handleRecipePress = useCallback((recipe: Recipe) => {
    navigation.navigate("RecipeDetail", { recipeId: recipe.id });
  }, [navigation]);

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
        title="No recipes yet"
        subtitle="Save your first recipe from Instagram and build your personal cookbook"
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
              placeholder="Search recipes or ingredients..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery("")}>
                <Feather name="x" size={18} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>
          <Pressable onPress={() => { setIsSearchVisible(false); setSearchQuery(""); }}>
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
    </View>
  );
}

export function CollectionHeaderRight() {
  const { theme } = useTheme();
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  return (
    <Pressable
      onPress={() => setIsSearchVisible(true)}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      hitSlop={8}
    >
      <Feather name="search" size={22} color={theme.text} />
    </Pressable>
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
});
