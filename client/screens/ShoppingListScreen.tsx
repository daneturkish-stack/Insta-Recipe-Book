import React, { useMemo, useCallback, useState } from "react";
import { StyleSheet, View, FlatList, Pressable, RefreshControl, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, FadeOut, Layout } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useShoppingList, useToggleShoppingItem, useClearCheckedItems, useClearShoppingList } from "@/hooks/useRecipes";
import { Spacing, BorderRadius } from "@/constants/theme";
import { AISLE_CATEGORIES, type ShoppingListItem, type AisleCategory } from "@/types/recipe";

const emptyImage = require("../../assets/images/empty-collection.png");

interface AisleSection {
  aisle: AisleCategory;
  label: string;
  icon: string;
  items: ShoppingListItem[];
}

export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const { data: shoppingList, isLoading, refetch, isRefetching } = useShoppingList();
  const toggleItem = useToggleShoppingItem();
  const clearChecked = useClearCheckedItems();
  const clearAll = useClearShoppingList();

  const [showChecked, setShowChecked] = useState(true);

  const sections = useMemo(() => {
    if (!shoppingList || shoppingList.length === 0) return [];

    const aisleMap = new Map<AisleCategory, ShoppingListItem[]>();

    for (const item of shoppingList) {
      if (!showChecked && item.isChecked) continue;

      const aisle = item.aisle || "other";
      const existing = aisleMap.get(aisle) || [];
      existing.push(item);
      aisleMap.set(aisle, existing);
    }

    const result: AisleSection[] = [];
    for (const category of AISLE_CATEGORIES) {
      const items = aisleMap.get(category.id);
      if (items && items.length > 0) {
        result.push({
          aisle: category.id,
          label: category.label,
          icon: category.icon,
          // INJECTED: Smart Sorting - Ghost items (in pantry) always drop to bottom
          items: items.sort((a, b) => {
            if (a.isChecked !== b.isChecked) return Number(a.isChecked) - Number(b.isChecked);
            return Number(a.inPantry) - Number(b.inPantry);
          }),
        });
      }
    }

    return result;
  }, [shoppingList, showChecked]);

  const checkedCount = shoppingList?.filter((i) => i.isChecked).length || 0;
  const totalCount = shoppingList?.length || 0;

  const handleToggleItem = useCallback((itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleItem.mutate(itemId);
  }, [toggleItem]);

  const handleClearChecked = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearChecked.mutate();
  }, [clearChecked]);

  const handleClearAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    clearAll.mutate();
  }, [clearAll]);

  const renderItem = useCallback(({ item }: { item: ShoppingListItem }) => {
    /**
     * INJECTED: Ghost Logic
     * A 'Ghost' item is one that was auto-checked because it's in the pantry.
     */
    const isGhost = item.inPantry && item.isChecked;

    return (
      <Animated.View
        entering={FadeInDown.duration(200)}
        exiting={FadeOut.duration(150)}
        layout={Layout.springify()}
      >
        <Pressable
          onPress={() => handleToggleItem(item.id)}
          style={[
            styles.itemRow,
            { backgroundColor: theme.backgroundDefault },
            // INJECTED: Visual Opacity for Ghosts vs Manual Checks
            isGhost && { opacity: 0.35 }, 
            !isGhost && item.isChecked && { opacity: 0.6 },
          ]}
          testID={`item-${item.id}`}
        >
          <View style={[
            styles.checkbox,
            { borderColor: item.isChecked ? theme.primary : theme.border },
            item.isChecked && { backgroundColor: theme.primary },
          ]}>
            {item.isChecked ? (
              <Feather name="check" size={14} color="#FFF" />
            ) : null}
          </View>
          <View style={styles.itemContent}>
            <View style={styles.itemNameRow}>
              <ThemedText
                type="bodyMedium"
                style={[
                  { color: theme.text },
                  item.isChecked && { textDecorationLine: "line-through" },
                ]}
              >
                {item.name}
              </ThemedText>

              {/* INJECTED: Pantry Badge styling refinement */}
              {item.inPantry ? (
                <View style={[styles.pantryBadge, { backgroundColor: theme.primary + "15" }]}>
                  <Feather name="box" size={10} color={theme.primary} />
                  <ThemedText type="caption" style={{ color: theme.primary, marginLeft: 3, fontSize: 10, fontWeight: '600' }}>
                    IN PANTRY
                  </ThemedText>
                </View>
              ) : null}
            </View>
            {item.amount ? (
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {item.amount} {item.unit}
              </ThemedText>
            ) : null}
          </View>
          {item.recipeTitles && item.recipeTitles.length > 0 ? (
            <View style={[styles.recipeTag, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, fontSize: 10 }} numberOfLines={1}>
                {item.recipeTitles[0]}
              </ThemedText>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    );
  }, [handleToggleItem, theme]);

  const renderSectionHeader = useCallback((section: AisleSection) => {
    const aisleCategory = AISLE_CATEGORIES.find((c) => c.id === section.aisle);
    return (
      <View style={[styles.sectionHeader, { backgroundColor: theme.backgroundRoot }]}>
        <Feather name={aisleCategory?.icon as any || "box"} size={16} color={theme.primary} />
        <ThemedText type="bodyMedium" style={{ color: theme.text, marginLeft: Spacing.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}>
          {section.label}
        </ThemedText>
        <View style={styles.countBadge}>
           <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {section.items.length}
          </ThemedText>
        </View>
      </View>
    );
  }, [theme]);

  const renderEmpty = () => (
    <View style={[styles.emptyContainer, { paddingBottom: insets.bottom + (Platform.OS === "ios" ? 88 : 64) + Spacing.xl }]}>
      <EmptyState
        image={emptyImage}
        title="Your list is empty"
        subtitle="Add ingredients from your recipes and we'll automatically check your pantry for you."
      />
      <Button
        onPress={() => navigation.navigate("CollectionTab")}
        style={styles.goToCollectionButton}
      >
        <Feather name="book-open" size={18} color="#FFF" style={{ marginRight: 8 }} />
        Browse Recipes
      </Button>
    </View>
  );

  const flatData = useMemo(() => {
    const result: (AisleSection | ShoppingListItem)[] = [];
    for (const section of sections) {
      result.push(section);
      result.push(...section.items);
    }
    return result;
  }, [sections]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {totalCount > 0 ? (
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.progressRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary, fontWeight: '600' }}>
              {checkedCount} / {totalCount} Items
            </ThemedText>
            <Pressable onPress={() => setShowChecked(!showChecked)}>
              <ThemedText type="caption" style={{ color: theme.primary, fontWeight: "700" }}>
                {showChecked ? "HIDE CHECKED" : "SHOW CHECKED"}
              </ThemedText>
            </Pressable>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.progressTrack }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: theme.primary, width: `${(checkedCount / totalCount) * 100}%` },
              ]}
            />
          </View>
        </View>
      ) : null}

      <FlatList
        data={flatData}
        keyExtractor={(item) => 
          "aisle" in item ? `section-${(item as AisleSection).aisle}` : (item as ShoppingListItem).id
        }
        renderItem={({ item }) => 
          "aisle" in item ? renderSectionHeader(item as AisleSection) : renderItem({ item: item as ShoppingListItem })
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + (checkedCount > 0 ? 120 : 40) },
          flatData.length === 0 && { flexGrow: 1 },
        ]}
        ListEmptyComponent={isLoading ? null : renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {checkedCount > 0 && showChecked && (
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOut}
          style={[
            styles.bottomBar,
            { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + (Platform.OS === "ios" ? 100 : 80) },
          ]}
        >
          <Pressable onPress={handleClearChecked} style={[styles.clearButton, { backgroundColor: theme.error + '10', borderColor: theme.error + '20' }]}>
            <Feather name="trash-2" size={18} color={theme.error} />
            <ThemedText type="bodyMedium" style={{ color: theme.error, marginLeft: Spacing.sm, fontWeight: '600' }}>
              Clear Checked Items
            </ThemedText>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.lg, borderBottomWidth: 1 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  listContent: { padding: Spacing.lg },
  sectionHeader: { flexDirection: "row", alignItems: "center", paddingVertical: Spacing.md, marginTop: Spacing.lg },
  countBadge: { marginLeft: 8, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 6, borderRadius: 6 },
  itemRow: { flexDirection: "row", alignItems: "center", padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.xs },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center", marginRight: Spacing.md },
  itemContent: { flex: 1 },
  itemNameRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flexWrap: "wrap" },
  pantryBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  recipeTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  goToCollectionButton: { marginTop: 24, width: '100%' },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingTop: Spacing.lg, paddingHorizontal: Spacing.xl, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  clearButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 52, borderRadius: 26, borderWidth: 1 },
});