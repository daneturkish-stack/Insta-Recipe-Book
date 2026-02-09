import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View, Pressable, Dimensions, StatusBar, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withTiming, runOnJS } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import YoutubePlayer from "react-native-youtube-iframe";

import { ThemedText } from "@/components/ThemedText";
import { useRecipe } from "@/hooks/useRecipes";
import { CookModeColors, CookModeTypography, Spacing } from "@/constants/theme";
import { Ingredient, InstructionStep } from "@/types/recipe";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 80;

function getInstructionText(instruction: string | InstructionStep): string {
  if (typeof instruction === "string") return instruction;
  return instruction.text;
}

function getInstructionTimestamp(instruction: string | InstructionStep): number | undefined {
  if (typeof instruction === "object" && instruction.timestamp !== undefined) {
    return instruction.timestamp;
  }
  return undefined;
}

function getStepIngredients(instruction: string | InstructionStep, ingredients: Ingredient[]): Ingredient[] {
  const text = getInstructionText(instruction);
  if (!text || !ingredients) return [];
  const lowerInstruction = text.toLowerCase();
  return ingredients.filter((ingredient) => {
    const name = ingredient.name.toLowerCase();
    const words = name.split(/\s+/);
    if (words.length > 1) {
      return words.some((word) => word.length > 2 && lowerInstruction.includes(word));
    }
    return lowerInstruction.includes(name);
  });
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function parseTimeMentions(text: string): { amount: number; unit: string; totalSeconds: number }[] {
  const results: { amount: number; unit: string; totalSeconds: number }[] = [];
  const pattern = /(\d+)\s*(min(?:ute)?s?|hour?s?|hr?s?|sec(?:ond)?s?)/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const amount = parseInt(match[1], 10);
    const unitRaw = match[2].toLowerCase();
    let unit = "minutes";
    let totalSeconds = 0;
    if (unitRaw.startsWith("sec")) {
      unit = "seconds";
      totalSeconds = amount;
    } else if (unitRaw.startsWith("h")) {
      unit = "hours";
      totalSeconds = amount * 3600;
    } else {
      unit = "minutes";
      totalSeconds = amount * 60;
    }
    results.push({ amount, unit, totalSeconds });
  }
  return results;
}

