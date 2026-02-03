import React, { useState } from "react";
import { StyleSheet, View, Keyboard, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { RecipePreviewCard } from "@/components/RecipePreviewCard";
import { useTheme } from "@/hooks/useTheme";
import { useGenerateRecipe, useSaveRecipe } from "@/hooks/useRecipes";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { Recipe } from "@/types/recipe";

export default function AddRecipeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);

  const generateRecipe = useGenerateRecipe();
  const saveRecipe = useSaveRecipe();

  const isValidInstagramUrl = (url: string) => {
    const pattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels)\/[\w-]+/i;
    return pattern.test(url);
  };

  const handleGenerate = async () => {
    Keyboard.dismiss();
    setError("");
    setGeneratedRecipe(null);

    if (!url.trim()) {
      setError("Please enter an Instagram URL");
      return;
    }

    if (!isValidInstagramUrl(url)) {
      setError("Please enter a valid Instagram post or reel URL");
      return;
    }

    try {
      const recipe = await generateRecipe.mutateAsync(url);
      setGeneratedRecipe(recipe);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.message || "Failed to extract recipe. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleSave = async () => {
    if (!generatedRecipe) return;

    try {
      await saveRecipe.mutateAsync(generatedRecipe);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUrl("");
      setGeneratedRecipe(null);
      navigation.navigate("CollectionTab");
    } catch (err: any) {
      setError(err.message || "Failed to save recipe");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleTryAnother = () => {
    setGeneratedRecipe(null);
    setUrl("");
    setError("");
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {generatedRecipe ? (
        <Animated.View entering={FadeIn.duration(300)}>
          <View style={styles.successHeader}>
            <View style={[styles.successIcon, { backgroundColor: theme.accent + "20" }]}>
              <Feather name="check" size={24} color={theme.accent} />
            </View>
            <ThemedText type="h3" style={styles.successTitle}>
              Recipe extracted!
            </ThemedText>
            <ThemedText type="body" style={[styles.successSubtitle, { color: theme.textSecondary }]}>
              Review the recipe below and save it to your collection
            </ThemedText>
          </View>

          <RecipePreviewCard recipe={generatedRecipe} />

          <View style={styles.buttonGroup}>
            <Button onPress={handleSave} loading={saveRecipe.isPending}>
              Save to Collection
            </Button>
            <Button variant="outline" onPress={handleTryAnother} style={styles.secondaryButton}>
              Try Another
            </Button>
          </View>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInUp.duration(400)}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + "15" }]}>
              <Feather name="instagram" size={32} color={theme.primary} />
            </View>
            <ThemedText type="h3" style={styles.title}>
              Add from Instagram
            </ThemedText>
            <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
              Paste a link to an Instagram post or reel and we'll transform it into a complete recipe
            </ThemedText>
          </View>

          <View style={styles.form}>
            <Input
              placeholder="https://instagram.com/p/..."
              value={url}
              onChangeText={(text) => {
                setUrl(text);
                if (error) setError("");
              }}
              error={error}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={handleGenerate}
            />

            <Button
              onPress={handleGenerate}
              loading={generateRecipe.isPending}
              disabled={!url.trim()}
              style={styles.generateButton}
            >
              {generateRecipe.isPending ? "Extracting Recipe..." : "Generate Recipe"}
            </Button>
          </View>

          {generateRecipe.isPending ? (
            <Animated.View entering={FadeIn.duration(300)} style={styles.loadingContainer}>
              <ThemedText type="small" style={[styles.loadingText, { color: theme.textSecondary }]}>
                Analyzing the post and extracting recipe details...
              </ThemedText>
            </Animated.View>
          ) : null}

          <View style={styles.tips}>
            <ThemedText type="small" style={[styles.tipsTitle, { color: theme.textSecondary }]}>
              Tips for best results:
            </ThemedText>
            <View style={styles.tipItem}>
              <Feather name="check-circle" size={14} color={theme.accent} />
              <ThemedText type="caption" style={[styles.tipText, { color: theme.textSecondary }]}>
                Posts with detailed captions work best
              </ThemedText>
            </View>
            <View style={styles.tipItem}>
              <Feather name="check-circle" size={14} color={theme.accent} />
              <ThemedText type="caption" style={[styles.tipText, { color: theme.textSecondary }]}>
                Recipe reels with step-by-step instructions
              </ThemedText>
            </View>
            <View style={styles.tipItem}>
              <Feather name="check-circle" size={14} color={theme.accent} />
              <ThemedText type="caption" style={[styles.tipText, { color: theme.textSecondary }]}>
                Food bloggers' posts with ingredient lists
              </ThemedText>
            </View>
          </View>
        </Animated.View>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  form: {
    marginBottom: Spacing["2xl"],
  },
  generateButton: {
    marginTop: Spacing.lg,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    textAlign: "center",
  },
  tips: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: "transparent",
  },
  tipsTitle: {
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  tipText: {
    marginLeft: Spacing.sm,
  },
  successHeader: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  successTitle: {
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    textAlign: "center",
  },
  buttonGroup: {
    marginTop: Spacing["2xl"],
    gap: Spacing.md,
  },
  secondaryButton: {
    marginTop: 0,
  },
});
