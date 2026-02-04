import React, { useState, useEffect } from "react";
import { StyleSheet, View, Keyboard, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute } from "@react-navigation/native";
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

type Platform = "instagram" | "tiktok" | null;

export default function AddRecipeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);

  const generateRecipe = useGenerateRecipe();
  const saveRecipe = useSaveRecipe();

  useEffect(() => {
    if (route.params?.sharedUrl) {
      setUrl(route.params.sharedUrl);
      if (isValidInstagramUrl(route.params.sharedUrl)) {
        setSelectedPlatform("instagram");
      } else if (isValidTikTokUrl(route.params.sharedUrl)) {
        setSelectedPlatform("tiktok");
      }
    }
  }, [route.params?.sharedUrl]);

  const isValidInstagramUrl = (url: string) => {
    const pattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels)\/[\w-]+/i;
    return pattern.test(url);
  };

  const isValidTikTokUrl = (url: string) => {
    const pattern = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\//i;
    return pattern.test(url);
  };

  const isValidUrl = (url: string) => {
    return isValidInstagramUrl(url) || isValidTikTokUrl(url);
  };

  const getPlatformFromUrl = (url: string): Platform => {
    if (isValidInstagramUrl(url)) return "instagram";
    if (isValidTikTokUrl(url)) return "tiktok";
    return null;
  };

  const handleGenerate = async () => {
    Keyboard.dismiss();
    setError("");
    setGeneratedRecipe(null);

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidUrl(url)) {
      setError("Please enter a valid Instagram or TikTok URL");
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
      setSelectedPlatform(null);
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
    setSelectedPlatform(null);
  };

  const handleUrlChange = (text: string) => {
    setUrl(text);
    if (error) setError("");
    
    const platform = getPlatformFromUrl(text);
    if (platform) {
      setSelectedPlatform(platform);
    }
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
            <View style={styles.platformToggle}>
              <Pressable
                style={[
                  styles.platformButton,
                  {
                    backgroundColor: selectedPlatform === "instagram" ? theme.primary : theme.backgroundDefault,
                  },
                ]}
                onPress={() => setSelectedPlatform("instagram")}
              >
                <Feather
                  name="instagram"
                  size={24}
                  color={selectedPlatform === "instagram" ? "#FFF" : theme.text}
                />
                <ThemedText
                  type="small"
                  style={{
                    color: selectedPlatform === "instagram" ? "#FFF" : theme.text,
                    marginTop: 4,
                    fontWeight: "600",
                  }}
                >
                  Instagram
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.platformButton,
                  {
                    backgroundColor: selectedPlatform === "tiktok" ? theme.primary : theme.backgroundDefault,
                  },
                ]}
                onPress={() => setSelectedPlatform("tiktok")}
              >
                <Feather
                  name="video"
                  size={24}
                  color={selectedPlatform === "tiktok" ? "#FFF" : theme.text}
                />
                <ThemedText
                  type="small"
                  style={{
                    color: selectedPlatform === "tiktok" ? "#FFF" : theme.text,
                    marginTop: 4,
                    fontWeight: "600",
                  }}
                >
                  TikTok
                </ThemedText>
              </Pressable>
            </View>

            <ThemedText type="h3" style={styles.title}>
              Add Recipe
            </ThemedText>
            <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
              Paste a link from Instagram or TikTok and we'll transform it into a complete recipe
            </ThemedText>
          </View>

          <View style={styles.form}>
            <Input
              placeholder={selectedPlatform === "tiktok" 
                ? "https://tiktok.com/@user/video/..." 
                : "https://instagram.com/p/..."
              }
              value={url}
              onChangeText={handleUrlChange}
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

          <View style={[styles.shareTip, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="share" size={20} color={theme.primary} />
            <View style={styles.shareTipContent}>
              <ThemedText type="small" style={{ fontWeight: "600" }}>
                Quick tip
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 2 }}>
                Share directly from Instagram or TikTok to Kitch for faster recipe saving
              </ThemedText>
            </View>
          </View>

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
                Food creators' posts with ingredient lists
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
  platformToggle: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  platformButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    minWidth: 100,
  },
  title: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
    lineHeight: 22,
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
  shareTip: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  shareTipContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  tips: {
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
    marginBottom: Spacing.md,
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
