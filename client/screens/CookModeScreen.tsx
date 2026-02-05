import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, View, Pressable, Dimensions, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import Animated, { FadeIn, SlideInRight, SlideOutLeft } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useRecipe } from "@/hooks/useRecipes";
import { CookModeColors, CookModeTypography, Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CookModeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { recipeId } = route.params;

  const recipe = useRecipe(recipeId);
  const [currentStep, setCurrentStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoRead, setAutoRead] = useState(false);

  const totalSteps = recipe?.instructions?.length || 0;

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
    if (autoRead && recipe?.instructions?.[currentStep] && !showIngredients) {
      speakInstruction(recipe.instructions[currentStep]);
    }
  }, [currentStep, autoRead, recipe, showIngredients, speakInstruction]);

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
          <Pressable 
            onPress={() => setShowIngredients(!showIngredients)} 
            style={[styles.headerButton, showIngredients && styles.headerButtonActive]}
          >
            <Feather name="list" size={22} color={showIngredients ? CookModeColors.primary : CookModeColors.text} />
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
      <View style={styles.content}>
        {showIngredients ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.ingredientsPanel}>
            <ThemedText style={[styles.sectionTitle, { color: CookModeColors.primary }]}>
              Ingredients
            </ThemedText>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <ThemedText style={[CookModeTypography.ingredient, { color: CookModeColors.text }]}>
                  {ingredient.amount} {ingredient.unit}
                </ThemedText>
                <ThemedText style={[CookModeTypography.ingredient, { color: CookModeColors.textSecondary, marginLeft: Spacing.md }]}>
                  {ingredient.name}
                </ThemedText>
              </View>
            ))}
          </Animated.View>
        ) : (
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
          </Animated.View>
        )}
      </View>

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
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  ingredientsPanel: {
    paddingVertical: Spacing.xl,
  },
  ingredientRow: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: CookModeColors.border,
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
