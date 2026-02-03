import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useRecipe, useDeleteRecipe } from "@/hooks/useRecipes";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

const placeholderImage = require("../../assets/images/recipe-placeholder.png");

export default function RecipeDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { recipeId } = route.params;

  const recipe = useRecipe(recipeId);
  const deleteRecipe = useDeleteRecipe();

  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing["3xl"] }}
      showsVerticalScrollIndicator={false}
    >
      <Image
        source={recipe.imageUrl ? { uri: recipe.imageUrl } : placeholderImage}
        style={styles.heroImage}
        contentFit="cover"
        transition={200}
      />

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <ThemedText type="h2" style={styles.title}>
            {recipe.title}
          </ThemedText>

          {recipe.description ? (
            <ThemedText type="body" style={[styles.description, { color: theme.textSecondary }]}>
              {recipe.description}
            </ThemedText>
          ) : null}

          <View style={styles.metaRow}>
            {recipe.prepTime ? (
              <View style={[styles.metaCard, { backgroundColor: theme.backgroundDefault }]}>
                <Feather name="clock" size={18} color={theme.primary} />
                <ThemedText type="small" style={styles.metaLabel}>Prep</ThemedText>
                <ThemedText type="bodyMedium">{recipe.prepTime} min</ThemedText>
              </View>
            ) : null}
            {recipe.cookTime ? (
              <View style={[styles.metaCard, { backgroundColor: theme.backgroundDefault }]}>
                <Feather name="thermometer" size={18} color={theme.primary} />
                <ThemedText type="small" style={styles.metaLabel}>Cook</ThemedText>
                <ThemedText type="bodyMedium">{recipe.cookTime} min</ThemedText>
              </View>
            ) : null}
            {recipe.servings ? (
              <View style={[styles.metaCard, { backgroundColor: theme.backgroundDefault }]}>
                <Feather name="users" size={18} color={theme.primary} />
                <ThemedText type="small" style={styles.metaLabel}>Servings</ThemedText>
                <ThemedText type="bodyMedium">{recipe.servings}</ThemedText>
              </View>
            ) : null}
          </View>
        </Animated.View>

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
                    {ingredient.amount} {ingredient.unit} {ingredient.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

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

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Pressable
            onPress={handleOpenSource}
            style={[styles.sourceButton, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={styles.sourceContent}>
              <Feather name="instagram" size={20} color={theme.primary} />
              <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>
                View original on Instagram
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroImage: {
    width: "100%",
    height: 280,
  },
  content: {
    padding: Spacing.lg,
    marginTop: -Spacing["2xl"],
  },
  title: {
    marginBottom: Spacing.sm,
  },
  description: {
    marginBottom: Spacing.lg,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.sm,
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
    opacity: 0.7,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  ingredientsList: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
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
    marginBottom: Spacing.lg,
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
    lineHeight: 26,
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
});
