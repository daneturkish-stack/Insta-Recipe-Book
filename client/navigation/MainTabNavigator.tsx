import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image, Platform, StyleSheet, Text, View } from "react-native";

import CollectionStackNavigator from "@/navigation/CollectionStackNavigator";
import AddRecipeStackNavigator from "@/navigation/AddRecipeStackNavigator";
import PantryStackNavigator from "@/navigation/PantryStackNavigator";
import ShoppingStackNavigator from "@/navigation/ShoppingStackNavigator";
import RemiScreen from "@/screens/RemiScreen";
import { useTheme } from "@/hooks/useTheme";
import { useShoppingList } from "@/hooks/useRecipes";
import { KitchColors } from "@/constants/theme";

import foodTrayIcon from "../assets/images/food-tray.png";
import healthyFoodIcon from "../assets/images/healthy-food.png";
import chefsHatIcon from "../assets/images/chefs-hat.png";

export type MainTabParamList = {
  CollectionTab: undefined;
  AddRecipeTab: undefined;
  RemiTab: undefined;
  PantryTab: undefined;
  ShoppingTab: undefined;
};

function ShoppingTabIcon({ color }: { color: string }) {
  const { data: shoppingList } = useShoppingList();
  const uncheckedCount = shoppingList?.filter(i => !i.isChecked).length || 0;

  return (
    <View style={{ position: "relative" }}>
      <Feather name="shopping-cart" size={22} color={color} />
      {uncheckedCount > 0 ? (
        <View style={{
          position: "absolute",
          top: -6,
          right: -8,
          backgroundColor: KitchColors.primary,
          borderRadius: 8,
          minWidth: 16,
          height: 16,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 4,
        }}>
          <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>
            {uncheckedCount > 99 ? "99+" : uncheckedCount}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

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
            <Image source={foodTrayIcon} style={[styles.tabIcon, { tintColor: color }]} />
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
          tabBarIcon: ({ color }) => (
            <Image source={chefsHatIcon} style={[styles.tabIcon, { tintColor: color }]} />
          ),
        }}
      />
      <Tab.Screen
        name="PantryTab"
        component={PantryStackNavigator}
        options={{
          title: "Pantry",
          tabBarIcon: ({ color }) => (
            <Image source={healthyFoodIcon} style={[styles.tabIcon, { tintColor: color }]} />
          ),
        }}
      />
      <Tab.Screen
        name="ShoppingTab"
        component={ShoppingStackNavigator}
        options={{
          title: "Shop",
          tabBarIcon: ({ color }) => <ShoppingTabIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  activeIconWrapper: {},
  tabIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
});
