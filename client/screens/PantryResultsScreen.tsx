import React from "react";
import { StyleSheet, View, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useRecipes } from "@/hooks/useRecipes";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

const placeholderImage = require("../../assets/images/recipe-placeholder.png");

interface Match {
  id: string;
  matchPercentage: number;
  missingIngredients: string[];
}

export default function PantryResultsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { matches } = route.params as { matches: Match[] };
  const { data: recipes = [] } = useRecipes();

  const matchedRecipes = matches.map((match) => {
    const recipe = recipes.find((r) => r.id === match.id);
    return { ...match, recipe };
  }).filter((m) => m.recipe);

  const renderItem = ({ item, index }: { item: typeof matchedRecipes[0]; index: number }) => {
    if (!item.recipe) return null;

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
        <Pressable
          onPress={() => navigation.navigate("RecipeDetail", { recipeId: item.recipe!.id })}
          style={[styles.card, { backgroundColor: theme.backgroundDefault }, Shadows.card]}
        >
          <Image
            source={item.recipe.imageUrl ? { uri: item.recipe.imageUrl } : placeholderImage}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <ThemedText type="bodyMedium" numberOfLines={2} style={styles.cardTitle}>
                {item.recipe.title}
              </ThemedText>
              <View style={[styles.matchBadge, { backgroundColor: getMatchColor(item.matchPercentage) + "20" }]}>
                <ThemedText type="caption" style={{ color: getMatchColor(item.matchPercentage), fontWeight: "700" }}>
                  {item.matchPercentage}%
                </ThemedText>
              </View>
            </View>

            {item.recipe.dishType ? (
              <View style={[styles.tag, { backgroundColor: theme.accent + "30" }]}>
                <ThemedText type="caption" style={{ color: theme.accent }}>
                  {item.recipe.dishType}
                </ThemedText>
              </View>
            ) : null}

            {item.missingIngredients.length > 0 ? (
              <View style={styles.missingSection}>
                <ThemedText type="caption" style={[styles.missingLabel, { color: theme.textSecondary }]}>
                  Missing:
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {item.missingIngredients.slice(0, 3).join(", ")}
                  {item.missingIngredients.length > 3 ? ` +${item.missingIngredients.length - 3} more` : ""}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.readyBadge}>
                <Feather name="check-circle" size={14} color={theme.accent} />
                <ThemedText type="caption" style={{ color: theme.accent, marginLeft: 4, fontWeight: "600" }}>
                  Ready to cook!
                </ThemedText>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={matchedRecipes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="h3">
              {matchedRecipes.length} Recipe{matchedRecipes.length !== 1 ? "s" : ""} Found
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              Based on your pantry ingredients
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

function getMatchColor(percentage: number): string {
  if (percentage >= 90) return "#2E7D32";
  if (percentage >= 70) return "#8FA67C";
  return "#D97E43";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  card: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    flexDirection: "row",
  },
  image: {
    width: 100,
    height: 100,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  matchBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.sm,
  },
  missingSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  missingLabel: {
    fontWeight: "600",
  },
  readyBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
});
