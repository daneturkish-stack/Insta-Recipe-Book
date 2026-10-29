import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { StyleSheet, Platform, Alert, useColorScheme } from "react-native";
import { NavigationContainer, NavigationContainerRef, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser"; // Added for OAuth

import {
  useFonts,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
} from "@expo-google-fonts/figtree";
import { Caprasimo_400Regular } from "@expo-google-fonts/caprasimo";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator, { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/hooks/useAuth";
import { KitchColors } from "@/constants/theme";

// Initialize WebBrowser for authentication redirects
WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();

const linking = {
  prefixes: [
    Linking.createURL("/"),
    "simmer://",
    "kitch://", // kept for compatibility with any existing installs/shortcuts
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
  const colorScheme = useColorScheme();

  const navigationTheme = useMemo(() => {
    if (colorScheme === "dark") {
      return {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: KitchColors.primary,
          background: KitchColors.darkBackground,
          card: KitchColors.darkSurface,
          text: KitchColors.darkTextPrimary,
          border: KitchColors.darkBorder,
        },
      };
    }
    return {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: KitchColors.primary,
        background: KitchColors.background,
        card: KitchColors.surface,
        text: KitchColors.textPrimary,
        border: KitchColors.border,
      },
    };
  }, [colorScheme]);

  const [fontsLoaded, fontError] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
    Caprasimo_400Regular,
  });

  const openAddRecipeWith = useCallback((sharedUrl: string) => {
    navigationRef.current?.navigate("Main", {
      screen: "AddRecipeTab",
      params: {
        screen: "AddRecipe",
        params: { sharedUrl },
      },
    } as any);
  }, []);

  const handleDeepLink = useCallback((event: { url: string }) => {
    const { url } = event;

    // From the iOS Share Extension (targets/share/ShareViewController.swift):
    // simmer://add?url=<percent-encoded source url>
    if (url.startsWith("simmer://add?") || url.startsWith("kitch://add?")) {
      const queryString = url.split("?")[1] ?? "";
      const sharedUrl = new URLSearchParams(queryString).get("url");
      if (sharedUrl) {
        openAddRecipeWith(sharedUrl);
        return;
      }
    }

    if (isInstagramOrTikTokUrl(url)) {
      openAddRecipeWith(url);
    } else {
      const extractedUrl = extractUrlFromText(url);
      if (extractedUrl) {
        openAddRecipeWith(extractedUrl);
      }
    }
  }, [openAddRecipeWith]);

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
        <AuthProvider>
          <SafeAreaProvider>
            <GestureHandlerRootView style={styles.root}>
              <KeyboardProvider>
                <NavigationContainer ref={navigationRef} linking={linking} theme={navigationTheme}>
                  <RootStackNavigator />
                </NavigationContainer>
                <StatusBar style="auto" />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});