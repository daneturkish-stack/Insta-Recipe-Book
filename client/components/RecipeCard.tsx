import React from "react";
import { StyleSheet, View, Pressable, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
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
    scale.value = withSpring(0.97, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, Shadows.card, animatedStyle]}
      testID={`recipe-card-${recipe.id}`}
    >
      <View style={styles.imageContainer}>
        <Image
          source={recipe.imageUrl ? { uri: recipe.imageUrl } : placeholderImage}
          style={styles.image}
          contentFit="cover"
          placeholder={placeholderImage}
          transition={200}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradient}
        />
        {recipe.prepTime ? (
          <View style={[styles.timeBadge, { backgroundColor: theme.primary }]}>
            <ThemedText type="caption" style={styles.badgeText}>
              {recipe.prepTime} min
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.titleContainer}>
          <ThemedText type="bodyMedium" style={styles.title} numberOfLines={2}>
            {recipe.title}
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    backgroundColor: "#FFF",
  },
  imageContainer: {
    aspectRatio: 16 / 12,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
  },
  timeBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    color: "#FFF",
    fontWeight: "600",
  },
  titleContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  title: {
    color: "#FFF",
    fontWeight: "600",
  },
});
