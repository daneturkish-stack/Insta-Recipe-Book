import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useRecipes } from "@/hooks/useRecipes";
import {
  usePreferences,
  ALL_DIETARY_OPTIONS,
  DietaryPreference,
} from "@/hooks/usePreferences";
import { Spacing, BorderRadius } from "@/constants/theme";

const avatarImage = require("../../assets/images/avatar-preset.png");

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { data: recipes } = useRecipes();
  const {
    dietaryPreferences,
    toggleDietaryPreference,
    loaded,
  } = usePreferences();

  const recipeCount = recipes?.length || 0;

  const SettingsRow = ({
    icon,
    label,
    value,
    onPress,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptics.selectionAsync();
          onPress();
        }
      }}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        { backgroundColor: theme.backgroundDefault, opacity: pressed && onPress ? 0.8 : 1 },
      ]}
    >
      <View style={styles.settingsLeft}>
        <Feather name={icon} size={20} color={theme.primary} />
        <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
          {label}
        </ThemedText>
      </View>
      <View style={styles.settingsRight}>
        {value ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {value}
          </ThemedText>
        ) : null}
        {onPress ? (
          <Feather name="chevron-right" size={18} color={theme.textSecondary} style={{ marginLeft: Spacing.sm }} />
        ) : null}
      </View>
    </Pressable>
  );

  const DietaryChip = ({ label }: { label: DietaryPreference }) => {
    const isSelected = dietaryPreferences.includes(label);
    return (
      <Pressable
        testID={`chip-dietary-${label}`}
        onPress={() => {
          Haptics.selectionAsync();
          toggleDietaryPreference(label);
        }}
        style={({ pressed }) => [
          styles.chip,
          {
            backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
            borderColor: isSelected ? theme.primary : theme.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <ThemedText
          type="small"
          style={{
            color: isSelected ? "#FFFFFF" : theme.text,
            fontWeight: isSelected ? "600" : "400",
          }}
        >
          {label}
        </ThemedText>
      </Pressable>
    );
  };


  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.profileSection}>
        <Image
          source={avatarImage}
          style={styles.avatar}
          contentFit="cover"
        />
        <ThemedText type="h3" style={styles.name}>
          Home Chef
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Recipe collector
        </ThemedText>

        <View style={[styles.statsCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: theme.primary }}>
              {recipeCount}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Recipes
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Dietary Preferences
        </ThemedText>
        <ThemedText
          type="caption"
          style={{ color: theme.textSecondary, marginBottom: Spacing.md, paddingLeft: Spacing.xs }}
        >
          Remi will tailor suggestions to match your diet
        </ThemedText>
        <View style={styles.chipGrid}>
          {ALL_DIETARY_OPTIONS.map((option) => (
            <DietaryChip key={option} label={option} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Preferences
        </ThemedText>
        <View style={styles.settingsGroup}>
          <SettingsRow icon="moon" label="Dark Mode" value="System" />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          About
        </ThemedText>
        <View style={styles.settingsGroup}>
          <SettingsRow icon="info" label="Version" value="1.0.0" />
          <SettingsRow icon="file-text" label="Privacy Policy" onPress={() => {}} />
          <SettingsRow icon="shield" label="Terms of Service" onPress={() => {}} />
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
          Kitch - Your Digital Recipe Book
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.xs }}>
          Made with love for home cooks
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.lg,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  statsCard: {
    flexDirection: "row",
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["3xl"],
    borderRadius: BorderRadius.sm,
  },
  statItem: {
    alignItems: "center",
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: Spacing.md,
    paddingLeft: Spacing.xs,
  },
  settingsGroup: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    gap: 1,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  footer: {
    marginTop: Spacing["2xl"],
    paddingTop: Spacing["2xl"],
  },
});
