import React from "react";
import { View, StyleSheet, Image } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

const logoLight = require("../../assets/images/logo-light.png");
const logoDark = require("../../assets/images/logo-dark.png");

export function HeaderTitle() {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Image
        source={isDark ? logoDark : logoLight}
        style={styles.logo}
        resizeMode="contain"
      />
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
  logo: {
    width: 100,
    height: 36,
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
