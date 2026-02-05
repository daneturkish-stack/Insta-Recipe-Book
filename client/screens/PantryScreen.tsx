import React, { useState, useMemo, useEffect } from "react";
import { StyleSheet, View, FlatList, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { File } from "expo-file-system";
import Animated, { 
  FadeInDown, 
  FadeIn, 
  Layout, 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming,
  withSpring 
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { usePantry, useAddPantryItem, useRemovePantryItem, useClearPantry, useRecipes, usePantryMatch } from "@/hooks/useRecipes";
import { getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";
import { PANTRY_CATEGORIES, type PantryItem } from "@/types/recipe";

const emptyImage = require("../../assets/images/empty-collection.png");

const COMMON_INGREDIENTS = [
  { name: "Chicken", category: "protein" },
  { name: "Beef", category: "protein" },
  { name: "Salmon", category: "protein" },
  { name: "Eggs", category: "dairy" },
  { name: "Butter", category: "dairy" },
  { name: "Milk", category: "dairy" },
  { name: "Cheese", category: "dairy" },
  { name: "Onion", category: "produce" },
  { name: "Garlic", category: "produce" },
  { name: "Tomatoes", category: "produce" },
  { name: "Potatoes", category: "produce" },
  { name: "Carrots", category: "produce" },
  { name: "Broccoli", category: "produce" },
  { name: "Rice", category: "pantry" },
  { name: "Pasta", category: "pantry" },
  { name: "Olive Oil", category: "pantry" },
  { name: "Flour", category: "pantry" },
  { name: "Sugar", category: "pantry" },
  { name: "Salt", category: "spices" },
  { name: "Pepper", category: "spices" },
  { name: "Oregano", category: "spices" },
  { name: "Basil", category: "spices" },
] as const;

export default function PantryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const { data: pantryItems = [], isLoading } = usePantry();
  const { data: recipes = [] } = useRecipes();
  const addItem = useAddPantryItem();
  const removeItem = useRemovePantryItem();
  const clearPantry = useClearPantry();
  const pantryMatch = usePantryMatch();

  const [newIngredient, setNewIngredient] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const micScale = useSharedValue(1);
  
  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  useEffect(() => {
    if (isRecording) {
      micScale.value = withSequence(
        withTiming(1.3, { duration: 300 }),
        withTiming(1.1, { duration: 300 })
      );
      const interval = setInterval(() => {
        micScale.value = withSequence(
          withTiming(1.3, { duration: 300 }),
          withTiming(1.1, { duration: 300 })
        );
      }, 600);
      return () => clearInterval(interval);
    } else {
      micScale.value = withSpring(1);
    }
  }, [isRecording]);

  const pantryNames = pantryItems.map((p) => p.name.toLowerCase());

  const filteredSuggestions = useMemo(() => {
    if (!newIngredient.trim()) return [];
    const query = newIngredient.toLowerCase();
    return COMMON_INGREDIENTS.filter(
      (i) => i.name.toLowerCase().includes(query) && !pantryNames.includes(i.name.toLowerCase())
    ).slice(0, 5);
  }, [newIngredient, pantryNames]);

  const handleAddIngredient = async (name: string, category: string = "other") => {
    if (!name.trim()) return;
    if (pantryNames.includes(name.toLowerCase())) {
      Alert.alert("Already added", "This ingredient is already in your pantry");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addItem.mutateAsync({ name: name.trim(), category: category as any });
    setNewIngredient("");
    setShowSuggestions(false);
  };

  const handleRemoveItem = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await removeItem.mutateAsync(id);
  };

  const startVoiceRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Microphone access needed", "Please enable microphone access to use voice input.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Could not start voice recording. Please try again.");
    }
  };

  const stopVoiceRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsProcessingVoice(true);

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        throw new Error("No recording URI");
      }

      console.log("[Voice] Recording URI:", uri);
      
      const audioFile = new File(uri);
      const base64Audio = await audioFile.base64();
      
      console.log("[Voice] Base64 length:", base64Audio?.length || 0);

      if (!base64Audio || base64Audio.length === 0) {
        throw new Error("Failed to read audio file");
      }

      const transcribeUrl = new URL("/api/remy/transcribe", getApiUrl()).toString();
      console.log("[Voice] Sending to:", transcribeUrl);
      
      const transcribeResponse = await fetch(transcribeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64Audio }),
      });

      console.log("[Voice] Response status:", transcribeResponse.status);
      
      const transcribeData = await transcribeResponse.json();
      console.log("[Voice] Response data:", JSON.stringify(transcribeData));
      
      if (transcribeData.error || !transcribeData.text) {
        throw new Error(transcribeData.error || "No transcription received");
      }

      const parseResponse = await fetch(
        new URL("/api/pantry/parse-voice", getApiUrl()).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: transcribeData.text }),
        }
      );

      const parseData = await parseResponse.json();

      if (parseData.items && parseData.items.length > 0) {
        let addedCount = 0;
        for (const item of parseData.items) {
          if (!pantryNames.includes(item.name.toLowerCase())) {
            await addItem.mutateAsync({ name: item.name, category: item.category });
            addedCount++;
          }
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (addedCount > 0) {
          Alert.alert("Added!", `Added ${addedCount} ingredient${addedCount > 1 ? "s" : ""} to your pantry.`);
        } else {
          Alert.alert("Already have these", "All those ingredients are already in your pantry!");
        }
      } else {
        Alert.alert("Hmm...", "I couldn't identify any ingredients. Try again, and speak clearly about what's in your fridge or cupboard!");
      }
    } catch (error) {
      console.error("Voice processing failed:", error);
      Alert.alert("Oops!", "Could not process your voice. Please try again or type the ingredients.");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleFindRecipes = async () => {
    if (pantryItems.length === 0) {
      Alert.alert("Add ingredients", "Add some ingredients to your pantry first");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await pantryMatch.mutateAsync({
      pantryItems: pantryItems.map((p) => p.name),
      recipes,
    });

    if (result.length === 0) {
      Alert.alert("No matches", "No recipes match your current ingredients. Try adding more!");
    } else {
      navigation.navigate("PantryResults", { matches: result });
    }
  };

  const handleClearPantry = () => {
    Alert.alert("Clear Pantry", "Remove all ingredients from your pantry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          clearPantry.mutate();
        },
      },
    ]);
  };

  const groupedItems = useMemo(() => {
    const groups: Record<string, PantryItem[]> = {};
    pantryItems.forEach((item) => {
      const cat = item.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [pantryItems]);

  const renderIngredientChip = (item: PantryItem) => (
    <Animated.View
      key={item.id}
      entering={FadeIn.duration(200)}
      layout={Layout.springify()}
      style={[styles.chip, { backgroundColor: theme.backgroundDefault }]}
    >
      <ThemedText type="small">{item.name}</ThemedText>
      <Pressable onPress={() => handleRemoveItem(item.id)} hitSlop={8}>
        <Feather name="x" size={16} color={theme.textSecondary} style={{ marginLeft: Spacing.sm }} />
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
            flexGrow: pantryItems.length === 0 ? 1 : undefined,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {/* Search Input */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border, flex: 1 }]}>
                  <Feather name="plus" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Add ingredient..."
                    placeholderTextColor={theme.textSecondary}
                    value={newIngredient}
                    onChangeText={(text) => {
                      setNewIngredient(text);
                      setShowSuggestions(true);
                    }}
                    onSubmitEditing={() => handleAddIngredient(newIngredient)}
                    returnKeyType="done"
                  />
                  {newIngredient.length > 0 ? (
                    <Pressable onPress={() => handleAddIngredient(newIngredient)}>
                      <Feather name="check" size={20} color={theme.primary} />
                    </Pressable>
                  ) : null}
                </View>
                
                <Animated.View style={micAnimatedStyle}>
                  <Pressable
                    onPress={isRecording ? stopVoiceRecording : startVoiceRecording}
                    style={[
                      styles.micButton,
                      { backgroundColor: isRecording ? theme.error : theme.primary }
                    ]}
                    disabled={isProcessingVoice}
                    testID="pantry-voice-button"
                  >
                    {isProcessingVoice ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Feather 
                        name={isRecording ? "mic-off" : "mic"} 
                        size={22} 
                        color="#FFF" 
                      />
                    )}
                  </Pressable>
                </Animated.View>
              </View>
              
              {isRecording ? (
                <ThemedText type="caption" style={[styles.recordingHint, { color: theme.error }]}>
                  Listening... Tell me what's in your fridge!
                </ThemedText>
              ) : null}

              {showSuggestions && filteredSuggestions.length > 0 ? (
                <View style={[styles.suggestions, { backgroundColor: theme.backgroundDefault }]}>
                  {filteredSuggestions.map((suggestion) => (
                    <Pressable
                      key={suggestion.name}
                      style={styles.suggestionItem}
                      onPress={() => handleAddIngredient(suggestion.name, suggestion.category)}
                    >
                      <ThemedText type="small">{suggestion.name}</ThemedText>
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        {suggestion.category}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </Animated.View>

            {/* Quick Add Buttons */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.quickAdd}>
              <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                Quick add:
              </ThemedText>
              <View style={styles.quickAddRow}>
                {COMMON_INGREDIENTS.slice(0, 8)
                  .filter((i) => !pantryNames.includes(i.name.toLowerCase()))
                  .slice(0, 5)
                  .map((ingredient) => (
                    <Pressable
                      key={ingredient.name}
                      style={[styles.quickChip, { borderColor: theme.border }]}
                      onPress={() => handleAddIngredient(ingredient.name, ingredient.category)}
                    >
                      <Feather name="plus" size={12} color={theme.primary} />
                      <ThemedText type="caption" style={{ marginLeft: 4 }}>
                        {ingredient.name}
                      </ThemedText>
                    </Pressable>
                  ))}
              </View>
            </Animated.View>
          </>
        }
        ListEmptyComponent={
          pantryItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                image={emptyImage}
                title="Your pantry is empty"
                subtitle="Add ingredients you have on hand to find recipes you can make right now"
              />
            </View>
          ) : null
        }
        ListFooterComponent={
          pantryItems.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              {/* Grouped Ingredients */}
              {Object.entries(groupedItems).map(([category, items]) => (
                <View key={category} style={styles.categorySection}>
                  <ThemedText type="small" style={[styles.categoryLabel, { color: theme.textSecondary }]}>
                    {PANTRY_CATEGORIES.find((c) => c.id === category)?.label || "Other"}
                  </ThemedText>
                  <View style={styles.chipsContainer}>
                    {items.map(renderIngredientChip)}
                  </View>
                </View>
              ))}

              {/* Action Buttons */}
              <View style={styles.actions}>
                <Button onPress={handleFindRecipes} loading={pantryMatch.isPending}>
                  Find Recipes I Can Make
                </Button>
                <Pressable onPress={handleClearPantry} style={styles.clearButton}>
                  <ThemedText type="small" style={{ color: theme.error }}>
                    Clear Pantry
                  </ThemedText>
                </Pressable>
              </View>
            </Animated.View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 52,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  micButton: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingHint: {
    textAlign: "center",
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
  },
  suggestions: {
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  quickAdd: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  quickAddRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryLabel: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 1,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Spacing["4xl"],
  },
  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  clearButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
});
