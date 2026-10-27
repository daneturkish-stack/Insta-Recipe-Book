import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
// Exported by Firebase's React Native build, which Metro uses, but missing from
// the web typings TypeScript resolves.
// @ts-expect-error
import { getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:123456"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// Keep the signed-in user on the device so they stay logged in between launches.
// initializeAuth can only run once per app, so a fast refresh falls back to the
// instance that already exists.
function createAuth(): Auth {
    try {
        return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
    } catch {
        return getAuth(app);
    }
}

export const auth = createAuth();
