import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, Alert, Dimensions, Modal, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { RemyChat, RemyFloatingButton } from "@/components/RemyChat";
import { useTheme } from "@/hooks/useTheme";
import { useRecipe, useDeleteRecipe, useUpdateRecipe } from "@/hooks/useRecipes";
import { apiRequest } from "@/lib/query-client";
import { Spacing, BorderRadius, Shadows, KitchColors } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const placeholderImage = require("../../assets/images/recipe-placeholder.png");

const INGREDIENT_ICONS: Record<string, string> = {
  tomato: "sun",
  chicken: "feather",
  beef: "square",
  fish: "anchor",
  salt: "droplet",
  pepper: "wind",
  oil: "droplet",
  onion: "circle",
  garlic: "circle",
  egg: "circle",
  butter: "square",
  milk: "coffee",
  cheese: "square",
  pasta: "minus",
  rice: "more-horizontal",
  potato: "circle",
  carrot: "minus",
  default: "circle",
};

function getIngredientIcon(name: string): keyof typeof Feather.glyphMap {
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(INGREDIENT_ICONS)) {
    if (lowerName.includes(key)) {
      return icon as keyof typeof Feather.glyphMap;
    }
  }
  return "circle";
}

export default function RecipeDetailScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { recipeId } = route.params;

  const recipe = useRecipe(recipeId);
  const deleteRecipe = useDeleteRecipe();
  const updateRecipe = useUpdateRecipe();

  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [showTranscript, setShowTranscript] = useState(false);
  const [showRemyChat, setShowRemyChat] = useState(false);
  const [confidenceExpanded, setConfidenceExpanded] = useState(false);
  const [showLinkCorrectionModal, setShowLinkCorrectionModal] = useState(false);
  const [manualLinkInput, setManualLinkInput] = useState("");
  const [isSearchingAgain, setIsSearchingAgain] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  const toggleIngredient = (index: number) => {
    Haptics.selectionAsync();
    setCheckedIngredients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleOpenSource = async () => {
    if (recipe?.sourceUrl) {
      await WebBrowser.openBrowserAsync(recipe.sourceUrl);
    }
  };

  const handleSearchFullRecipe = async () => {
    if (recipe) {
      Haptics.selectionAsync();
      const searchQuery = recipe.manualSearchQuery 
        ? encodeURIComponent(recipe.manualSearchQuery)
        : encodeURIComponent(`${recipe.creatorHandle || ''} ${recipe.title} recipe`);
      await WebBrowser.openBrowserAsync(`https://www.google.com/search?q=${searchQuery}`);
    }
  };

  const handleWrongLink = () => {
    Haptics.selectionAsync();
    setShowLinkCorrectionModal(true);
    setShowManualInput(false);
    setManualLinkInput("");
  };

  const handleSearchAgain = async () => {
    if (!recipe) return;
    setIsSearchingAgain(true);
    try {
      const response = await apiRequest("POST", "/api/recipes/search-recipe-url", {
        recipeTitle: recipe.title,
        creatorHandle: recipe.creatorHandle,
      });
      const data = await response.json();
      
      if (data.creatorRecipeUrl) {
        await updateRecipe.mutateAsync({
          id: recipe.id,
          creatorRecipeUrl: data.creatorRecipeUrl,
          recipeSource: data.recipeSource,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Found it!", "I found a recipe link and updated it.");
      } else {
        Alert.alert("No luck", "I couldn't find a different recipe link. Try adding it manually.");
        setShowManualInput(true);
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong while searching. Try adding the link manually.");
      setShowManualInput(true);
    } finally {
      setIsSearchingAgain(false);
    }
  };

  const handleSaveManualLink = async () => {
    if (!recipe || !manualLinkInput.trim()) return;
    
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(manualLinkInput.trim())) {
      Alert.alert("Invalid URL", "Please enter a valid URL starting with http:// or https://");
      return;
    }
    
    await updateRecipe.mutateAsync({
      id: recipe.id,
      creatorRecipeUrl: manualLinkInput.trim(),
      recipeSource: {
        type: "creator_website",
        name: "User-provided link",
        url: manualLinkInput.trim(),
        isVerified: false,
        verificationMethod: "user_manual",
      },
    });
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowLinkCorrectionModal(false);
    setManualLinkInput("");
  };

  const closeLinkCorrectionModal = () => {
    setShowLinkCorrectionModal(false);
    setShowManualInput(false);
    setManualLinkInput("");
  };

  const handleOpenCreatorRecipe = async () => {
    if (recipe?.creatorRecipeUrl) {
      Haptics.selectionAsync();
      await WebBrowser.openBrowserAsync(recipe.creatorRecipeUrl);
    }
  };

  const toggleTranscript = () => {
    Haptics.selectionAsync();
    setShowTranscript(!showTranscript);
  };

  const handleStartCookMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("CookMode", { recipeId });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Recipe",
      "Are you sure you want to delete this recipe from your collection?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteRecipe.mutateAsync(recipeId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!recipe) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText>Recipe not found</ThemedText>
      </View>
    );
  }

  const isVideo = recipe.platform === "instagram" || recipe.platform === "tiktok";
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const stepsCount = recipe.instructions?.length || 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Section - Large rounded corners */}
        <View style={styles.heroContainer}>
          <Image
            source={recipe.imageUrl ? { uri: recipe.imageUrl } : placeholderImage}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
          />
          {isVideo ? (
            <Pressable onPress={handleOpenSource} style={styles.playButton}>
              <View style={styles.playButtonInner}>
                <Feather name="play" size={28} color="#FFF" style={{ marginLeft: 3 }} />
              </View>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            {/* Recipe Title */}
            <ThemedText type="h2" style={styles.title}>
              {recipe.title}
            </ThemedText>

            {/* Creator Row */}
            {recipe.creatorHandle ? (
              <Pressable onPress={handleOpenSource} style={styles.creatorRow}>
                {recipe.creatorAvatar ? (
                  <Image
                    source={{ uri: recipe.creatorAvatar }}
                    style={styles.creatorAvatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.creatorAvatar, { backgroundColor: theme.primary }]}>
                    <Feather name="user" size={14} color="#FFF" />
                  </View>
                )}
                <ThemedText type="bodyMedium" style={{ color: theme.textSecondary }}>
                  {recipe.creatorHandle}
                </ThemedText>
                {recipe.platform ? (
                  <View style={[styles.platformBadge, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather 
                      name={recipe.platform === "instagram" ? "instagram" : "video"} 
                      size={12} 
                      color={theme.textSecondary} 
                    />
                  </View>
                ) : null}
              </Pressable>
            ) : null}

            {/* Horizontal Stats Bar - Premium Light Design */}
            <View style={[styles.statsBar, { backgroundColor: theme.backgroundDefault }, Shadows.cardLight]}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: theme.primary + "15" }]}>
                  <Feather name="clock" size={18} color={theme.primary} />
                </View>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Time</ThemedText>
                <ThemedText type="bodyMedium">{totalTime > 0 ? `${totalTime} min` : "N/A"}</ThemedText>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: theme.accent + "20" }]}>
                  <Feather name="list" size={18} color={KitchColors.accent} />
                </View>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Steps</ThemedText>
                <ThemedText type="bodyMedium">{stepsCount}</ThemedText>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: "#F3E8FF" }]}>
                  <Feather name="award" size={18} color="#9333EA" />
                </View>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Difficulty</ThemedText>
                <ThemedText type="bodyMedium">
                  {stepsCount <= 5 ? "Easy" : stepsCount <= 10 ? "Medium" : "Hard"}
                </ThemedText>
              </View>
            </View>

            {/* Tags */}
            {(recipe.dishType || (recipe.vibeTags && recipe.vibeTags.length > 0)) ? (
              <View style={styles.tagsRow}>
                {recipe.dishType ? (
                  <View style={[styles.tag, { backgroundColor: theme.primary + "15" }]}>
                    <ThemedText type="caption" style={{ color: theme.primary, fontWeight: "600" }}>
                      {recipe.dishType}
                    </ThemedText>
                  </View>
                ) : null}
                {recipe.vibeTags?.map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: theme.accent + "20" }]}>
                    <ThemedText type="caption" style={{ color: "#92400E", fontWeight: "500" }}>
                      {tag}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : null}

            {recipe.description ? (
              <ThemedText type="body" style={[styles.description, { color: theme.textSecondary }]}>
                {recipe.description}
              </ThemedText>
            ) : null}
          </Animated.View>

          {/* Visual Ingredient Cards */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.section}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Ingredients
              </ThemedText>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ingredientCardsContainer}
              >
                {recipe.ingredients.slice(0, 8).map((ingredient, index) => (
                  <Pressable
                    key={index}
                    onPress={() => toggleIngredient(index)}
                    style={[
                      styles.ingredientCard,
                      { backgroundColor: theme.backgroundDefault },
                      checkedIngredients.has(index) && { backgroundColor: theme.primary + "10" },
                      Shadows.cardLight,
                    ]}
                  >
                    <View style={[
                      styles.ingredientIconWrapper,
                      { backgroundColor: checkedIngredients.has(index) ? theme.primary + "20" : theme.backgroundSecondary }
                    ]}>
                      <Feather 
                        name={getIngredientIcon(ingredient.name)} 
                        size={24} 
                        color={checkedIngredients.has(index) ? theme.primary : theme.textSecondary} 
                      />
                    </View>
                    <ThemedText 
                      type="caption" 
                      style={[
                        styles.ingredientCardName,
                        checkedIngredients.has(index) && { textDecorationLine: "line-through", opacity: 0.5 }
                      ]}
                      numberOfLines={2}
                    >
                      {ingredient.name}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: "500" }}>
                      {ingredient.amount} {ingredient.unit}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
              
              {/* Full ingredients list */}
              <View style={[styles.ingredientsList, { backgroundColor: theme.backgroundDefault }, Shadows.cardLight]}>
                {recipe.ingredients.map((ingredient, index) => (
                  <Pressable
                    key={index}
                    onPress={() => toggleIngredient(index)}
                    style={[
                      styles.ingredientItem,
                      index < recipe.ingredients.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                    ]}
                  >
                    <View style={[
                      styles.checkbox,
                      {
                        borderColor: checkedIngredients.has(index) ? theme.primary : theme.border,
                        backgroundColor: checkedIngredients.has(index) ? theme.primary : "transparent",
                      },
                    ]}>
                      {checkedIngredients.has(index) ? (
                        <Feather name="check" size={12} color="#FFF" />
                      ) : null}
                    </View>
                    <ThemedText
                      type="body"
                      style={[
                        styles.ingredientText,
                        checkedIngredients.has(index) && { textDecorationLine: "line-through", opacity: 0.5 },
                      ]}
                    >
                      <ThemedText style={{ fontWeight: "600" }}>
                        {ingredient.amount} {ingredient.unit}
                      </ThemedText>
                      {"  "}{ingredient.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Instructions */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View style={styles.section}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Instructions
              </ThemedText>
              {recipe.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
                    <ThemedText type="bodyMedium" style={styles.stepNumberText}>
                      {index + 1}
                    </ThemedText>
                  </View>
                  <ThemedText type="body" style={styles.instructionText}>
                    {instruction}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Original Post Transcript */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            {recipe.originalTranscript ? (
              <View style={styles.section}>
                <Pressable onPress={toggleTranscript} style={styles.transcriptHeader}>
                  <View style={styles.transcriptTitleRow}>
                    <Feather name="file-text" size={18} color={theme.primary} />
                    <ThemedText type="bodyMedium" style={{ marginLeft: Spacing.sm }}>
                      View Original Post Text
                    </ThemedText>
                  </View>
                  <Feather 
                    name={showTranscript ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.textSecondary} 
                  />
                </Pressable>
                {showTranscript ? (
                  <View style={[styles.transcriptContent, { backgroundColor: theme.backgroundDefault }]}>
                    <ThemedText type="small" style={{ color: theme.textSecondary, lineHeight: 22 }}>
                      {recipe.originalTranscript}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              {/* View Original Button */}
              <Pressable
                onPress={handleOpenSource}
                style={styles.iconButton}
                testID="button-view-original"
              >
                <View style={[styles.iconCircle, styles.iconCircleShadow, { backgroundColor: theme.backgroundDefault, borderWidth: 1, borderColor: theme.border }]}>
                  <Feather name={recipe.platform === "tiktok" ? "video" : "instagram"} size={20} color={theme.text} />
                </View>
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                  Original
                </ThemedText>
              </Pressable>

              {/* View Full Recipe Button */}
              {recipe.creatorRecipeUrl ? (
                <Pressable
                  onPress={handleOpenCreatorRecipe}
                  style={styles.iconButton}
                  testID="button-creator-recipe"
                >
                  <View style={[styles.iconCircle, styles.iconCircleShadow, { backgroundColor: theme.backgroundDefault, borderWidth: 1, borderColor: theme.border }]}>
                    <Feather name="book-open" size={20} color={theme.text} />
                  </View>
                  <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                    Recipe
                  </ThemedText>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleSearchFullRecipe}
                  style={styles.iconButton}
                  testID="button-search-recipe"
                >
                  <View style={[styles.iconCircle, styles.iconCircleShadow, { backgroundColor: theme.backgroundDefault, borderWidth: 1, borderColor: theme.border }]}>
                    <Feather name="search" size={20} color={theme.text} />
                  </View>
                  <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                    Find
                  </ThemedText>
                </Pressable>
              )}

              {/* Report Wrong Link Button */}
              <Pressable
                onPress={handleWrongLink}
                style={styles.iconButton}
                testID="button-wrong-link"
              >
                <View style={[styles.iconCircle, styles.iconCircleShadow, { backgroundColor: theme.backgroundDefault, borderWidth: 1, borderColor: theme.border }]}>
                  <Feather name="alert-circle" size={20} color={theme.text} />
                </View>
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                  Report
                </ThemedText>
              </Pressable>

              {/* Delete Button */}
              <Pressable
                onPress={handleDelete}
                style={styles.iconButton}
                testID="button-delete-recipe"
              >
                <View style={[styles.iconCircle, styles.iconCircleShadow, { backgroundColor: theme.backgroundDefault, borderWidth: 1, borderColor: theme.border }]}>
                  <Feather name="trash-2" size={20} color={theme.textSecondary} />
                </View>
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                  Delete
                </ThemedText>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Floating Cook Mode Button - Emerald Green */}
      <View 
        style={[
          styles.floatingButtonContainer, 
          { bottom: tabBarHeight + Spacing.lg }
        ]}
      >
        <Pressable
          onPress={handleStartCookMode}
          style={[styles.cookModeButton, { backgroundColor: theme.primary }, Shadows.button]}
          testID="button-start-cooking"
        >
          <Feather name="play-circle" size={22} color="#FFF" />
          <ThemedText type="bodyMedium" style={styles.cookModeButtonText}>
            Start Cooking
          </ThemedText>
        </Pressable>
      </View>

      <RemyFloatingButton 
        onPress={() => setShowRemyChat(true)} 
        testID="remy-floating-button"
      />
      
      <RemyChat
        visible={showRemyChat}
        onClose={() => setShowRemyChat(false)}
        currentRecipe={recipe}
      />

      {/* Link Correction Modal */}
      <Modal
        visible={showLinkCorrectionModal}
        transparent
        animationType="fade"
        onRequestClose={closeLinkCorrectionModal}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={closeLinkCorrectionModal}
        >
          <Pressable 
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }, Shadows.floating]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h4" style={{ flex: 1 }}>Fix Recipe Link</ThemedText>
              <Pressable onPress={closeLinkCorrectionModal}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {!showManualInput ? (
              <View style={styles.modalOptions}>
                <Pressable
                  onPress={handleSearchAgain}
                  style={[styles.modalOptionButton, { backgroundColor: theme.primary }]}
                  disabled={isSearchingAgain}
                >
                  {isSearchingAgain ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Feather name="search" size={18} color="#FFF" />
                      <ThemedText type="bodyMedium" style={{ marginLeft: Spacing.sm, color: "#FFF" }}>
                        Search Again with AI
                      </ThemedText>
                    </>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => setShowManualInput(true)}
                  style={[styles.modalOptionButton, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <Feather name="edit-3" size={18} color={theme.text} />
                  <ThemedText type="bodyMedium" style={{ marginLeft: Spacing.sm }}>
                    Add Link Manually
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              <View style={styles.manualInputSection}>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                  Paste the correct recipe URL:
                </ThemedText>
                <TextInput
                  value={manualLinkInput}
                  onChangeText={setManualLinkInput}
                  placeholder="https://example.com/recipe"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.linkInput, { 
                    backgroundColor: theme.backgroundSecondary, 
                    color: theme.text 
                  }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <View style={styles.manualInputButtons}>
                  <Pressable
                    onPress={() => setShowManualInput(false)}
                    style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <ThemedText type="bodyMedium">Back</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveManualLink}
                    style={[styles.saveButton, { backgroundColor: theme.primary }]}
                    disabled={!manualLinkInput.trim()}
                  >
                    <ThemedText type="bodyMedium" style={{ color: "#FFF" }}>
                      Save Link
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    width: "100%",
    height: 320,
    position: "relative",
    marginBottom: -Spacing["3xl"],
  },
  heroImage: {
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: BorderRadius.card,
    borderBottomRightRadius: BorderRadius.card,
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -30,
    marginLeft: -30,
  },
  playButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing["4xl"],
  },
  title: {
    marginBottom: Spacing.md,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  creatorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  creatorAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
  },
  platformBadge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: Spacing.lg,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.xl,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.xs,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: "#E5E7EB",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  description: {
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  section: {
    marginBottom: Spacing["3xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  ingredientCardsContainer: {
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  ingredientCard: {
    width: 100,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginRight: Spacing.sm,
  },
  ingredientIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  ingredientCardName: {
    textAlign: "center",
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  ingredientsList: {
    borderRadius: BorderRadius.card,
    overflow: "hidden",
    marginTop: Spacing.lg,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  ingredientText: {
    flex: 1,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  instructionText: {
    flex: 1,
    lineHeight: 28,
  },
  floatingButtonContainer: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing["5xl"],
    zIndex: 100,
  },
  cookModeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: BorderRadius.full,
  },
  cookModeButtonText: {
    color: "#FFF",
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  transcriptHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  transcriptTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  transcriptContent: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  noRecipeLinkContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  noRecipeLinkHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  manualSearchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minWidth: 70,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalOptions: {
    gap: Spacing.md,
  },
  modalOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  manualInputSection: {
    marginTop: Spacing.sm,
  },
  linkInput: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  manualInputButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  saveButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
  },
});
