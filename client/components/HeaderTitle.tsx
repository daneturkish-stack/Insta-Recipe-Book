import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

// Simmer's mark: a simmering pot with steam, from the Organic design system.
export function SimmerIcon({ size = 26, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 11h16v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM2 11h2M20 11h2M9 7c0-1.2 1-1.6 1-2.8M14 7c0-1.2 1-1.6 1-2.8" />
    </Svg>
  );
}

export function HeaderTitle() {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconBadge, { backgroundColor: theme.accent }]}>
        <SimmerIcon size={18} color={theme.backgroundRoot} />
      </View>
      <ThemedText type="h4" style={[styles.appName, { color: theme.text }]}>
        Simmer
      </ThemedText>
    </View>
  );
}

interface ScreenHeaderTitleProps {
  title: string;
}

export function ScreenHeaderTitle({ title }: ScreenHeaderTitleProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.screenTitleContainer}>
      <ThemedText type="bodyMedium" style={[styles.screenTitle, { color: theme.text }]}>
        {title}
      </ThemedText>
      <View style={[styles.underline, { backgroundColor: theme.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: Spacing.sm,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 20,
  },
  screenTitleContainer: {
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  underline: {
    height: 2,
    borderRadius: 1,
    marginTop: 4,
    width: "100%",
  },
});
