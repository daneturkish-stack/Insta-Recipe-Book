import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CollectionScreen from "@/screens/CollectionScreen";
import RecipeDetailScreen from "@/screens/RecipeDetailScreen";
import CreateShoppingListScreen from "@/screens/CreateShoppingListScreen";
import ShoppingListScreen from "@/screens/ShoppingListScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import type { Recipe } from "@/types/recipe";

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
        }}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{
          headerTitle: "Recipe",
          headerTransparent: false,
        }}
      />
      <Stack.Screen
        name="CreateShoppingList"
        component={CreateShoppingListScreen}
        options={{
          headerTitle: "Create Shopping List",
          headerTransparent: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{
          headerTitle: "Shopping List",
          headerTransparent: false,
        }}
      />
    </Stack.Navigator>
  );
}
