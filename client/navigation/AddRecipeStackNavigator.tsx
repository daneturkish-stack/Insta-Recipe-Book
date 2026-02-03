import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AddRecipeScreen from "@/screens/AddRecipeScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type AddRecipeStackParamList = {
  AddRecipe: { sharedUrl?: string } | undefined;
};

const Stack = createNativeStackNavigator<AddRecipeStackParamList>();

export default function AddRecipeStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="AddRecipe"
        component={AddRecipeScreen}
        options={{
          headerTitle: "Add Recipe",
        }}
      />
    </Stack.Navigator>
  );
}
