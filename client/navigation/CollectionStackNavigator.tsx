import React from "react";
import { View, Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import CollectionScreen from "../screens/CollectionScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import CreateShoppingListScreen from "../screens/CreateShoppingListScreen";
import ShoppingListScreen from "../screens/ShoppingListScreen";
import { HeaderTitle, ScreenHeaderTitle } from "@/components/HeaderTitle";
import { ThemedText } from "@/components/ThemedText";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useShoppingList } from "@/hooks/useRecipes";
import { useTheme } from "@/hooks/useTheme";
import type { Recipe } from "@/types/recipe";

function ShoppingListHeaderButton() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { data: shoppingList } = useShoppingList();
  
  const uncheckedCount = shoppingList?.filter(i => !i.isChecked).length || 0;

  return (
    <HeaderButton
      onPress={() => navigation.navigate("ShoppingList")}
      accessibilityLabel="Shopping List"
    >
      <View style={{ position: "relative" }}>
        <Feather name="shopping-cart" size={22} color={theme.text} />
        {uncheckedCount > 0 ? (
          <View style={{
            position: "absolute",
            top: -6,
            right: -8,
            backgroundColor: theme.primary,
            borderRadius: 8,
            minWidth: 16,
            height: 16,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
          }}>
            <ThemedText style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>
              {uncheckedCount > 99 ? "99+" : uncheckedCount}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </HeaderButton>
  );
}

export type CollectionStackParamList = {
  Collection: undefined;
  RecipeDetail: { recipeId: string };
  CreateShoppingList: { recipes: Recipe[] };
  ShoppingList: undefined;
};

const Stack = createNativeStackNavigator<CollectionStackParamList>();

export default function CollectionStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Collection"
        component={CollectionScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Kitch" />,
          headerRight: () => <ShoppingListHeaderButton />,
        }}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{
          headerTitle: () => <ScreenHeaderTitle title="Recipe" />,
          headerTransparent: false,
        }}
      />
      <Stack.Screen
        name="CreateShoppingList"
        component={CreateShoppingListScreen}
        options={{
          headerTitle: () => <ScreenHeaderTitle title="Create Shopping List" />,
          headerTransparent: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{
          headerTitle: () => <ScreenHeaderTitle title="Shopping List" />,
          headerTransparent: false,
        }}
      />
    </Stack.Navigator>
  );
}
