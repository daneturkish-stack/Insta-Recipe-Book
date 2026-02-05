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
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const placeholderImage = require("../../assets/images/recipe-placeholder.png");


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
      // Use the pre-built manual search query if available, otherwise construct one
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
    
    // Basic URL validation
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

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image with Video Indicator */}
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
            {/* Creator & Tags */}
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
                <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
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

            <ThemedText type="h2" style={styles.title}>
              {recipe.title}
            </ThemedText>

            {/* Tags */}
            {(recipe.dishType || (recipe.vibeTags && recipe.vibeTags.length > 0)) ? (
              <View style={styles.tagsRow}>
                {recipe.dishType ? (
                  <View style={[styles.tag, { backgroundColor: theme.primary + "25" }]}>
                    <ThemedText type="caption" style={{ color: theme.text, fontWeight: "600" }}>
                      {recipe.dishType}
                    </ThemedText>
                  </View>
                ) : null}
                {recipe.vibeTags?.map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {tag}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Confidence & Source Attribution Badge - Collapsible */}
            {recipe.confidence ? (
              <View style={[
                styles.confidenceBadge, 
                { 
                  backgroundColor: recipe.confidence === 'high' ? '#E8F5E9' : recipe.confidence === 'medium' ? theme.primary + "15" : theme.error + "15",
                  borderColor: recipe.confidence === 'high' ? '#4CAF50' + "40" : recipe.confidence === 'medium' ? theme.primary + "40" : theme.error + "40",
                }
              ]}>
                <Pressable 
                  style={styles.confidenceHeader} 
                  onPress={() => setConfidenceExpanded(!confidenceExpanded)}
                >
                  <View style={[
                    styles.confidenceIndicator, 
                    { backgroundColor: recipe.confidence === 'high' ? '#4CAF50' : recipe.confidence === 'medium' ? theme.primary : theme.error }
                  ]} />
                  <ThemedText type="caption" style={{ 
                    fontWeight: "600", 
                    color: recipe.confidence === 'high' ? '#2E7D32' : recipe.confidence === 'medium' ? theme.text : theme.error, 
                    flex: 1 
                  }}>
                    {recipe.confidence === 'high' ? 'High Accuracy' : recipe.confidence === 'medium' ? 'Medium Accuracy' : 'Low Accuracy'}
                  </ThemedText>
                  {recipe.recipeSource?.isVerified ? (
                    <View style={[styles.verifiedBadge, { backgroundColor: '#E8F5E9' }]}>
                      <Feather name="check-circle" size={10} color="#2E7D32" />
                      <ThemedText type="caption" style={{ color: '#2E7D32', fontSize: 10, marginLeft: 2, fontWeight: "600" }}>
                        Verified
                      </ThemedText>
                    </View>
                  ) : null}
                  <Feather 
                    name={confidenceExpanded ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={theme.textSecondary} 
                    style={{ marginLeft: Spacing.sm }}
                  />
                </Pressable>
                
                {confidenceExpanded && recipe.recipeSource?.name ? (
                  <Pressable 
                    style={styles.sourceRow}
                    onPress={recipe.creatorRecipeUrl ? handleOpenCreatorRecipe : undefined}
                  >
                    <Feather 
                      name={recipe.recipeSource.isVerified ? "external-link" : "alert-circle"} 
                      size={12} 
                      color={recipe.creatorRecipeUrl ? theme.primary : theme.textSecondary} 
                    />
                    <ThemedText type="caption" style={{ 
                      color: recipe.creatorRecipeUrl ? theme.primary : theme.textSecondary, 
                      marginLeft: 4, 
                      flex: 1,
                      textDecorationLine: recipe.creatorRecipeUrl ? 'underline' : 'none'
                    }}>
                      {recipe.recipeSource.note || `View full recipe on ${recipe.recipeSource.name}`}
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {recipe.description ? (
              <ThemedText type="body" style={[styles.description, { color: theme.textSecondary }]}>
                {recipe.description}
              </ThemedText>
            ) : null}

            {/* Meta Cards */}
            <View style={styles.metaRow}>
              {recipe.prepTime ? (
                <View style={[styles.metaCard, { backgroundColor: theme.backgroundDefault }]}>
                  <Feather name="clock" size={18} color={theme.primary} />
                  <ThemedText type="caption" style={[styles.metaLabel, { color: theme.textSecondary }]}>Prep</ThemedText>
                  <ThemedText type="bodyMedium">{recipe.prepTime} min</ThemedText>
                </View>
              ) : null}
              {recipe.cookTime ? (
                <View style={[styles.metaCard, { backgroundColor: theme.backgroundDefault }]}>
                  <Feather name="thermometer" size={18} color={theme.primary} />
                  <ThemedText type="caption" style={[styles.metaLabel, { color: theme.textSecondary }]}>Cook</ThemedText>
                  <ThemedText type="bodyMedium">{recipe.cookTime} min</ThemedText>
                </View>
              ) : null}
              {recipe.servings ? (
                <View style={[styles.metaCard, { backgroundColor: theme.backgroundDefault }]}>
                  <Feather name="users" size={18} color={theme.primary} />
                  <ThemedText type="caption" style={[styles.metaLabel, { color: theme.textSecondary }]}>Servings</ThemedText>
                  <ThemedText type="bodyMedium">{recipe.servings}</ThemedText>
                </View>
              ) : null}
            </View>

            {/* Transparency Banner */}
            {recipe.isEstimated ? (
              <View style={[styles.transparencyBanner, { backgroundColor: '#FFF3E0', borderColor: '#FF9800' + "40" }]}>
                <Feather name="info" size={16} color="#E65100" />
                <ThemedText type="caption" style={[styles.transparencyText, { color: theme.textSecondary }]}>
                  Some details were estimated by AI based on the post. Tap below to verify.
                </ThemedText>
              </View>
            ) : null}
          </Animated.View>

          {/* Ingredients */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.section}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Ingredients
              </ThemedText>
              <View style={[styles.ingredientsList, { backgroundColor: theme.backgroundDefault }]}>
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
                        borderColor: checkedIngredients.has(index) ? theme.accent : theme.border,
                        backgroundColor: checkedIngredients.has(index) ? theme.accent : "transparent",
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

          {/* Verification Section */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            {/* Original Post Transcript */}
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

            {/* Creator's Full Recipe Link or Search */}
            {recipe.creatorRecipeUrl ? (
              <View>
                <Pressable
                  onPress={handleOpenCreatorRecipe}
                  style={[styles.creatorRecipeButton, { backgroundColor: theme.primary + "15", borderColor: theme.primary + "30" }]}
                  testID="button-creator-recipe"
                >
                  <View style={styles.sourceContent}>
                    <Feather name="book-open" size={18} color={theme.primary} />
                    <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                      <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                        View Full Recipe
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                        {recipe.creatorRecipeUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                      </ThemedText>
                    </View>
                  </View>
                  <Feather name="external-link" size={16} color={theme.primary} />
                </Pressable>
                <Pressable
                  onPress={handleWrongLink}
                  style={styles.wrongLinkButton}
                  testID="button-wrong-link"
                >
                  <Feather name="alert-circle" size={14} color={theme.textSecondary} />
                  <ThemedText type="caption" style={{ marginLeft: Spacing.xs, color: theme.textSecondary }}>
                    Wrong link?
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              <View style={[styles.noRecipeLinkContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                <View style={styles.noRecipeLinkHeader}>
                  <Feather name="info" size={16} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ marginLeft: Spacing.sm, color: theme.textSecondary, flex: 1 }}>
                    I couldn't find this exact recipe online yet. It may not be published.
                  </ThemedText>
                </View>
                <Pressable
                  onPress={handleSearchFullRecipe}
                  style={[styles.manualSearchButton, { backgroundColor: theme.primary }]}
                  testID="button-search-recipe"
                >
                  <Feather name="search" size={16} color="#FFF" />
                  <ThemedText type="small" style={{ marginLeft: Spacing.sm, color: "#FFF", fontWeight: "600" }}>
                    Search for Recipe
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </Animated.View>

          {/* Source & Delete */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <Pressable
              onPress={handleOpenSource}
              style={[styles.sourceButton, { backgroundColor: theme.backgroundDefault }]}
            >
              <View style={styles.sourceContent}>
                <Feather name={recipe.platform === "tiktok" ? "video" : "instagram"} size={20} color={theme.primary} />
                <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>
                  View original on {recipe.platform === "tiktok" ? "TikTok" : "Instagram"}
                </ThemedText>
              </View>
              <Feather name="external-link" size={16} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              onPress={handleDelete}
              style={[styles.deleteButton, { borderColor: theme.error }]}
            >
              <Feather name="trash-2" size={18} color={theme.error} />
              <ThemedText type="small" style={[styles.deleteText, { color: theme.error }]}>
                Delete Recipe
              </ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Floating Cook Mode Button */}
      <View 
        style={[
          styles.floatingButtonContainer, 
          { 
            bottom: tabBarHeight,
          }
        ]}
      >
        <Pressable
          onPress={handleStartCookMode}
          style={[styles.cookModeButton, { backgroundColor: theme.primary }, Shadows.floating]}
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
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
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
                  style={[styles.modalOptionButton, { backgroundColor: theme.backgroundDefault, borderWidth: 1, borderColor: theme.border }]}
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
                    backgroundColor: theme.backgroundDefault, 
                    borderColor: theme.border,
                    color: theme.text 
                  }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <View style={styles.manualInputButtons}>
                  <Pressable
                    onPress={() => setShowManualInput(false)}
                    style={[styles.cancelButton, { borderColor: theme.border }]}
                  >
                    <ThemedText type="small">Back</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveManualLink}
                    style={[styles.saveButton, { backgroundColor: theme.primary }]}
                    disabled={!manualLinkInput.trim()}
                  >
                    <ThemedText type="small" style={{ color: "#FFF", fontWeight: "600" }}>
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
    height: 300,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
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
    paddingTop: Spacing["2xl"],
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  creatorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  creatorAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: Spacing.sm,
  },
  platformBadge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  title: {
    marginBottom: Spacing.lg,
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
    borderRadius: BorderRadius.lg,
  },
  description: {
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  metaCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  metaLabel: {
    fontSize: 11,
  },
  section: {
    marginBottom: Spacing["3xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.xl,
  },
  ingredientsList: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
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
    width: 28,
    height: 28,
    borderRadius: 14,
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
  sourceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  sourceContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  deleteText: {
    marginLeft: Spacing.sm,
    fontWeight: "500",
  },
  floatingButtonContainer: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 100,
  },
  cookModeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: BorderRadius.md,
  },
  cookModeButtonText: {
    color: "#FFF",
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  transparencyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  transparencyText: {
    flex: 1,
    lineHeight: 18,
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
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  searchRecipeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  noRecipeLinkContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
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
  creatorRecipeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  confidenceBadge: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  confidenceHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  confidenceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  sourceNote: {
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  authorityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: Spacing.sm,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: Spacing.xs,
  },
  wrongLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
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
    borderRadius: BorderRadius.lg,
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
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
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
    borderWidth: 1,
  },
  saveButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
  },
});
