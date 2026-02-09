import React, { useState } from "react";
import { StyleSheet, View, Pressable, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useRecipes } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";
import {
  usePreferences,
  ALL_DIETARY_OPTIONS,
  DietaryPreference,
} from "@/hooks/usePreferences";
import { KitchColors, Spacing, BorderRadius } from "@/constants/theme";

const avatarImage = require("../../assets/images/avatar-preset.png");

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { data: recipes } = useRecipes();
  const { user, trial, logout, updateProfileImage } = useAuth();
  const {
    dietaryPreferences,
    toggleDietaryPreference,
    measurementUnit,
    setMeasurementUnit,
    loaded,
  } = usePreferences();
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const recipeCount = recipes?.length || 0;

  const handlePickImage = async () => {
    try {
      Haptics.selectionAsync();
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permResult.granted) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setIsUploadingImage(true);
      await updateProfileImage(result.assets[0].uri);
    } catch (err) {
      console.error("Failed to update profile image:", err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const SettingsRow = ({
    icon,
    label,
    value,
    onPress,
    destructive,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    destructive?: boolean;
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
        <Feather name={icon} size={20} color={destructive ? KitchColors.error : theme.primary} />
        <ThemedText type="body" style={{ marginLeft: Spacing.md, color: destructive ? KitchColors.error : theme.text }}>
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

  const trialDaysText = trial
    ? trial.expired
      ? "Expired"
      : `${trial.daysLeft} days left`
    : "";

  const subscriptionLabel = user?.subscriptionStatus === "active"
    ? "Pro"
    : trialDaysText;

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.profileSection}>
        <Pressable onPress={handlePickImage} style={styles.avatarContainer} testID="btn-edit-avatar">
          {user?.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <Image
              source={avatarImage}
              style={styles.avatar}
              contentFit="cover"
            />
          )}
          <View style={[styles.avatarEditBadge, { backgroundColor: theme.primary }]}>
            {isUploadingImage ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Feather name="camera" size={14} color="#FFF" />
            )}
          </View>
        </Pressable>
        <ThemedText type="h3" style={styles.name}>
          {user?.displayName || "Home Chef"}
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {user?.email || "Recipe collector"}
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

      {trial && !trial.expired && user?.subscriptionStatus !== "active" ? (
        <View style={[styles.trialCard, { backgroundColor: `${KitchColors.accent}15` }]}>
          <View style={styles.trialHeader}>
            <Feather name="gift" size={18} color={KitchColors.accent} />
            <ThemedText type="bodyMedium" style={{ marginLeft: Spacing.sm, color: KitchColors.accent }}>
              Free Trial
            </ThemedText>
          </View>
          <ThemedText type="h3" style={{ marginVertical: Spacing.sm }}>
            {trial.daysLeft} days remaining
          </ThemedText>
          <View style={styles.trialProgressBg}>
            <View
              style={[
                styles.trialProgressFill,
                {
                  backgroundColor: KitchColors.accent,
                  width: `${Math.max(5, (trial.daysLeft / 30) * 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      ) : null}

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
          Cooking
        </ThemedText>
        <ThemedText
          type="caption"
          style={{ color: theme.textSecondary, marginBottom: Spacing.md, paddingLeft: Spacing.xs }}
        >
          Recipe ingredients will display in your preferred units
        </ThemedText>
        <View style={styles.measurementToggle}>
          <Pressable
            testID="btn-unit-imperial"
            onPress={() => {
              Haptics.selectionAsync();
              setMeasurementUnit("imperial");
            }}
            style={[
              styles.measurementOption,
              {
                backgroundColor: measurementUnit === "imperial" ? theme.primary : theme.backgroundDefault,
                borderColor: measurementUnit === "imperial" ? theme.primary : theme.border,
              },
            ]}
          >
            <ThemedText
              type="bodyMedium"
              style={{
                color: measurementUnit === "imperial" ? "#FFFFFF" : theme.text,
                textAlign: "center",
              }}
            >
              Imperial
            </ThemedText>
            <ThemedText
              type="caption"
              style={{
                color: measurementUnit === "imperial" ? "rgba(255,255,255,0.7)" : theme.textSecondary,
                textAlign: "center",
                marginTop: 2,
              }}
            >
              oz, cups, °F
            </ThemedText>
          </Pressable>
          <Pressable
            testID="btn-unit-metric"
            onPress={() => {
              Haptics.selectionAsync();
              setMeasurementUnit("metric");
            }}
            style={[
              styles.measurementOption,
              {
                backgroundColor: measurementUnit === "metric" ? theme.primary : theme.backgroundDefault,
                borderColor: measurementUnit === "metric" ? theme.primary : theme.border,
              },
            ]}
          >
            <ThemedText
              type="bodyMedium"
              style={{
                color: measurementUnit === "metric" ? "#FFFFFF" : theme.text,
                textAlign: "center",
              }}
            >
              Metric
            </ThemedText>
            <ThemedText
              type="caption"
              style={{
                color: measurementUnit === "metric" ? "rgba(255,255,255,0.7)" : theme.textSecondary,
                textAlign: "center",
                marginTop: 2,
              }}
            >
              g, ml, °C
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Account
        </ThemedText>
        <View style={styles.settingsGroup}>
          <SettingsRow
            icon="user"
            label="Subscription"
            value={subscriptionLabel}
          />
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

      <View style={styles.section}>
        <View style={styles.settingsGroup}>
          <SettingsRow
            icon="log-out"
            label="Sign Out"
            onPress={logout}
            destructive
          />
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
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
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
  trialCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing["2xl"],
  },
  trialHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  trialProgressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(232, 168, 56, 0.2)",
    overflow: "hidden",
  },
  trialProgressFill: {
    height: 6,
    borderRadius: 3,
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
  measurementToggle: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  measurementOption: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
  },
  footer: {
    marginTop: Spacing["2xl"],
    paddingTop: Spacing["2xl"],
  },
});
