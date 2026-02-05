import React from "react";
import { StyleSheet, View, Pressable, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows, CardAccentColors, KitchColors } from "@/constants/theme";
import type { Recipe } from "@/types/recipe";

type CardVariant = "grid" | "large" | "list";

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onLongPress?: () => void;
  onSelect?: () => void;
  onSwipeToCook?: () => void;
  index?: number;
  variant?: CardVariant;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const SWIPE_THRESHOLD = 80;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const placeholderImage = require("../../assets/images/recipe-placeholder.png");

export function RecipeCard({ 
  recipe, 
  onPress, 
  isSelectable, 
  isSelected, 
  onLongPress, 
  onSelect,
  onSwipeToCook,
  index = 0,
  variant = "grid",
}: RecipeCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const isSwipeActive = useSharedValue(false);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSelectable) {
      onSelect?.();
    } else {
      onPress?.();
    }
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  };

  const triggerCookMode = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSwipeToCook?.();
  };

  const panGesture = Gesture.Pan()
    .enabled(!isSelectable && !!onSwipeToCook)
    .activeOffsetX(20)
    .failOffsetY([-20, 20])
    .onStart(() => {
      isSwipeActive.value = true;
    })
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = Math.min(event.translationX, CARD_WIDTH * 0.6);
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(triggerCookMode)();
        translateX.value = withSpring(CARD_WIDTH, springConfig, () => {
          translateX.value = withSpring(0, springConfig);
        });
      } else {
        translateX.value = withSpring(0, springConfig);
      }
      isSwipeActive.value = false;
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
    ],
  }));

  const cookIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );
    const iconScale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.5, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale: iconScale }],
    };
  });

  const isVideo = recipe.platform === "instagram" || recipe.platform === "tiktok";
  const thumbnailSource = recipe.imageUrl;
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  
  const accentColor = CardAccentColors[index % CardAccentColors.length];
  const isListVariant = variant === "list";

  if (isListVariant) {
    return (
      <View style={styles.swipeContainer}>
        <Animated.View style={[styles.cookIndicator, cookIndicatorStyle]}>
          <View style={[styles.cookIconCircle, { backgroundColor: KitchColors.primary }]}>
            <Feather name="play" size={20} color="#FFF" />
          </View>
          <ThemedText type="caption" style={styles.cookText}>
            Cook!
          </ThemedText>
        </Animated.View>
        <GestureDetector gesture={panGesture}>
          <AnimatedPressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={handleLongPress}
            delayLongPress={400}
            style={[
              styles.listContainer,
              { 
                backgroundColor: theme.backgroundDefault,
                borderLeftWidth: 4,
                borderLeftColor: accentColor,
              },
              Shadows.card,
              isSelected && { borderWidth: 2, borderColor: theme.primary },
              animatedCardStyle,
            ]}
            testID={`recipe-card-${recipe.id}`}
          >
            <View style={styles.listImageContainer}>
              <Image
                source={thumbnailSource ? { uri: thumbnailSource } : placeholderImage}
                style={styles.listImage}
                contentFit="cover"
                placeholder={placeholderImage}
                transition={200}
              />
              {isSelectable ? (
                <View style={[styles.selectIndicatorList, isSelected && { backgroundColor: theme.primary }]}>
                  {isSelected ? (
                    <Feather name="check" size={14} color="#FFF" />
                  ) : (
                    <View style={[styles.selectCircleSmall, { borderColor: theme.backgroundDefault }]} />
                  )}
                </View>
              ) : null}
              {isVideo && !isSelectable ? (
                <View style={styles.listVideoIndicator}>
                  <Feather name="play" size={12} color="#FFF" />
                </View>
              ) : null}
            </View>
            <View style={styles.listContent}>
              <ThemedText 
                type="bodyMedium" 
                style={[styles.title, { color: theme.text }]} 
                numberOfLines={2}
              >
                {recipe.title}
              </ThemedText>
              <View style={styles.listMetaRow}>
                {totalTime > 0 ? (
                  <View style={styles.metaItem}>
                    <Feather name="clock" size={11} color={theme.primary} />
                    <ThemedText type="caption" style={[styles.metaText, { color: theme.textSecondary }]}>
                      {totalTime} min
                    </ThemedText>
                  </View>
                ) : null}
                {recipe.servings ? (
                  <View style={styles.metaItem}>
                    <Feather name="users" size={11} color={theme.primary} />
                    <ThemedText type="caption" style={[styles.metaText, { color: theme.textSecondary }]}>
                      {recipe.servings}
                    </ThemedText>
                  </View>
                ) : null}
                {recipe.dishType ? (
                  <View style={[styles.tagSmall, { backgroundColor: theme.primary + "20" }]}>
                    <ThemedText type="caption" style={[styles.tagTextSmall, { color: theme.primary }]}>
                      {recipe.dishType}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
              {recipe.creatorHandle ? (
                <ThemedText 
                  type="caption" 
                  style={[styles.listCreator, { color: theme.textSecondary }]} 
                  numberOfLines={1}
                >
                  {recipe.creatorHandle}
                </ThemedText>
              ) : null}
            </View>
            <View style={styles.listActions}>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </View>
          </AnimatedPressable>
        </GestureDetector>
      </View>
    );
  }

  const cardContent = (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={handleLongPress}
      delayLongPress={400}
      style={[
        styles.container,
        { 
          backgroundColor: theme.backgroundDefault,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
        },
        Shadows.card,
        isSelected && { borderWidth: 2, borderColor: theme.primary },
        animatedCardStyle,
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
        
        {isSelectable ? (
          <View style={[styles.selectIndicator, isSelected && { backgroundColor: theme.primary }]}>
            {isSelected ? (
              <Feather name="check" size={16} color="#FFF" />
            ) : (
              <View style={[styles.selectCircle, { borderColor: theme.backgroundDefault }]} />
            )}
          </View>
        ) : null}
        
        {isVideo && !isSelectable ? (
          <View style={styles.videoIndicator}>
            <View style={styles.playButton}>
              <Feather name="play" size={16} color="#FFF" style={{ marginLeft: 2 }} />
            </View>
          </View>
        ) : null}

        {recipe.platform && !isSelectable ? (
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
              <Feather name="clock" size={12} color={theme.primary} />
              <ThemedText type="caption" style={[styles.metaText, { color: theme.textSecondary }]}>
                {totalTime} min
              </ThemedText>
            </View>
          ) : null}

          {recipe.servings ? (
            <View style={styles.metaItem}>
              <Feather name="users" size={12} color={theme.primary} />
              <ThemedText type="caption" style={[styles.metaText, { color: theme.textSecondary }]}>
                {recipe.servings}
              </ThemedText>
            </View>
          ) : null}

          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            <View style={styles.metaItem}>
              <Feather name="list" size={12} color={theme.primary} />
              <ThemedText type="caption" style={[styles.metaText, { color: theme.textSecondary }]}>
                {recipe.ingredients.length}
              </ThemedText>
            </View>
          ) : null}
        </View>

        {recipe.dishType || (recipe.vibeTags && recipe.vibeTags.length > 0) ? (
          <View style={styles.tagsRow}>
            {recipe.dishType ? (
              <View style={[styles.tag, { backgroundColor: theme.primary + "20" }]}>
                <ThemedText type="caption" style={[styles.tagText, { color: theme.primary }]}>
                  {recipe.dishType}
                </ThemedText>
              </View>
            ) : null}
            {recipe.vibeTags?.slice(0, 1).map((tag, idx) => (
              <View key={idx} style={[styles.tag, { backgroundColor: theme.accent + "30" }]}>
                <ThemedText type="caption" style={[styles.tagText, { color: "#92400E" }]}>
                  {tag}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.bottomRow}>
          {recipe.creatorHandle ? (
            <ThemedText 
              type="caption" 
              style={[styles.creator, { color: theme.textSecondary }]} 
              numberOfLines={1}
            >
              {recipe.creatorHandle}
            </ThemedText>
          ) : null}
          
          <View style={styles.actionsRow}>
            <Pressable style={styles.actionButton}>
              <Feather name="heart" size={16} color={theme.textSecondary} />
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Feather name="external-link" size={16} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );

  return (
    <View style={styles.swipeContainer}>
      <Animated.View style={[styles.cookIndicator, cookIndicatorStyle]}>
        <View style={[styles.cookIconCircle, { backgroundColor: KitchColors.primary }]}>
          <Feather name="play" size={20} color="#FFF" />
        </View>
        <ThemedText type="caption" style={styles.cookText}>
          Cook!
        </ThemedText>
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        {cardContent}
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: "relative",
  },
  cookIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SWIPE_THRESHOLD,
    alignItems: "center",
    justifyContent: "center",
    zIndex: -1,
  },
  cookIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cookText: {
    color: KitchColors.primary,
    fontWeight: "700",
    fontSize: 11,
  },
  container: {
    borderRadius: BorderRadius.card,
    overflow: "hidden",
  },
  imageContainer: {
    aspectRatio: 4 / 3,
    position: "relative",
    borderTopLeftRadius: BorderRadius.card,
    borderTopRightRadius: BorderRadius.card,
    overflow: "hidden",
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
  selectIndicator: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
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
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontWeight: "600",
    fontSize: 11,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  creator: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    flexDirection: "row",
    borderRadius: BorderRadius.card,
    overflow: "hidden",
  },
  listImageContainer: {
    width: 90,
    height: 90,
    position: "relative",
  },
  listImage: {
    width: "100%",
    height: "100%",
  },
  selectIndicatorList: {
    position: "absolute",
    top: Spacing.xs,
    left: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  listVideoIndicator: {
    position: "absolute",
    bottom: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
    gap: Spacing.xs,
  },
  listMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    alignItems: "center",
  },
  tagSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  tagTextSmall: {
    fontWeight: "600",
    fontSize: 10,
  },
  listCreator: {
    marginTop: 2,
  },
  listActions: {
    justifyContent: "center",
    paddingRight: Spacing.md,
  },
});
