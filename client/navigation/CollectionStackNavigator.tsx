import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CollectionScreen from "@/screens/CollectionScreen";
import RecipeDetailScreen from "@/screens/RecipeDetailScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type CollectionStackParamList = {
  Collection: undefined;
  RecipeDetail: { recipeId: string };
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
    </Stack.Navigator>
  );
}
