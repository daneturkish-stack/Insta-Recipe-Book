import React from "react";
import { StyleSheet, Pressable, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image, ImageSource } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, KitchColors, PastelColors } from "@/constants/theme";

interface CategoryChipProps {
  label: string;
  icon?: ImageSource;
  iconComponent?: React.ReactNode;
  isSelected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  color?: string;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const pastelColors = PastelColors;

export function CategoryChip({
  label,
  icon,
  iconComponent,
  isSelected = false,
  onPress,
  style,
  color,
}: CategoryChipProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.95, springConfig);
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

  // Get pastel background based on label hash
  const getPastelColor = () => {
    if (color) return color;
    const hash = label.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return pastelColors[hash % pastelColors.length];
  };

  const backgroundColor = isSelected ? theme.primary : getPastelColor();
  const textColor = isSelected ? "#FFFFFF" : theme.text;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      style={[styles.container, animatedStyle, style]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor },
        ]}
      >
        {icon ? (
          <Image source={icon} style={styles.icon} contentFit="contain" />
        ) : iconComponent ? (
          iconComponent
        ) : null}
      </View>
      <ThemedText
        type="caption"
        style={[styles.label, { color: textColor }]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: Spacing.sm,
    minWidth: 64,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 36,
    height: 36,
  },
  label: {
    fontWeight: "500",
    textAlign: "center",
  },
});
