import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import type { Recipe } from "@/types/recipe";

interface RecipePreviewCardProps {
  recipe: Recipe;
}

const placeholderImage = require("../../assets/images/recipe-placeholder.png");

export function RecipePreviewCard({ recipe }: RecipePreviewCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }, Shadows.card]}>
      <Image
        source={recipe.imageUrl ? { uri: recipe.imageUrl } : placeholderImage}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.content}>
        <ThemedText type="h4" numberOfLines={2} style={styles.title}>
          {recipe.title}
        </ThemedText>
        
        {recipe.description ? (
          <ThemedText
            type="small"
            numberOfLines={2}
            style={[styles.description, { color: theme.textSecondary }]}
          >
            {recipe.description}
          </ThemedText>
        ) : null}

        <View style={styles.metaRow}>
          {recipe.prepTime ? (
            <View style={styles.metaItem}>
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                Prep: {recipe.prepTime} min
              </ThemedText>
            </View>
          ) : null}
          {recipe.cookTime ? (
            <View style={styles.metaItem}>
              <Feather name="thermometer" size={14} color={theme.textSecondary} />
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                Cook: {recipe.cookTime} min
              </ThemedText>
            </View>
          ) : null}
          {recipe.servings ? (
            <View style={styles.metaItem}>
              <Feather name="users" size={14} color={theme.textSecondary} />
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                {recipe.servings} servings
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <ThemedText type="caption" style={{ color: theme.accent }}>
            {recipe.ingredients?.length || 0} ingredients
          </ThemedText>
          <ThemedText type="caption" style={[styles.dot, { color: theme.textSecondary }]}>
            {" "}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.accent }}>
            {recipe.instructions?.length || 0} steps
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 180,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  description: {
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    marginHorizontal: Spacing.sm,
  },
});
