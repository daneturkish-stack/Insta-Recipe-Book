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
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' // Soft off-white background per brief
  },
  // New: Masonry Collage Header Logic
  heroSection: { 
    height: '45%', 
    width: '100%',
    flexDirection: 'row',
    padding: 4,
    backgroundColor: '#E5E7EB'
  },
  collageColumn: {
    flex: 1,
    gap: 4,
    padding: 2
  },
  collageImage: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#D1D5DB'
  },
  // The Login Card that overlaps the collage
  contentContainer: { 
    flex: 1,
    marginTop: -40, // Creating that premium overlap effect
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    // Adding the soft shadow from your design system
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10
  },
  appIcon: { 
    width: 80, 
    height: 80, 
    borderRadius: 24, // Matches 24px card radius brief
    marginBottom: Spacing.lg,
    alignSelf: 'center',
    // Elevated floating effect
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  heroTitle: { 
    marginBottom: Spacing.sm, 
    textAlign: "center",
    letterSpacing: -0.5 // Editorial feel
  },
  featureList: { 
    marginBottom: Spacing["2xl"], 
    gap: Spacing.md 
  },
  featureRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: Spacing.md,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 16
  },
  featureIconWrap: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: '#10B98115' // Light Emerald tint
  },
  buttonGroup: { 
    gap: Spacing.md, 
    marginTop: 'auto',
    paddingBottom: Spacing.xl 
  },
  primaryButton: { 
    height: 56, // Increased for better touch target
    borderRadius: 9999, // Perfect pill shape per brief
    backgroundColor: '#10B981', // Emerald Green
    justifyContent: "center", 
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  secondaryButton: { 
    height: 56, 
    borderRadius: 9999, 
    justifyContent: "center", 
    alignItems: "center", 
    borderWidth: 1.5,
    borderColor: '#E5E7EB'
  },
  socialSection: { 
    gap: Spacing.md, 
    marginBottom: Spacing.xl 
  },
  socialButton: { 
    height: 52, 
    borderRadius: 9999, 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center", 
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF'
  },
  socialButtonText: { 
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937'
  },
  dividerRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: Spacing.xl,
    opacity: 0.5
  },
  dividerLine: { 
    flex: 1, 
    height: 1,
    backgroundColor: '#E5E7EB'
  },
  input: { 
    height: 56, 
    borderRadius: 16,
    borderWidth: 1.5, 
    borderColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: Spacing.lg, 
    fontSize: 16,
    color: '#1F2937'
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  formHeader: {
    marginBottom: Spacing.xl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.lg,
  },
  formFields: {
    gap: Spacing.md,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});