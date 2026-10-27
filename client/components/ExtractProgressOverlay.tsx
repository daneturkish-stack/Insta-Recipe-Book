import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, KitchColors } from "@/constants/theme";

const STEPS = [
  { label: "Grabbing the link", detail: "Fetching the post" },
  { label: "Reading captions & on-screen text", detail: "Looking for ingredients" },
  { label: "Listening to the voiceover", detail: "Cross-checking amounts" },
  { label: "Writing it up", detail: "Flagging anything shaky" },
];

// There's no real step-by-step progress from the backend - a single request
// either succeeds or fails. This advances a generic step indicator on a timer
// purely so the wait doesn't read as frozen; it never claims a specific
// creator/video detail we don't actually have yet.
export function ExtractProgressOverlay() {
  const { theme } = useTheme();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (activeStep >= STEPS.length - 1) return;
    const timer = setTimeout(() => setActiveStep((s) => s + 1), 1800);
    return () => clearTimeout(timer);
  }, [activeStep]);

  return (
    <Animated.View entering={FadeIn.duration(250)} style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.content}>
        <ThemedText type="h2" style={{ marginBottom: 8, textAlign: "center" }}>
          Turning a reel into dinner
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginBottom: Spacing.xl }}>
          Usually about eight seconds. Feel free to wait right here.
        </ThemedText>

        <View style={[styles.stepsCard, { backgroundColor: theme.backgroundTertiary }]}>
          {STEPS.map((step, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <View key={step.label} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: done ? KitchColors.sage500 : active ? theme.accent : theme.border,
                    },
                  ]}
                >
                  {done ? <Feather name="check" size={14} color="#fff" /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="bodyMedium" style={{ fontWeight: active ? "700" : "500", color: done || active ? theme.text : theme.textSecondary }}>
                    {step.label}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {step.detail}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </View>

        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.lg, lineHeight: 18 }}>
          Simmer reads the caption, the on-screen text, and the spoken words, then checks they agree.
          Anything that doesn't gets flagged rather than guessed.
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    zIndex: 10,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  stepsCard: {
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
});
