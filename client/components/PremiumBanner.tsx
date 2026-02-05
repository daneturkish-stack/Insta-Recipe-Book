import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Pressable } from "react-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius, KitchColors, Shadows } from "@/constants/theme";

interface PremiumBannerProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PremiumBanner({
  title = "Unlock Unlimited Recipes",
  subtitle,
  buttonText = "Go Premium",
  onPress,
  style,
}: PremiumBannerProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, springConfig);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      style={[
        styles.container,
        Shadows.card,
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.content}>
        <ThemedText type="h4" style={styles.title}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={handlePress}
          style={styles.button}
        >
          <ThemedText type="bodyMedium" style={styles.buttonText}>
            {buttonText}
          </ThemedText>
        </Pressable>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: KitchColors.navy,
    borderRadius: BorderRadius.card,
    padding: Spacing["2xl"],
    alignItems: "center",
    gap: Spacing.lg,
  },
  content: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  title: {
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: Spacing.sm,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
