import React from "react";
import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { KitchColors, Spacing, BorderRadius } from "@/constants/theme";

const appIcon = require("../../assets/images/icon.png");

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { logout, trial } = useAuth();

  const handleSubscribe = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing["4xl"], paddingBottom: insets.bottom + Spacing["3xl"] },
      ]}
    >
      <View style={styles.headerSection}>
        <Image source={appIcon} style={styles.appIcon} contentFit="contain" />
        <ThemedText type="h2" style={styles.title}>
          Your trial has ended
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", lineHeight: 24 }}>
          Subscribe to Kitch Pro to keep saving recipes and using all features
        </ThemedText>
      </View>

      <View style={styles.features}>
        {[
          { icon: "zap" as const, title: "Unlimited Recipes", desc: "Save as many recipes as you want" },
          { icon: "cpu" as const, title: "AI Recipe Extraction", desc: "Extract recipes from any social post" },
          { icon: "message-circle" as const, title: "Remi AI Assistant", desc: "Your personal cooking companion" },
          { icon: "list" as const, title: "Smart Pantry", desc: "Match ingredients to recipes" },
          { icon: "volume-2" as const, title: "Cook Mode", desc: "Hands-free step-by-step guidance" },
        ].map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={[styles.featureIconWrap, { backgroundColor: KitchColors.primaryMuted }]}>
              <Feather name={feature.icon} size={18} color={KitchColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="bodyMedium">{feature.title}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {feature.desc}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.planCard, { backgroundColor: theme.backgroundDefault, borderColor: KitchColors.primary }]}>
        <View style={[styles.popularBadge, { backgroundColor: KitchColors.primary }]}>
          <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "700" }}>
            BEST VALUE
          </ThemedText>
        </View>
        <ThemedText type="h3" style={{ marginTop: Spacing.md }}>Kitch Pro</ThemedText>
        <View style={styles.priceRow}>
          <ThemedText type="h1" style={{ color: KitchColors.primary }}>$4.99</ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>/month</ThemedText>
        </View>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Cancel anytime
        </ThemedText>
      </View>

      <Pressable
        testID="button-subscribe"
        style={[styles.subscribeButton, { backgroundColor: KitchColors.primary }]}
        onPress={handleSubscribe}
      >
        <ThemedText type="bodyMedium" style={{ color: "#FFFFFF", fontSize: 17 }}>
          Subscribe Now
        </ThemedText>
      </Pressable>

      <Pressable
        testID="button-restore"
        style={styles.restoreButton}
        onPress={handleRestore}
      >
        <ThemedText type="small" style={{ color: KitchColors.primary }}>
          Restore Purchases
        </ThemedText>
      </Pressable>

      <View style={styles.bottomLinks}>
        <Pressable
          testID="button-logout-paywall"
          onPress={logout}
          style={styles.logoutLink}
        >
          <Feather name="log-out" size={16} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
            Sign out
          </ThemedText>
        </Pressable>
      </View>

      <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.xl }}>
        Subscription auto-renews monthly. Manage in your device settings.
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    flexGrow: 1,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  features: {
    gap: Spacing.lg,
    marginBottom: Spacing["3xl"],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  planCard: {
    borderRadius: BorderRadius.card,
    borderWidth: 2,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
    position: "relative",
    overflow: "hidden",
  },
  popularBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginVertical: Spacing.sm,
  },
  subscribeButton: {
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  restoreButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomLinks: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  logoutLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
});
