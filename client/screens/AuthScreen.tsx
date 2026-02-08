import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session"; // Added for manual redirect control

// Standard Expo Auth Hooks (Live Ready)
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { KitchColors, Spacing, BorderRadius } from "@/constants/theme";

WebBrowser.maybeCompleteAuthSession();

const appIcon = require("../../assets/images/icon.png");

type AuthMode = "welcome" | "login" | "register";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { login, register, socialLogin } = useAuth();

  const [mode, setMode] = useState<AuthMode>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // --- GOOGLE CONFIGURATION (Live Ready) ---
  const [gRequest, gResponse, gPromptAsync] = Google.useAuthRequest({
    androidClientId: "52014612790-iprjnuhmrooptif86bfhf2lhot7iml82.apps.googleusercontent.com",
    iosClientId: "52014612790-dds59pc44ugsd01af80ks26idk3ibluu.apps.googleusercontent.com",
    webClientId: "52014612790-dds59pc44ugsd01af80ks26idk3ibluu.apps.googleusercontent.com",
  });

  // --- FACEBOOK CONFIGURATION (Proxy Fix) ---
  const [fRequest, fResponse, fPromptAsync] = Facebook.useAuthRequest({
    clientId: "1652831865939554",
    // Forces the use of the Expo proxy to resolve "No redirect present in URI" errors in development
    redirectUri: AuthSession.makeRedirectUri({
      useProxy: true,
    }),
  });

  // Handle Google Response
  useEffect(() => {
    if (gResponse?.type === "success") {
      const { authentication } = gResponse;
      handleSocialLogin("google", authentication?.accessToken);
    }
  }, [gResponse]);

  // Handle Facebook Response
  useEffect(() => {
    if (fResponse?.type === "success") {
      const { authentication } = fResponse;
      handleSocialLogin("facebook", authentication?.accessToken);
    }
  }, [fResponse]);

  const handleSocialLogin = async (provider: string, token?: string) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await socialLogin({ provider, token });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setErrorMsg(`${provider} login failed. Please try again.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      await socialLogin({
        provider: "apple",
        providerId: credential.user,
        email: credential.email || undefined,
        displayName: credential.fullName?.givenName || "Apple User",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      if (err.code !== "ERR_REQUEST_CANCELED") setErrorMsg("Apple sign-in failed.");
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill in all fields");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, displayName.trim());
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSocialButtons = () => (
    <View style={styles.socialSection}>
      {Platform.OS === "ios" && (
        <Pressable
          style={[styles.socialButton, { backgroundColor: isDark ? "#FFFFFF" : "#000000" }]}
          onPress={handleAppleLogin}
        >
          <Feather name="smartphone" size={20} color={isDark ? "#000000" : "#FFFFFF"} />
          <ThemedText type="bodyMedium" style={[styles.socialButtonText, { color: isDark ? "#000000" : "#FFFFFF" }]}>
            Continue with Apple
          </ThemedText>
        </Pressable>
      )}

      <Pressable
        style={[styles.socialButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border, borderWidth: 1 }]}
        onPress={() => gPromptAsync()}
        disabled={!gRequest || isSubmitting}
      >
        <View style={styles.googleIcon}><ThemedText type="bodyMedium" style={{ color: "#4285F4" }}>G</ThemedText></View>
        <ThemedText type="bodyMedium" style={styles.socialButtonText}>Continue with Google</ThemedText>
      </Pressable>

      <Pressable
        style={[styles.socialButton, { backgroundColor: "#1877F2" }]}
        onPress={() => fPromptAsync()}
        disabled={!fRequest || isSubmitting}
      >
        <Feather name="facebook" size={20} color="#FFFFFF" />
        <ThemedText type="bodyMedium" style={[styles.socialButtonText, { color: "#FFFFFF" }]}>Continue with Facebook</ThemedText>
      </Pressable>
    </View>
  );

  const renderDivider = () => (
    <View style={styles.dividerRow}>
      <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      <ThemedText type="small" style={{ color: theme.textSecondary, marginHorizontal: Spacing.lg }}>or</ThemedText>
      <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
    </View>
  );

  if (mode === "welcome") {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + Spacing["6xl"], paddingBottom: insets.bottom + Spacing["3xl"] }]}
      >
        <View style={styles.heroSection}>
          <Image source={appIcon} style={styles.appIcon} contentFit="contain" />
          <ThemedText type="hero" style={styles.heroTitle}>Kitch</ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", lineHeight: 24 }}>
            Turn social media food content into your personal cookbook
          </ThemedText>
        </View>

        <View style={styles.featureList}>
          {[{ icon: "link" as const, text: "Save recipes from Instagram & TikTok" }, { icon: "book-open" as const, text: "Build your personal cookbook" }, { icon: "mic" as const, text: "AI-powered recipe extraction" }].map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureIconWrap, { backgroundColor: KitchColors.primaryMuted }]}><Feather name={feature.icon} size={18} color={KitchColors.primary} /></View>
              <ThemedText type="body" style={{ flex: 1 }}>{feature.text}</ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.buttonGroup}>
          <Pressable style={[styles.primaryButton, { backgroundColor: KitchColors.primary }]} onPress={() => setMode("register")}>
            <ThemedText type="bodyMedium" style={{ color: "#FFFFFF" }}>Get Started</ThemedText>
          </Pressable>
          <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={() => setMode("login")}>
            <ThemedText type="bodyMedium">I already have an account</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing["3xl"] }]}
    >
      <Pressable style={styles.backButton} onPress={() => setMode("welcome")}><Feather name="arrow-left" size={24} color={theme.text} /></Pressable>
      <View style={styles.formHeader}>
        <ThemedText type="h2">{mode === "login" ? "Welcome back" : "Create account"}</ThemedText>
      </View>

      {renderSocialButtons()}
      {renderDivider()}

      {errorMsg ? (
        <View style={[styles.errorBanner, { backgroundColor: `${KitchColors.error}15` }]}>
          <Feather name="alert-circle" size={16} color={KitchColors.error} />
          <ThemedText type="small" style={{ color: KitchColors.error, marginLeft: Spacing.sm }}>{errorMsg}</ThemedText>
        </View>
      ) : null}

      <View style={styles.formFields}>
        {mode === "register" && (
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={theme.textSecondary}
          />
        )}
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={!showPassword}
        />
      </View>

      <Pressable
        style={[styles.primaryButton, { backgroundColor: KitchColors.primary, marginTop: Spacing.xl }]}
        onPress={handleEmailAuth}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText type="bodyMedium" style={{ color: "#FFFFFF" }}>{mode === "login" ? "Sign In" : "Create Account"}</ThemedText>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: Spacing.xl, flexGrow: 1 },
  heroSection: { alignItems: "center", marginBottom: Spacing["3xl"] },
  appIcon: { width: 88, height: 88, borderRadius: 22, marginBottom: Spacing.lg },
  heroTitle: { marginBottom: Spacing.sm, textAlign: "center" },
  featureList: { marginBottom: Spacing["2xl"], gap: Spacing.lg },
  featureRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  featureIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  buttonGroup: { gap: Spacing.md, marginTop: "auto" },
  primaryButton: { height: 52, borderRadius: BorderRadius.full, justifyContent: "center", alignItems: "center" },
  secondaryButton: { height: 52, borderRadius: BorderRadius.full, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  backButton: { width: 40, height: 40, justifyContent: "center", marginBottom: Spacing.lg },
  formHeader: { marginBottom: Spacing["2xl"] },
  socialSection: { gap: Spacing.md, marginBottom: Spacing.xl },
  socialButton: { height: 52, borderRadius: BorderRadius.full, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: Spacing.md },
  socialButtonText: { fontSize: 16 },
  googleIcon: { width: 24, height: 24, justifyContent: "center", alignItems: "center" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.xl },
  dividerLine: { flex: 1, height: 1 },
  errorBanner: { flexDirection: "row", alignItems: "center", padding: Spacing.md, borderRadius: BorderRadius.sm, marginBottom: Spacing.lg },
  formFields: { gap: Spacing.lg },
  input: { height: 52, borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.lg, fontSize: 16 },
});