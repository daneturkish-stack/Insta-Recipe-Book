import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";

import CollectionScreen from "../screens/CollectionScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import ReviewIngredientsScreen from "../screens/ReviewIngredientsScreen";
import CreateShoppingListScreen from "../screens/CreateShoppingListScreen";
import ShoppingListScreen from "../screens/ShoppingListScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { HeaderTitle, ScreenHeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import type { Recipe } from "@/types/recipe";

const avatarImage = require("../../assets/images/avatar-preset.png");

function ProfileHeaderButton() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <HeaderButton
      onPress={() => navigation.navigate("Profile")}
      accessibilityLabel="Profile"
    >
      <Image
        source={user?.profileImage ? { uri: user.profileImage } : avatarImage}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: theme.backgroundSecondary,
        }}
        contentFit="cover"
      />
    </HeaderButton>
  );
}

export type CollectionStackParamList = {
  Collection: undefined;
  RecipeDetail: { recipeId: string };
  ReviewIngredients: { recipeId: string };
  CreateShoppingList: { recipes: Recipe[] };
  ShoppingList: undefined;
  Profile: undefined;
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
          headerTitle: () => <HeaderTitle />,
          headerRight: () => <ProfileHeaderButton />,
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
        name="ReviewIngredients"
        component={ReviewIngredientsScreen}
        options={{
          headerShown: false,
          presentation: "modal",
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
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTitle: () => <ScreenHeaderTitle title="Profile" />,
          headerTransparent: false,
        }}
      />
    </Stack.Navigator>
  );
}
