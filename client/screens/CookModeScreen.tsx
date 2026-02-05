import React, { useState, useCallback, useEffect, useMemo } from "react";
import { StyleSheet, View, Pressable, Dimensions, StatusBar, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useRecipe } from "@/hooks/useRecipes";
import { CookModeColors, CookModeTypography, Spacing, BorderRadius } from "@/constants/theme";
import { Ingredient } from "@/types/recipe";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function getStepIngredients(instruction: string, ingredients: Ingredient[]): Ingredient[] {
  if (!instruction || !ingredients) return [];
  const lowerInstruction = instruction.toLowerCase();
  return ingredients.filter((ingredient) => {
    const name = ingredient.name.toLowerCase();
    const words = name.split(/\s+/);
    if (words.length > 1) {
      return words.some((word) => word.length > 2 && lowerInstruction.includes(word));
    }
    return lowerInstruction.includes(name);
  });
}

export default function CookModeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { recipeId } = route.params;

  const recipe = useRecipe(recipeId);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoRead, setAutoRead] = useState(false);

  const totalSteps = recipe?.instructions?.length || 0;

  const stepIngredients = useMemo(() => {
    if (!recipe?.instructions?.[currentStep] || !recipe?.ingredients) return [];
    return getStepIngredients(recipe.instructions[currentStep], recipe.ingredients);
  }, [recipe, currentStep]);

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
    } else if (recipe?.instructions?.[currentStep]) {
      speakInstruction(recipe.instructions[currentStep]);
    }
  }, [isSpeaking, recipe, currentStep, speakInstruction]);

  useEffect(() => {
    if (autoRead && recipe?.instructions?.[currentStep]) {
      speakInstruction(recipe.instructions[currentStep]);
    }
  }, [currentStep, autoRead, recipe, speakInstruction]);

  useEffect(() => {
    return () => {
      Speech.stop();
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
            style={[styles.headerButton, autoRead && styles.headerButtonActive]}
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
              style={[styles.speakButton, isSpeaking && styles.speakButtonActive]}
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
            {recipe.instructions[currentStep]}
          </ThemedText>

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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  recipeTitle: {
    fontSize: 16,
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  headerButtonActive: {
    backgroundColor: CookModeColors.surface,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    maxWidth: 40,
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
    paddingVertical: Spacing.xl,
  },
  stepContainer: {
    alignItems: "center",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  speakButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  speakButtonActive: {
    backgroundColor: CookModeColors.surface,
  },
  ingredientsSection: {
    marginTop: Spacing["2xl"],
    width: "100%",
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: CookModeColors.border,
  },
  ingredientsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ingredientsSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: CookModeColors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ingredientChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CookModeColors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: CookModeColors.border,
    gap: Spacing.xs,
  },
  ingredientChipAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: CookModeColors.primary,
  },
  ingredientChipName: {
    fontSize: 15,
    color: CookModeColors.text,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing["3xl"],
    paddingTop: Spacing.xl,
  },
  navButton: {
    alignItems: "center",
    padding: Spacing.md,
  },
  navLabel: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  stepIndicator: {
    alignItems: "center",
  },
  stepCount: {
    fontSize: 18,
    fontWeight: "600",
  },
  tapZoneLeft: {
    position: "absolute",
    left: 0,
    top: 120,
    bottom: 160,
    width: SCREEN_WIDTH * 0.3,
  },
  tapZoneRight: {
    position: "absolute",
    right: 0,
    top: 120,
    bottom: 160,
    width: SCREEN_WIDTH * 0.3,
  },
});
