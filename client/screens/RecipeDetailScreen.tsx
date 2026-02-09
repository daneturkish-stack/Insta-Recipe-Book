import React, { useState, useCallback, useMemo } from "react";
import { StyleSheet, View, ScrollView, Pressable, Alert, Dimensions, Modal, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import Animated, { 
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";

import { useTheme } from "@/hooks/useTheme";
import { useRecipe, useDeleteRecipe, useUpdateRecipe } from "@/hooks/useRecipes";
import { apiRequest } from "@/lib/query-client";
import { Spacing, BorderRadius, Shadows, KitchColors, VibeTagColors } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const placeholderImage = require("../../assets/images/recipe-placeholder.png");

const PLATFORM_ICONS: Record<string, string> = {
  youtube: "youtube",
  instagram: "instagram",
  tiktok: "video",
  manual: "edit-2"
};

const PLATFORM_LOGO_URLS: Record<string, string> = {
  youtube: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/512px-YouTube_full-color_icon_%282017%29.svg.png",
  instagram: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png",
  tiktok: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/512px-TikTok_logo.svg.png",
};

export default function RecipeDetailScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { recipeId } = route.params;

  const recipe = useRecipe(recipeId);
  const deleteRecipe = useDeleteRecipe();
  const updateRecipe = useUpdateRecipe();

  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [showTranscript, setShowTranscript] = useState(false);
  const [showLinkCorrectionModal, setShowLinkCorrectionModal] = useState(false);
  const [manualLinkInput, setManualLinkInput] = useState("");
  const [isSearchingAgain, setIsSearchingAgain] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [servingMultiplier, setServingMultiplier] = useState(1);

  // Gesture Values
  const pinchScale = useSharedValue(1);
  const baseMultiplier = useSharedValue(1);
  const showScaleIndicator = useSharedValue(0);

  const updateServingMultiplier = useCallback((newMultiplier: number) => {
    const clampedMultiplier = Math.max(0.25, Math.min(4, newMultiplier));
    const roundedMultiplier = Math.round(clampedMultiplier * 4) / 4;
    if (roundedMultiplier !== servingMultiplier) {
      Haptics.selectionAsync();
      setServingMultiplier(roundedMultiplier);
    }
  }, [servingMultiplier]);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      baseMultiplier.value = servingMultiplier;
      showScaleIndicator.value = withTiming(1, { duration: 150 });
    })
    .onUpdate((event) => {
      pinchScale.value = event.scale;
      const newMultiplier = baseMultiplier.value * event.scale;
      runOnJS(updateServingMultiplier)(newMultiplier);
    })
    .onEnd(() => {
      pinchScale.value = withSpring(1, { damping: 15 });
      showScaleIndicator.value = withTiming(0, { duration: 300 });
    });

  const ingredientListStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pinchScale.value, [0.5, 1, 2], [0.98, 1, 1.02], Extrapolation.CLAMP) }],
  }));

  const scaleIngredientAmount = useCallback((amount: string | number | undefined): string => {
    if (!amount) return "";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return String(amount);
    const scaled = numAmount * servingMultiplier;
    return scaled === Math.floor(scaled) ? String(scaled) : scaled.toFixed(scaled < 10 ? 2 : 1).replace(/\.?0+$/, "");
  }, [servingMultiplier]);

  const scaledServings = useMemo(() => {
    if (!recipe?.servings) return null;
    const numServings = parseInt(String(recipe.servings));
    return isNaN(numServings) ? recipe.servings : Math.round(numServings * servingMultiplier);
  }, [recipe?.servings, servingMultiplier]);

  const toggleIngredient = (index: number) => {
    Haptics.selectionAsync();
    setCheckedIngredients((prev) => {
      const newSet = new Set(prev);
      prev.has(index) ? newSet.delete(index) : newSet.add(index);
      return newSet;
    });
  };

  const handleOpenLink = async (url: string | undefined) => {
    if (url) await WebBrowser.openBrowserAsync(url);
  };

  const handleDelete = () => {
    Alert.alert("Delete Recipe", "Are you sure you want to delete this recipe?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await deleteRecipe.mutateAsync(recipeId);
          navigation.goBack();
      }},
    ]);
  };

  if (!recipe) return null;

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const confidenceLevel = recipe.confidence || (recipe.isEstimated ? "medium" : "high");
  const confidenceColor = confidenceLevel === "high" ? "#059669" : confidenceLevel === "medium" ? "#E8A838" : "#DC2626";

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarHeight + 100 }}>

        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image 
            source={recipe.imageUrl ? { uri: recipe.imageUrl } : placeholderImage} 
            style={styles.heroImage} 
            contentFit="cover" 
          />
          {(recipe.platform === 'instagram' || recipe.platform === 'tiktok' || recipe.platform === 'youtube') && (
            <Pressable onPress={() => handleOpenLink(recipe.sourceUrl)} style={styles.playButton}>
              <View style={styles.playButtonInner}><Feather name="play" size={28} color="#FFF" /></View>
            </Pressable>
          )}
        </View>

        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(100)}>
            {/* Confidence Badge - Moved to top */}
            <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + "15" }]}>
              <Feather name="shield" size={12} color={confidenceColor} />
              <ThemedText style={[styles.confidenceText, { color: confidenceColor }]}>
                {confidenceLevel.toUpperCase()} ACCURACY
              </ThemedText>
            </View>

            <ThemedText type="h2" style={styles.title}>{recipe.title}</ThemedText>

            {/* Stats Bar */}
            <View style={[styles.statsBar, { backgroundColor: theme.backgroundDefault }, Shadows.cardLight]}>
              <View style={styles.statItem}>
                <Feather name="clock" size={18} color={theme.primary} />
                <ThemedText type="bodyMedium">{totalTime > 0 ? `${totalTime} min` : "—"}</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Feather name="list" size={18} color={KitchColors.accent} />
                <ThemedText type="bodyMedium">{recipe.instructions?.length || 0} steps</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Feather name="users" size={18} color={theme.textSecondary} />
                <ThemedText type="bodyMedium">{scaledServings || "—"}</ThemedText>
              </View>
            </View>
          </Animated.View>

          {/* Ingredients Section */}
          <GestureDetector gesture={pinchGesture}>
            <Animated.View style={[styles.section, ingredientListStyle]}>
              <View style={styles.sectionHeaderRow}>
                <ThemedText type="h4">Ingredients</ThemedText>
                <ThemedText type="caption" style={{ fontStyle: 'italic' }}>Pinch to scale</ThemedText>
              </View>
              <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
                {recipe.ingredients.map((ing, i) => (
                  <Pressable key={i} onPress={() => toggleIngredient(i)} style={[styles.row, i < recipe.ingredients.length - 1 && styles.borderBottom]}>
                    <View style={[styles.checkbox, { backgroundColor: checkedIngredients.has(i) ? theme.primary : 'transparent', borderColor: theme.border }]}>
                      {checkedIngredients.has(i) && <Feather name="check" size={12} color="#FFF" />}
                    </View>
                    <ThemedText style={[styles.ingredientText, checkedIngredients.has(i) && styles.checkedText]}>
                      <ThemedText style={{ fontWeight: '700' }}>{scaleIngredientAmount(ing.amount)} {ing.unit}</ThemedText> {ing.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          </GestureDetector>

          {/* Instructions */}
          <View style={styles.section}>
            <ThemedText type="h4" style={{ marginBottom: 16 }}>Instructions</ThemedText>
            {recipe.instructions.map((step, i) => (
              <View key={i} style={styles.instructionRow}>
                <View style={[styles.stepCircle, { backgroundColor: theme.primary }]}>
                  <ThemedText style={styles.stepCircleText}>{i + 1}</ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.instructionText}>{typeof step === "string" ? step : step.text}</ThemedText>
                  {recipe.isEstimatedInstructions && (
                    <View style={styles.aiBadge}><Feather name="cpu" size={10} color={theme.textSecondary} /><ThemedText type="caption" style={{ marginLeft: 4 }}>AI-Enhanced</ThemedText></View>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Tidy Utility Bar */}
          <View style={styles.utilityBar}>
            <Pressable onPress={() => handleOpenLink(recipe.sourceUrl)} style={styles.utilityItem}>
              <Feather name="external-link" size={20} color={theme.textSecondary} />
              <ThemedText type="caption">Original</ThemedText>
            </Pressable>
            <Pressable onPress={() => handleOpenLink(recipe.creatorRecipeUrl)} style={[styles.utilityItem, !recipe.creatorRecipeUrl && { opacity: 0.3 }]} disabled={!recipe.creatorRecipeUrl}>
              <Feather name="book-open" size={20} color={theme.textSecondary} />
              <ThemedText type="caption">Recipe</ThemedText>
            </Pressable>
            <Pressable onPress={() => setShowLinkCorrectionModal(true)} style={styles.utilityItem}>
              <Feather name="alert-circle" size={20} color={theme.textSecondary} />
              <ThemedText type="caption">Report</ThemedText>
            </Pressable>
            <Pressable onPress={handleDelete} style={styles.utilityItem}>
              <Feather name="trash-2" size={20} color="#DC2626" />
              <ThemedText type="caption" style={{ color: "#DC2626" }}>Delete</ThemedText>
            </Pressable>
          </View>

          {/* Refined Creator Card */}
          <View style={[styles.creatorCard, { backgroundColor: (theme as any).surface || theme.backgroundDefault }]}>
            <View style={styles.creatorInfoRow}>
              <Image 
                source={
                  recipe.creatorAvatar 
                    ? { uri: recipe.creatorAvatar } 
                    : PLATFORM_LOGO_URLS[recipe.platform || '']
                      ? { uri: PLATFORM_LOGO_URLS[recipe.platform || ''] }
                      : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(recipe.creatorHandle || 'K')}&background=0D9488&color=fff&size=96` }
                } 
                style={styles.creatorAvatar} 
                contentFit={recipe.creatorAvatar ? "cover" : "contain"}
              />
              <View style={styles.creatorTextContent}>
                <View style={styles.creatorTitleRow}>
                  <ThemedText style={styles.creatorName}>{recipe.creatorName || recipe.creatorHandle || "Creator"}</ThemedText>
                  <View style={styles.platformBadge}>
                    <Feather name={PLATFORM_ICONS[recipe.platform || 'manual'] as any} size={10} color={theme.textSecondary} />
                    <ThemedText style={styles.platformText}>{recipe.platform}</ThemedText>
                  </View>
                </View>
                {(() => {
                  const name = (recipe.creatorName || '').replace(/^@/, '').toLowerCase();
                  const handle = (recipe.creatorHandle || '').replace(/^@/, '').toLowerCase();
                  const isDuplicate = name && handle && name === handle;
                  return !isDuplicate && recipe.creatorHandle ? (
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>@{recipe.creatorHandle.replace(/^@/, '')}</ThemedText>
                  ) : null;
                })()}
              </View>
            </View>
            <Button variant="outline" size="small" onPress={() => handleOpenLink(recipe.sourceUrl)} style={{ marginTop: 8 }}>
              Support on {recipe.platform || "their channel"}
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={[styles.footer, { bottom: tabBarHeight, paddingBottom: Spacing.md, paddingTop: Spacing.md, backgroundColor: theme.backgroundRoot }]}>
        <Button onPress={() => navigation.navigate("CookMode", { recipeId })} style={styles.cookButton}>
          <Feather name="play-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
          Start Cooking
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' // Soft canvas background
  },
  heroContainer: { 
    height: 360, // Slightly taller for a more dramatic hero feel
    width: '100%', 
    position: 'relative' 
  },
  heroImage: { 
    width: '100%', 
    height: '100%', 
    borderBottomLeftRadius: 32, 
    borderBottomRightRadius: 32 
  },
  playButton: { 
    position: 'absolute', 
    top: '50%', 
    left: '50%', 
    transform: [{ translateX: -32 }, { translateY: -32 }] 
  },
  playButtonInner: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: 'rgba(255,255,255,0.3)', // Frosted glass effect
    alignItems: 'center', 
    justifyContent: 'center',
    backdropFilter: 'blur(10px)'
  },
  content: { 
    padding: Spacing.xl, 
    paddingTop: 32 
  },
  confidenceBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 9999, // Pill shape
    marginBottom: 16 
  },
  confidenceText: { 
    fontSize: 10, 
    fontWeight: '800', 
    marginLeft: 4, 
    letterSpacing: 1 // Editorial spacing
  },
  title: { 
    marginBottom: 24,
    lineHeight: 38 // Increased for better readability
  },
  // Floating Stats Bar
  statsBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 40,
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4
  },
  statItem: { 
    alignItems: 'center', 
    gap: 6 
  },
  statDivider: { 
    width: 1, 
    height: 32, 
    backgroundColor: '#F3F4F6' 
  },
  section: { 
    marginBottom: 40 
  },
  sectionHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  card: { 
    borderRadius: 24, // Consistent card radius
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 18 
  },
  borderBottom: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  checkbox: { 
    width: 22, 
    height: 22, 
    borderRadius: 8, 
    borderWidth: 1.5, 
    marginRight: 14, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  ingredientText: { 
    flex: 1, 
    fontSize: 16,
    color: '#1F2937' 
  },
  checkedText: { 
    textDecorationLine: 'line-through', 
    opacity: 0.3 
  },
  instructionRow: { 
    flexDirection: 'row', 
    marginBottom: 28 
  },
  stepCircle: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 16, 
    marginTop: 0 
  },
  stepCircleText: { 
    color: '#FFF', 
    fontWeight: '700', 
    fontSize: 14 
  },
  instructionText: { 
    flex: 1, 
    fontSize: 16, 
    lineHeight: 26, // Airy, readable steps
    color: '#374151'
  },
  utilityBar: { 
    flexDirection: '