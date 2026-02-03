import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PantryScreen from "@/screens/PantryScreen";
import PantryResultsScreen from "@/screens/PantryResultsScreen";
import RecipeDetailScreen from "@/screens/RecipeDetailScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type PantryStackParamList = {
  Pantry: undefined;
  PantryResults: { matches: { id: string; matchPercentage: number; missingIngredients: string[] }[] };
  RecipeDetail: { recipeId: string };
};

const Stack = createNativeStackNavigator<PantryStackParamList>();

export default function PantryStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Pantry"
        component={PantryScreen}
        options={{
          headerTitle: () => <HeaderTitle title="My Pantry" />,
        }}
      />
      <Stack.Screen
        name="PantryResults"
        component={PantryResultsScreen}
        options={{
          headerTitle: "Recipes You Can Make",
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
    </Stack.Navigator>
  );
}
