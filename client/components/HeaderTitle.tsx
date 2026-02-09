import React from "react";
import { View, StyleSheet, Image } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

const kitchIcon = require("../../assets/images/kitch-icon.png");

export function HeaderTitle() {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Image
        source={kitchIcon}
        style={styles.icon}
        resizeMode="contain"
      />
      <ThemedText type="bodyMedium" style={[styles.appName, { color: theme.text }]}>
        Kitch
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
  icon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
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
