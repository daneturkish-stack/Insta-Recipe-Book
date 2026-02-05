import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Shadows, KitchColors } from "@/constants/theme";

interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "amber" | "navy";
  size?: "default" | "small";
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  children,
  style,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "default",
}: ButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.97, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getBackgroundColor = () => {
    if (variant === "outline") return "transparent";
    if (variant === "secondary") return theme.backgroundSecondary;
    if (variant === "amber") return theme.accent;
    if (variant === "navy") return KitchColors.navy;
    return theme.primary; // Mint/Teal
  };

  const getTextColor = () => {
    if (variant === "outline") return theme.primary;
    if (variant === "secondary") return theme.text;
    if (variant === "amber") return "#1F2937";
    if (variant === "navy") return "#FFFFFF";
    return theme.buttonText;
  };

  const getBorderStyle = () => {
    if (variant === "outline") {
      return { borderWidth: 2, borderColor: theme.primary };
    }
    return {};
  };

  const getShadow = () => {
    if (variant === "primary") return Shadows.button;
    if (variant === "amber") return {
      ...Shadows.button,
      shadowColor: KitchColors.accent,
    };
    if (variant === "navy") return {
      ...Shadows.button,
      shadowColor: KitchColors.navy,
    };
    return {};
  };

  const isSmall = size === "small";

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        isSmall && styles.buttonSmall,
        {
          backgroundColor: getBackgroundColor(),
          opacity: disabled ? 0.5 : 1,
        },
        getBorderStyle(),
        getShadow(),
        style,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <ThemedText
          type={isSmall ? "small" : "bodyMedium"}
          style={[styles.buttonText, { color: getTextColor() }]}
        >
          {children}
        </ThemedText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  buttonSmall: {
    height: 40,
    paddingHorizontal: Spacing.xl,
  },
  buttonText: {
    fontWeight: "600",
  },
});
