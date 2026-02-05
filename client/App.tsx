import React, { useEffect, useRef, useCallback } from "react";
import { StyleSheet, Platform, Alert } from "react-native";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator, { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

const linking = {
  prefixes: [
    Linking.createURL("/"),
    "kitch://",
  ],
  config: {
    screens: {
      Main: {
        screens: {
          AddRecipeTab: {
            screens: {
              AddRecipe: "add",
            },
          },
          CollectionTab: {
            screens: {
              Collection: "recipes",
            },
          },
        },
      },
    },
  },
};

function isInstagramOrTikTokUrl(url: string): boolean {
  const instagramPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels)\/[\w-]+/i;
  const tiktokPattern = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\//i;
  return instagramPattern.test(url) || tiktokPattern.test(url);
}

function extractUrlFromText(text: string): string | null {
  const urlPattern = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlPattern);
  if (matches) {
    for (const url of matches) {
      if (isInstagramOrTikTokUrl(url)) {
        return url;
      }
    }
  }
  return null;
}

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const handleDeepLink = useCallback((event: { url: string }) => {
    const { url } = event;
    
    if (isInstagramOrTikTokUrl(url)) {
      navigationRef.current?.navigate("Main", {
        screen: "AddRecipeTab",
        params: {
          screen: "AddRecipe",
          params: { sharedUrl: url },
        },
      } as any);
    } else {
      const extractedUrl = extractUrlFromText(url);
      if (extractedUrl) {
        navigationRef.current?.navigate("Main", {
          screen: "AddRecipeTab",
          params: {
            screen: "AddRecipe",
            params: { sharedUrl: extractedUrl },
          },
        } as any);
      }
    }
  }, []);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", handleDeepLink);
    
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <KeyboardProvider>
              <NavigationContainer ref={navigationRef} linking={linking}>
                <RootStackNavigator />
              </NavigationContainer>
              <StatusBar style="auto" />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
