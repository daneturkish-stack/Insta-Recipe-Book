import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "kitch_auth_token";

let cachedToken: string | null = null;

export async function setAuthToken(token: string): Promise<void> {
  cachedToken = token;
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

export async function getAuthToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  if (Platform.OS === "web") {
    cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  } else {
    cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  }
  return cachedToken;
}

export async function removeAuthToken(): Promise<void> {
  cachedToken = null;
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export function getCachedToken(): string | null {
  return cachedToken;
}
