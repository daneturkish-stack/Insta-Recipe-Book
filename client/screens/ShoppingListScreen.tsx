import React, { useMemo, useCallback, useState } from "react";
import { StyleSheet, View, FlatList, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, FadeOut, Layout } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
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
          items: items.sort((a, b) => Number(a.isChecked) - Number(b.isChecked)),
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

  const renderItem = useCallback(({ item }: { item: ShoppingListItem }) => (
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
          item.isChecked && { opacity: 0.6 },
        ]}
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
          <ThemedText
            type="bodyMedium"
            style={[
              { color: theme.text },
              item.isChecked && { textDecorationLine: "line-through" },
            ]}
          >
            {item.name}
          </ThemedText>
          {item.amount ? (
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {item.amount} {item.unit}
            </ThemedText>
          ) : null}
        </View>
        {item.recipeTitles && item.recipeTitles.length > 0 ? (
          <ThemedText type="caption" style={{ color: theme.textSecondary, maxWidth: 100 }} numberOfLines={1}>
            {item.recipeTitles[0]}
          </ThemedText>
        ) : null}
      </Pressable>
    </Animated.View>
  ), [handleToggleItem, theme]);

  const renderSectionHeader = useCallback((section: AisleSection) => {
    const aisleCategory = AISLE_CATEGORIES.find((c) => c.id === section.aisle);
    return (
      <View style={[styles.sectionHeader, { backgroundColor: theme.backgroundRoot }]}>
        <Feather name={aisleCategory?.icon as any || "box"} size={16} color={theme.primary} />
        <ThemedText type="bodyMedium" style={{ color: theme.text, marginLeft: Spacing.sm }}>
          {section.label}
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
          ({section.items.length})
        </ThemedText>
      </View>
    );
  }, [theme]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        image={emptyImage}
        title="Shopping list is empty"
        subtitle="Select recipes from your collection and tap 'Add to List' to create your shopping list"
      />
      <Pressable
        onPress={() => navigation.navigate("Collection")}
        style={[styles.goToCollectionButton, { backgroundColor: theme.primary }]}
      >
        <Feather name="book-open" size={18} color="#FFF" />
        <ThemedText type="bodyMedium" style={{ color: "#FFF", marginLeft: Spacing.sm }}>
          Browse Recipes
        </ThemedText>
      </Pressable>
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
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {checkedCount} of {totalCount} items checked
            </ThemedText>
            <Pressable onPress={() => setShowChecked(!showChecked)}>
              <ThemedText type="caption" style={{ color: theme.primary, fontWeight: "600" }}>
                {showChecked ? "Hide checked" : "Show checked"}
              </ThemedText>
            </Pressable>
          </View>
          <View style={[styles.progressBar, { backgroundColor: isDark ? theme.backgroundSecondary : "#E5E5E5" }]}>
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
          { paddingBottom: insets.bottom + (checkedCount > 0 ? 100 : 24) },
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

      {checkedCount > 0 ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[
            styles.bottomBar,
            { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.md },
          ]}
        >
          <Pressable onPress={handleClearChecked} style={[styles.clearButton, { borderColor: theme.border }]}>
            <Feather name="trash-2" size={18} color={theme.text} />
            <ThemedText type="body" style={{ color: theme.text, marginLeft: Spacing.sm }}>
              Clear checked ({checkedCount})
            </ThemedText>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  listContent: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  goToCollectionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
});
