import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenHeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import ShoppingListScreen from "../screens/ShoppingListScreen";
import CreateShoppingListScreen from "../screens/CreateShoppingListScreen";
import type { Recipe } from "@/types/recipe";

export type ShoppingStackParamList = {
  ShoppingList: undefined;
  CreateShoppingList: { recipes: Recipe[] };
};

const Stack = createNativeStackNavigator<ShoppingStackParamList>();

export default function ShoppingStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{
          headerTitle: () => <ScreenHeaderTitle title="Shopping List" />,
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
    </Stack.Navigator>
  );
}
