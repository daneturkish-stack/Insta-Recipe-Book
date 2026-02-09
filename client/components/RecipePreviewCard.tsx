import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { StatsBadge } from "@/components/StatsBadge";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows, CardAccentColors } from "@/constants/theme";
import type { Recipe } from "@/types/recipe";

interface RecipePreviewCardProps {
  recipe: Recipe;
  index?: number;
}

const placeholderImage = require("../../assets/images/recipe-placeholder.png");

export function RecipePreviewCard({ recipe, index = 0 }: RecipePreviewCardProps) {
  const { theme } = useTheme();
  
  const accentColor = CardAccentColors[index % CardAccentColors.length];
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const stepsCount = recipe.instructions?.length || 0;

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.backgroundDefault,
          borderTopWidth: 4,
          borderTopColor: accentColor,
        }, 
        Shadows.card
      ]}
    >
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

        <View style={styles.statsRow}>
          {totalTime > 0 ? (
            <StatsBadge icon="clock" label={`${totalTime} min`} />
          ) : null}
          
          {recipe.instructions && recipe.instructions.length > 0 ? (
            <StatsBadge label={`${recipe.instructions.length} Steps`} />
          ) : null}
          
          <StatsBadge label={stepsCount <= 5 ? "Easy" : stepsCount <= 10 ? "Medium" : "Advanced"} />
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.statsInfo}>
            <ThemedText type="caption" style={{ color: theme.primary }}>
              {recipe.ingredients?.length || 0} ingredients
            </ThemedText>
          </View>
          
          <Feather name="heart" size={20} color={theme.coral} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.card,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 180,
    backgroundColor: "#000",
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  statsInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
});
