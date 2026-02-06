import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";

import CollectionStackNavigator from "@/navigation/CollectionStackNavigator";
import AddRecipeStackNavigator from "@/navigation/AddRecipeStackNavigator";
import PantryStackNavigator from "@/navigation/PantryStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import RemiScreen from "@/screens/RemiScreen";
import { useTheme } from "@/hooks/useTheme";
import { KitchColors } from "@/constants/theme";

export type MainTabParamList = {
  CollectionTab: undefined;
  AddRecipeTab: undefined;
  RemiTab: undefined;
  PantryTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="CollectionTab"
      screenOptions={{
        tabBarActiveTintColor: KitchColors.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          fontFamily: "Inter_500Medium",
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="CollectionTab"
        component={CollectionStackNavigator}
        options={{
          title: "Recipes",
          tabBarIcon: ({ color }) => (
            <Feather name="book-open" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AddRecipeTab"
        component={AddRecipeStackNavigator}
        options={{
          title: "Add",
          tabBarIcon: ({ color }) => (
            <Feather name="plus-circle" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RemiTab"
        component={RemiScreen}
        options={{
          title: "Remi",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="chef-hat" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PantryTab"
        component={PantryStackNavigator}
        options={{
          title: "Pantry",
          tabBarIcon: ({ color }) => (
            <Feather name="package" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  activeIconWrapper: {},
});
