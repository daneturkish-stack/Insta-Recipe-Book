import React from "react";
import { View, StyleSheet, Image } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface HeaderTitleProps {
  title: string;
}

export function HeaderTitle({ title }: HeaderTitleProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <ThemedText type="h4" style={styles.title}>{title}</ThemedText>
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
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: Spacing.sm,
    borderRadius: 6,
  },
  title: {
    fontSize: 18,
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
