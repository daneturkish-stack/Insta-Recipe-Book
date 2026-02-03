import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { Recipe } from "@/types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const placeholderImage = require("../../assets/images/recipe-placeholder.png");

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const isVideo = recipe.platform === "instagram" || recipe.platform === "tiktok";
  const thumbnailSource = recipe.imageUrl;
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
      testID={`recipe-card-${recipe.id}`}
    >
      <View style={styles.imageContainer}>
        <Image
          source={thumbnailSource ? { uri: thumbnailSource } : placeholderImage}
          style={styles.image}
          contentFit="cover"
          placeholder={placeholderImage}
          transition={200}
        />
        
        {isVideo ? (
          <View style={styles.videoIndicator}>
            <View style={styles.playButton}>
              <Feather name="play" size={16} color="#FFF" style={{ marginLeft: 2 }} />
            </View>
          </View>
        ) : null}

        {recipe.platform ? (
          <View style={styles.platformBadge}>
            <Feather 
              name={recipe.platform === "tiktok" ? "video" : "instagram"} 
              size={12} 
              color="#FFF" 
            />
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <ThemedText 
          type="bodyMedium" 
          style={[styles.title, { color: theme.text }]} 
          numberOfLines={2}
        >
          {recipe.title}
        </ThemedText>

        <View style={styles.metaRow}>
          {totalTime > 0 ? (
            <View style={styles.metaItem}>
              <Feather name="clock" size={12} color={theme.textSecondary} />
              <ThemedText type="caption" style={[styles.metaText, { color: theme.textSecondary }]}>
                {totalTime} min
              </ThemedText>
            </View>
          ) : null}

          {recipe.servings ? (
            <View style={styles.metaItem}>
              <Feather name="users" size={12} color={theme.textSecondary} />
              <ThemedText type="caption" style={[styles.metaText, { color: theme.textSecondary }]}>
                {recipe.servings}
              </ThemedText>
            </View>
          ) : null}

          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            <View style={styles.metaItem}>
              <Feather name="list" size={12} color={theme.textSecondary} />
              <ThemedText type="caption" style={[styles.metaText, { color: theme.textSecondary }]}>
                {recipe.ingredients.length}
              </ThemedText>
            </View>
          ) : null}
        </View>

        {recipe.dishType || (recipe.vibeTags && recipe.vibeTags.length > 0) ? (
          <View style={styles.tagsRow}>
            {recipe.dishType ? (
              <View style={[styles.tag, { backgroundColor: theme.primary + "15" }]}>
                <ThemedText type="caption" style={[styles.tagText, { color: theme.primary }]}>
                  {recipe.dishType}
                </ThemedText>
              </View>
            ) : null}
            {recipe.vibeTags?.slice(0, 1).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: theme.accent + "15" }]}>
                <ThemedText type="caption" style={[styles.tagText, { color: theme.accent }]}>
                  {tag}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        {recipe.creatorHandle ? (
          <ThemedText 
            type="caption" 
            style={[styles.creator, { color: theme.textSecondary }]} 
            numberOfLines={1}
          >
            {recipe.creatorHandle}
          </ThemedText>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  imageContainer: {
    aspectRatio: 4 / 3,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  videoIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -16,
    marginLeft: -16,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  platformBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  title: {
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontWeight: "500",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  tagText: {
    fontWeight: "600",
    fontSize: 11,
  },
  creator: {
    marginTop: Spacing.xs,
  },
});
