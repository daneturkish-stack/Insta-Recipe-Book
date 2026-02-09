import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View, Pressable, Dimensions, StatusBar, ScrollView, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import YoutubePlayer from "react-native-youtube-iframe";

import { ThemedText } from "@/components/ThemedText";
import { useRecipe } from "@/hooks/useRecipes";
import { CookModeColors, CookModeTypography, Spacing, BorderRadius } from "@/constants/theme";
import { Ingredient, InstructionStep } from "@/types/recipe";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

const REMI_KEYWORDS = [
  { patterns: ["how much", "how many", "what amount"], type: "ingredients" as const },
  { patterns: ["what ingredients", "which ingredients", "ingredients for"], type: "ingredients" as const },
  { patterns: ["what temperature", "how hot", "what temp"], type: "temperature" as const },
  { patterns: ["how long", "what time", "how many minutes"], type: "time" as const },
];

export default function CookModeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { recipeId } = route.params;

  const recipe = useRecipe(recipeId);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const playerRef = useRef<any>(null);
  const timerIntervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

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

  const speakInstruction = useCallback((text: string) => {
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(text, {
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, []);

  const toggleSpeak = useCallback(() => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else if (currentInstructionText) {
      speakInstruction(currentInstructionText);
    }
  }, [isSpeaking, currentInstructionText, speakInstruction]);

  useEffect(() => {
    if (autoRead && currentInstructionText) {
      speakInstruction(currentInstructionText);
    }
  }, [currentStep, autoRead, currentInstructionText, speakInstruction]);

  useEffect(() => {
    return () => {
      Speech.stop();
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

  const handleAskRemi = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (stepIngredients.length > 0) {
      const ingredientList = stepIngredients
        .map((i) => `${i.amount} ${i.unit} ${i.name}`.trim())
        .join(", ");
      speakInstruction(`For this step, you'll need: ${ingredientList}`);
    } else {
      speakInstruction("No specific ingredients identified for this step. Try asking about the next step!");
    }
  }, [stepIngredients, speakInstruction]);

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
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Feather name="x" size={28} color={CookModeColors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText style={[styles.recipeTitle, { color: CookModeColors.textSecondary }]} numberOfLines={1}>
            {recipe.title}
          </ThemedText>
        </View>
        <View style={styles.headerActions}>
          <Pressable 
            onPress={() => setAutoRead(!autoRead)} 
            style={[styles.headerButton, autoRead ? styles.headerButtonActive : null]}
            testID="cook-mode-auto-read"
          >
            <Feather name={autoRead ? "volume-2" : "volume-x"} size={22} color={autoRead ? CookModeColors.primary : CookModeColors.text} />
          </Pressable>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {recipe.instructions.map((_, index) => (
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

      {/* Main Content */}
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content}>
        {/* YouTube Player */}
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

        <Animated.View 
          key={currentStep}
          entering={SlideInRight.duration(300)}
          style={styles.stepContainer}
        >
          <View style={styles.stepHeader}>
            <ThemedText style={[CookModeTypography.stepNumber, { color: CookModeColors.primary }]}>
              Step {currentStep + 1}
            </ThemedText>
            <Pressable 
              onPress={toggleSpeak} 
              style={[styles.speakButton, isSpeaking ? styles.speakButtonActive : null]}
              testID="cook-mode-speak"
            >
              <Feather 
                name={isSpeaking ? "volume-2" : "volume-1"} 
                size={24} 
                color={isSpeaking ? CookModeColors.primary : CookModeColors.textSecondary} 
              />
            </Pressable>
          </View>
          <ThemedText style={[CookModeTypography.stepText, { color: CookModeColors.text }]}>
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

      {/* Navigation Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          onPress={handlePrevious}
          disabled={currentStep === 0}
          style={[
            styles.navButton,
            { opacity: currentStep === 0 ? 0.3 : 1 },
          ]}
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
        </View>

        <Pressable
          onPress={handleNext}
          disabled={currentStep === totalSteps - 1}
          style={[
            styles.navButton,
            { opacity: currentStep === totalSteps - 1 ? 0.3 : 1 },
          ]}
        >
          <Feather name="chevron-right" size={40} color={CookModeColors.text} />
          <ThemedText style={[styles.navLabel, { color: CookModeColors.textSecondary }]}>
            Next
          </ThemedText>
        </Pressable>
      </View>

      {/* Tap zones for navigation */}
      <Pressable 
        style={styles.tapZoneLeft} 
        onPress={handlePrevious}
      />
      <Pressable 
        style={styles.tapZoneRight} 
        onPress={handleNext}
      />

      {/* Ask Remi Floating Mic Button */}
      <Pressable
        onPress={handleAskRemi}
        style={[styles.askRemiFab, { bottom: insets.bottom + Spacing.xl + 80 }]}
        testID="ask-remi-mic"
      >
        <Feather name="mic" size={24} color={CookModeColors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CookModeColors.background, // Near-black for focus
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 9999,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  recipeTitle: {
    fontSize: 14, // Smaller, subtle header title to keep focus on the step
    textAlign: "center",
    opacity: 0.6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.sm,
    borderRadius: 12,
  },
  headerButtonActive: {
    backgroundColor: CookModeColors.primary, // Emerald for active states
  },
  // Modern linear progress bar
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
  contentScroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["4xl"], // More horizontal breathability
    paddingVertical: Spacing.xl,
  },
  youtubeContainer: {
    marginBottom: Spacing["2xl"],
    borderRadius: 24, // Matches brand radius
    overflow: "hidden",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stepContainer: {
    alignItems: "flex-start", // Left aligned for easier reading of large text
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  speakButton: {
    padding: Spacing.md,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  // Timer Section: High Visibility
  timerSection: {
    marginTop: Spacing["3xl"],
    width: "100%",
    alignItems: "center",
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  startTimerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: CookModeColors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 9999, // Pill shape
  },
  activeTimerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: CookModeColors.accent, // Amber for active timers
  },
  activeTimerText: {
    fontSize: 48, // Massive text for kitchen visibility
    fontWeight: "800",
    color: CookModeColors.accent,
    fontVariant: ["tabular-nums"],
  },
  // Ingredient Chips: Clean and readable
  ingredientsSection: {
    marginTop: Spacing["4xl"],
    width: "100%",
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16, // Softer chips
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  ingredientChipAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: CookModeColors.primary,
  },
  ingredientChipName: {
    fontSize: 16,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: "center",
    justifyContent: "center",
  },
  stepCount: {
    fontSize: 20,
    fontWeight: "700",
    color: '#FFFFFF',
  },
  // Floating Action Button for Remy AI
  askRemiFab: {
    position: "absolute",
    right: Spacing.xl,
    bottom: 120,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: CookModeColors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: CookModeColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  speakButtonActive: {
    backgroundColor: CookModeColors.primary + "30",
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
  tapZoneLeft: {
    position: "absolute",
    left: 0,
    top: "30%",
    width: "15%",
    height: "40%",
  },
  tapZoneRight: {
    position: "absolute",
    right: 0,
    top: "30%",
    width: "15%",
    height: "40%",
  },
});