export default function CookModeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { recipeId } = route.params;

  const recipe = useRecipe(recipeId);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const playerRef = useRef<any>(null);
  const timerIntervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const translateX = useSharedValue(0);
  const swipeDirection = useSharedValue<"left" | "right" | null>(null);

  const totalSteps = recipe?.instructions?.length || 0;

  const currentInstructionText = useMemo(() => {
    if (!recipe?.instructions?.[currentStep]) return "";
    return getInstructionText(recipe.instructions[currentStep]);
  }, [recipe, currentStep]);

  const stepIngredients = useMemo(() => {
    if (!recipe?.instructions?.[currentStep] || !recipe?.ingredients) return [];
    return getStepIngredients(recipe.instructions[currentStep], recipe.ingredients);
  }, [recipe, currentStep]);

  const timeMentions = useMemo(() => {
    return parseTimeMentions(currentInstructionText);
  }, [currentInstructionText]);

  const hasYouTubeVideo = useMemo(() => {
    return recipe?.platform === "youtube" && recipe?.videoUrl && extractYouTubeId(recipe.videoUrl);
  }, [recipe]);

  const youtubeVideoId = useMemo(() => {
    if (!recipe?.videoUrl) return null;
    return extractYouTubeId(recipe.videoUrl);
  }, [recipe?.videoUrl]);

  useEffect(() => {
    if (hasYouTubeVideo && playerRef.current) {
      const instruction = recipe?.instructions?.[currentStep];
      if (instruction) {
        const timestamp = getInstructionTimestamp(instruction);
        if (timestamp !== undefined) {
          playerRef.current.seekTo(timestamp, true);
        }
      }
    }
  }, [currentStep, hasYouTubeVideo, recipe]);

  useEffect(() => {
    return () => {
      Object.values(timerIntervalsRef.current).forEach(clearInterval);
    };
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const startTimer = useCallback((totalSeconds: number, label: string) => {
    const timerKey = `${currentStep}-${label}`;
    if (activeTimers[timerKey] !== undefined) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveTimers((prev) => ({ ...prev, [timerKey]: totalSeconds }));

    const interval = setInterval(() => {
      setActiveTimers((prev) => {
        const remaining = (prev[timerKey] || 0) - 1;
        if (remaining <= 0) {
          clearInterval(interval);
          delete timerIntervalsRef.current[timerKey];
          Alert.alert("Timer Done", `${label} timer is up! Time to move on.`);
          const { [timerKey]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [timerKey]: remaining };
      });
    }, 1000);

    timerIntervalsRef.current[timerKey] = interval;
  }, [currentStep, activeTimers]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftIndicatorOpacity = useAnimatedStyle(() => ({
    opacity: swipeDirection.value === "right" ? Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1) : 0,
  }));

  const rightIndicatorOpacity = useAnimatedStyle(() => ({
    opacity: swipeDirection.value === "left" ? Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1) : 0,
  }));

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      translateX.value = event.translationX * 0.5;
      swipeDirection.value = event.translationX > 0 ? "right" : "left";
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(handlePrevious)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(handleNext)();
      }
      translateX.value = withTiming(0, { duration: 200 });
      swipeDirection.value = null;
    });

  if (!recipe) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ThemedText style={{ color: CookModeColors.text }}>Recipe not found</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={handleClose} style={styles.closeButton} testID="cook-mode-close">
          <Feather name="x" size={28} color={CookModeColors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText style={[styles.recipeTitle, { color: CookModeColors.textSecondary }]} numberOfLines={1}>
            {recipe.title}
          </ThemedText>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {recipe.instructions.map((_: string | InstructionStep, index: number) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  index < currentStep
                    ? CookModeColors.stepCompleted
                    : index === currentStep
                      ? CookModeColors.stepActive
                      : CookModeColors.stepPending,
              },
            ]}
          />
        ))}
      </View>

      {/* YouTube Player (outside gesture area) */}
      {hasYouTubeVideo && youtubeVideoId ? (
        <View style={styles.youtubeContainer}>
          <YoutubePlayer
            ref={playerRef}
            height={Math.round((SCREEN_WIDTH - Spacing["3xl"] * 2) * 9 / 16)}
            width={SCREEN_WIDTH - Spacing["3xl"] * 2}
            videoId={youtubeVideoId}
            play={false}
            webViewProps={{
              allowsInlineMediaPlayback: true,
            }}
          />
        </View>
      ) : null}

      {/* Swipeable Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.swipeableArea, contentAnimatedStyle]}>
          {/* Swipe direction indicators */}
          <Animated.View style={[styles.swipeIndicatorLeft, leftIndicatorOpacity]}>
            <Feather name="chevron-left" size={28} color={CookModeColors.primary} />
          </Animated.View>
          <Animated.View style={[styles.swipeIndicatorRight, rightIndicatorOpacity]}>
            <Feather name="chevron-right" size={28} color={CookModeColors.primary} />
          </Animated.View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              key={currentStep}
              entering={FadeIn.duration(200)}
              style={styles.stepContainer}
            >
              <View style={styles.stepHeader}>
                <ThemedText style={[CookModeTypography.stepNumber, { color: CookModeColors.primary }]}>
                  Step {currentStep + 1}
                </ThemedText>
              </View>
              <ThemedText style={[CookModeTypography.stepText, { color: CookModeColors.text, marginTop: Spacing.lg }]}>
                {currentInstructionText}
              </ThemedText>

              {/* Timer Detection */}
              {timeMentions.length > 0 ? (
                <Animated.View entering={FadeIn.duration(300)} style={styles.timerSection}>
                  {timeMentions.map((mention, index) => {
                    const timerKey = `${currentStep}-${mention.amount} ${mention.unit}`;
                    const isActive = activeTimers[timerKey] !== undefined;
                    return (
                      <View key={index} style={styles.timerRow}>
                        {isActive ? (
                          <View style={styles.activeTimerBadge}>
                            <Feather name="clock" size={14} color={CookModeColors.accent} />
                            <ThemedText style={styles.activeTimerText}>
                              {formatTimer(activeTimers[timerKey])}
                            </ThemedText>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => startTimer(mention.totalSeconds, `${mention.amount} ${mention.unit}`)}
                            style={styles.startTimerButton}
                            testID={`start-timer-${index}`}
                          >
                            <Feather name="clock" size={14} color={CookModeColors.background} />
                            <ThemedText style={styles.startTimerText}>
                              Start {mention.amount} {mention.unit} Timer
                            </ThemedText>
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </Animated.View>
              ) : null}

              {stepIngredients.length > 0 ? (
                <Animated.View entering={FadeIn.duration(300)} style={styles.ingredientsSection}>
                  <View style={styles.ingredientsSectionHeader}>
                    <Feather name="shopping-bag" size={16} color={CookModeColors.primary} />
                    <ThemedText style={styles.ingredientsSectionTitle}>
                      Ingredients in this step
                    </ThemedText>
                  </View>
                  <View style={styles.ingredientChips}>
                    {stepIngredients.map((ingredient, index) => (
                      <View key={index} style={styles.ingredientChip}>
                        <ThemedText style={styles.ingredientChipAmount}>
                          {ingredient.amount} {ingredient.unit}
                        </ThemedText>
                        <ThemedText style={styles.ingredientChipName}>
                          {ingredient.name}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              ) : null}
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      {/* Navigation Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          onPress={handlePrevious}
          disabled={currentStep === 0}
          style={[
            styles.navButton,
            { opacity: currentStep === 0 ? 0.3 : 1 },
          ]}
          testID="cook-mode-previous"
        >
          <Feather name="chevron-left" size={40} color={CookModeColors.text} />
          <ThemedText style={[styles.navLabel, { color: CookModeColors.textSecondary }]}>
            Previous
          </ThemedText>
        </Pressable>

        <View style={styles.stepIndicator}>
          <ThemedText style={[styles.stepCount, { color: CookModeColors.text }]}>
            {currentStep + 1} / {totalSteps}
          </ThemedText>
          <ThemedText style={[styles.swipeHint, { color: CookModeColors.textSecondary }]}>
            Swipe to navigate
          </ThemedText>
        </View>

        <Pressable
          onPress={handleNext}
          disabled={currentStep === totalSteps - 1}
          style={[
            styles.navButton,
            { opacity: currentStep === totalSteps - 1 ? 0.3 : 1 },
          ]}
          testID="cook-mode-next"
        >
          <Feather name="chevron-right" size={40} color={CookModeColors.text} />
          <ThemedText style={[styles.navLabel, { color: CookModeColors.textSecondary }]}>
            Next
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CookModeColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingTop: 12,
  },
  closeButton: {
    padding: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 9999,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  recipeTitle: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.6,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
    gap: 6,
    marginBottom: 20,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  youtubeContainer: {
    marginBottom: Spacing.md,
    borderRadius: 24,
    overflow: "hidden",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginHorizontal: Spacing["3xl"],
  },
  swipeableArea: {
    flex: 1,
    position: "relative",
  },
  swipeIndicatorLeft: {
    position: "absolute",
    left: 8,
    top: "45%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  swipeIndicatorRight: {
    position: "absolute",
    right: 8,
    top: "45%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing["4xl"],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing["3xl"],
    flexGrow: 1,
  },
  stepContainer: {
    alignItems: "flex-start",
  },
  timerSection: {
    marginTop: Spacing["3xl"],
    width: "100%",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  startTimerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: CookModeColors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 9999,
  },
  activeTimerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "transparent",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: CookModeColors.accent,
  },
  activeTimerText: {
    fontSize: 48,
    fontWeight: "800",
    color: CookModeColors.accent,
    fontVariant: ["tabular-nums"],
  },
  ingredientsSection: {
    marginTop: Spacing["4xl"],
    width: "100%",
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  ingredientsSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: CookModeColors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 16,
  },
  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 8,
  },
  ingredientChipAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: CookModeColors.primary,
  },
  ingredientChipName: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing["3xl"],
    paddingBottom: 40,
    paddingTop: Spacing.xl,
    backgroundColor: CookModeColors.background,
  },
  navButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  swipeHint: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
    opacity: 0.6,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  stepIndicator: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerRow: {
    marginBottom: Spacing.md,
    width: "100%",
    alignItems: "center",
  },
  startTimerText: {
    fontSize: 14,
    fontWeight: "700",
    color: CookModeColors.background,
  },
  ingredientsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ingredientChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
});
