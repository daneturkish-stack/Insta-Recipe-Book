import React, { useState, useMemo, useCallback } from "react";
import { StyleSheet, View, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useRecipe, useUpdateRecipe } from "@/hooks/useRecipes";
import { Spacing, BorderRadius, KitchColors } from "@/constants/theme";
import { ingredientSource, needsReview, type Ingredient } from "@/types/recipe";

// Parses "60 g" / "2" style amounts into a number plus the trailing label,
// so estimated quantities can be nudged with a stepper. Anything that doesn't
// parse (e.g. "a handful") falls back to free-text editing.
function parseAmount(amount: string): { value: number; suffix: string } | null {
  const match = amount.trim().match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (isNaN(value)) return null;
  return { value, suffix: match[2] };
}

function formatAmount(value: number, suffix: string): string {
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return suffix ? `${text} ${suffix}` : text;
}

export default function ReviewIngredientsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { recipeId } = route.params;

  const recipe = useRecipe(recipeId);
  const updateRecipe = useUpdateRecipe();

  // Work on a local draft of the ingredients so nothing is saved until the
  // reviewer finishes (or bails) - the recipe on disk only changes once.
  const [draft, setDraft] = useState<Ingredient[]>(() => recipe?.ingredients ?? []);
  const [stepIndex, setStepIndex] = useState(0);
  const [customText, setCustomText] = useState<string | null>(null);

  const estimatedIndices = useMemo(
    () => draft.map((ing, i) => (needsReview(ing) ? i : -1)).filter((i) => i >= 0),
    // Only recompute from the initial draft shape - indices shouldn't shift
    // as amounts are edited mid-review.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (!recipe || estimatedIndices.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, justifyContent: "center", alignItems: "center" }]}>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>Nothing left to check here.</ThemedText>
        <Button variant="outline" size="small" style={{ marginTop: Spacing.lg }} onPress={() => navigation.goBack()}>
          Back to recipe
        </Button>
      </View>
    );
  }

  const currentIndex = estimatedIndices[stepIndex];
  const current = draft[currentIndex];
  const parsed = parseAmount(current.amount);
  const wasHeard = ingredientSource(current) === "spoken";

  const commitAndClose = useCallback(async (finalDraft: Ingredient[]) => {
    await updateRecipe.mutateAsync({ id: recipeId, ingredients: finalDraft });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  }, [recipeId, updateRecipe, navigation]);

  const advance = useCallback((nextDraft: Ingredient[]) => {
    setDraft(nextDraft);
    setCustomText(null);
    if (stepIndex + 1 < estimatedIndices.length) {
      setStepIndex(stepIndex + 1);
    } else {
      commitAndClose(nextDraft);
    }
  }, [stepIndex, estimatedIndices.length, commitAndClose]);

  const applyAmount = (newAmount: string, confirm: boolean) => {
    const nextDraft = draft.map((ing, i) =>
      i === currentIndex
        ? confirm
          ? { ...ing, amount: newAmount, isEstimated: false, source: "confirmed" as const }
          : { ...ing, amount: newAmount }
        : ing
    );
    Haptics.selectionAsync();
    advance(nextDraft);
  };

  const nudge = (delta: number) => {
    if (!parsed) return;
    setDraft((prev) =>
      prev.map((ing, i) =>
        i === currentIndex ? { ...ing, amount: formatAmount(Math.max(0, parsed.value + delta), parsed.suffix) } : ing
      )
    );
    Haptics.selectionAsync();
  };

  const step = parsed ? Math.max(1, Math.round(parsed.value * 0.1)) : 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingBottom: insets.bottom + Spacing.lg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.closeButton, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="x" size={18} color={theme.text} />
        </Pressable>
        <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSecondary }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.accent, width: `${((stepIndex) / estimatedIndices.length) * 100}%` },
            ]}
          />
        </View>
        <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: "700" }}>
          {stepIndex + 1} of {estimatedIndices.length}
        </ThemedText>
      </View>

      <Animated.View key={currentIndex} entering={FadeIn.duration(200)} style={styles.body}>
        <ThemedText type="caption" style={{ color: theme.accent, letterSpacing: 1.5, fontWeight: "700", marginBottom: 6 }}>
          {recipe.title.toUpperCase()}
        </ThemedText>
        <ThemedText type="h2" style={{ marginBottom: 8 }}>
          {wasHeard ? `Did we hear "${current.name}" right?` : `How much "${current.name}"?`}
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, lineHeight: 22 }}>
          {wasHeard
            ? "This came from the audio, so it's our best guess rather than gospel. Sort it now and the recipe's yours for good."
            : "The creator didn't say, so we estimated it. Adjust it to taste and the recipe's yours for good."}
        </ThemedText>
        {wasHeard && current.evidence ? (
          <ThemedText type="body" style={{ color: theme.textSecondary, fontStyle: "italic", marginTop: Spacing.sm }}>
            We heard: "{current.evidence}"
          </ThemedText>
        ) : null}

        <View style={[styles.amountCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText type="caption" style={{ color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase" }}>
            {current.name}
          </ThemedText>

          {parsed ? (
            <View style={styles.stepperRow}>
              <Pressable onPress={() => nudge(-step)} style={[styles.stepperButton, { backgroundColor: theme.backgroundRoot }]}>
                <ThemedText type="h3">−</ThemedText>
              </Pressable>
              <View style={{ flex: 1, alignItems: "center" }}>
                <ThemedText type="hero" style={{ fontSize: 34 }}>{current.amount}</ThemedText>
              </View>
              <Pressable onPress={() => nudge(step)} style={[styles.stepperButton, { backgroundColor: theme.backgroundRoot }]}>
                <ThemedText type="h3">+</ThemedText>
              </Pressable>
            </View>
          ) : (
            <TextInput
              value={customText ?? current.amount}
              onChangeText={setCustomText}
              placeholder="Enter amount"
              placeholderTextColor={theme.textSecondary}
              style={[styles.customInput, { color: theme.text, borderColor: theme.border }]}
            />
          )}
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.actionsRow}>
          <Button
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => applyAmount(current.amount, false)}
          >
            {wasHeard ? "Leave as heard" : "Keep estimate"}
          </Button>
          <Button
            style={{ flex: 1.3 }}
            onPress={() => applyAmount(customText ?? current.amount, true)}
          >
            Save · next
          </Button>
        </View>
        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
          Fixes teach Simmer this creator's habits.
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  body: {
    flex: 1,
    padding: Spacing.xl,
  },
  amountCard: {
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  customInput: {
    marginTop: Spacing.md,
    height: 52,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 18,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
});
