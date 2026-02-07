                    import React, { useState, useEffect } from "react";
                    import {
                      StyleSheet,
                      View,
                      Pressable,
                      TextInput,
                      ActivityIndicator,
                      Platform,
                      Alert,
                      ScrollView,
                    } from "react-native";
                    import { useSafeAreaInsets } from "react-native-safe-area-context";
                    import { Feather } from "@expo/vector-icons";
                    import { Image } from "expo-image";
                    import * as Haptics from "expo-haptics";
                    import * as WebBrowser from "expo-web-browser";
                    import * as AppleAuthentication from "expo-apple-authentication";

                    import * as Linking from "expo-linking";

                    import { ThemedText } from "@/components/ThemedText";
                    import { useTheme } from "@/hooks/useTheme";
                    import { useAuth } from "@/hooks/useAuth";
                    import { getApiUrl } from "@/lib/query-client";
                    import { KitchColors, Spacing, BorderRadius } from "@/constants/theme";

                    WebBrowser.maybeCompleteAuthSession();

                    const appIcon = require("../../assets/images/icon.png");

                    const GOOGLE_WEB_CLIENT_ID = "52014612790-dds59pc44ugsd01af80ks26idk3ibluu.apps.googleusercontent.com";
                    const FB_CLIENT_ID = "1652831865939554";

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

                      const handleGoogleLogin = async () => {
                        setIsSubmitting(true);
                        setErrorMsg("");
                        try {
                          const apiBase = getApiUrl().replace(/\/$/, "");
                          const redirectUri = `${apiBase}/api/auth/google/callback`;
                          const authUrl =
                            `https://accounts.google.com/o/oauth2/v2/auth?` +
                            `client_id=${GOOGLE_WEB_CLIENT_ID}` +
                            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                            `&response_type=token` +
                            `&scope=${encodeURIComponent("openid email profile")}`;

                          const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
                          if (result.type === "success" && result.url) {
                            const urlObj = new URL(result.url);
                            const token = urlObj.searchParams.get("token");
                            const userJson = urlObj.searchParams.get("user");
                            if (token && userJson) {
                              const user = JSON.parse(decodeURIComponent(userJson));
                              await socialLogin({
                                provider: "google",
                                providerId: user.providerId || user.id?.toString(),
                                email: user.email,
                                displayName: user.displayName || user.email?.split("@")[0],
                                profileImage: user.profileImage,
                              });
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              return;
                            }
                            const hash = result.url.split("#")[1];
                            if (hash) {
                              const params = new URLSearchParams(hash);
                              const accessToken = params.get("access_token");
                              if (accessToken) {
                                await fetchGoogleProfile(accessToken);
                                return;
                              }
                            }
                            setErrorMsg("Google login failed. Please try again.");
                          }
                        } catch (err: any) {
                          setErrorMsg("Google login failed. Please try again.");
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        } finally {
                          setIsSubmitting(false);
                        }
                      };

                      const fetchGoogleProfile = async (accessToken: string) => {
                        setIsSubmitting(true);
                        try {
                          const apiBase = getApiUrl().replace(/\/$/, "");
                          const res = await fetch(`${apiBase}/api/auth/google/token`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ access_token: accessToken }),
                          });
                          const data = await res.json();
                          if (data.user && data.token) {
                            await socialLogin({
                              provider: "google",
                              providerId: data.user.providerId || data.user.id?.toString(),
                              email: data.user.email,
                              displayName: data.user.displayName || data.user.email?.split("@")[0],
                              profileImage: data.user.profileImage,
                            });
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          } else {
                            setErrorMsg(data.error || "Google login failed. Please try again.");
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                          }
                        } catch (err: any) {
                          setErrorMsg("Google login failed. Please try again.");
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        } finally {
                          setIsSubmitting(false);
                        }
                      };

                      const handleFacebookLogin = async () => {
                        setIsSubmitting(true);
                        try {
                          const redirectUri = Linking.createURL("auth/facebook");
                          const authUrl =
                            `https://www.facebook.com/v18.0/dialog/oauth?` +
                            `client_id=${FB_CLIENT_ID}` +
                            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                            `&response_type=token` +
                            `&scope=public_profile,email`;

                          const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
                          if (result.type === "success" && result.url) {
                            const hash = result.url.split("#")[1];
                            if (hash) {
                              const params = new URLSearchParams(hash);
                              const accessToken = params.get("access_token");
                              if (accessToken) {
                                await fetchFacebookProfile(accessToken);
                                return;
                              }
                            }
                            setErrorMsg("Facebook login failed. Please try again.");
                          }
                        } catch (err: any) {
                          setErrorMsg("Facebook login failed. Please try again.");
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        } finally {
                          setIsSubmitting(false);
                        }
                      };

                      const fetchFacebookProfile = async (accessToken: string) => {
                        setIsSubmitting(true);
                        try {
                          const res = await fetch(
                            `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`,
                          );
                          const profile = await res.json();
                          await socialLogin({
                            provider: "facebook",
                            providerId: profile.id,
                            email: profile.email || `fb_${profile.id}@facebook.com`,
                            displayName: profile.name || "Facebook User",
                            profileImage: profile.picture?.data?.url,
                          });
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (err: any) {
                          setErrorMsg("Facebook login failed. Please try again.");
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        } finally {
                          setIsSubmitting(false);
                        }
                      };

                      const handleEmailAuth = async () => {
                        if (!email.trim() || !password.trim()) {
                          setErrorMsg("Please fill in all fields");
                          return;
                        }
                        if (mode === "register" && !displayName.trim()) {
                          setErrorMsg("Please enter your name");
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
                          let msg = "Something went wrong. Please try again.";
                          try {
                            const parsed = JSON.parse(err.message);
                            if (parsed.error) msg = parsed.error;
                          } catch {
                            if (err.message) msg = err.message;
                          }
                          setErrorMsg(msg);
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

                          const appleEmail = credential.email || `apple_${credential.user}@privaterelay.appleid.com`;
                          const appleName = credential.fullName
                            ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(" ")
                            : undefined;

                          await socialLogin({
                            provider: "apple",
                            providerId: credential.user,
                            email: appleEmail,
                            displayName: appleName || "Apple User",
                          });
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (err: any) {
                          if (err.code !== "ERR_REQUEST_CANCELED") {
                            setErrorMsg("Apple sign-in failed. Please try again.");
                          }
                        }
                      };

                      const renderSocialButtons = () => (
                        <View style={styles.socialSection}>
                          {Platform.OS === "ios" ? (
                            <Pressable
                              testID="button-apple-login"
                              style={[styles.socialButton, { backgroundColor: isDark ? "#FFFFFF" : "#000000" }]}
                              onPress={handleAppleLogin}
                            >
                              <Feather name="smartphone" size={20} color={isDark ? "#000000" : "#FFFFFF"} />
                              <ThemedText
                                type="bodyMedium"
                                style={[styles.socialButtonText, { color: isDark ? "#000000" : "#FFFFFF" }]}
                              >
                                Continue with Apple
                              </ThemedText>
                            </Pressable>
                          ) : null}

                          <Pressable
                            testID="button-google-login"
                            style={[styles.socialButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border, borderWidth: 1 }]}
                            onPress={handleGoogleLogin}
                            disabled={isSubmitting}
                          >
                            <View style={styles.googleIcon}>
                              <ThemedText type="bodyMedium" style={{ color: "#4285F4", fontSize: 18 }}>G</ThemedText>
                            </View>
                            <ThemedText type="bodyMedium" style={styles.socialButtonText}>
                              Continue with Google
                            </ThemedText>
                          </Pressable>

                          <Pressable
                            testID="button-facebook-login"
                            style={[styles.socialButton, { backgroundColor: "#1877F2" }]}
                            onPress={handleFacebookLogin}
                            disabled={isSubmitting}
                          >
                            <Feather name="facebook" size={20} color="#FFFFFF" />
                            <ThemedText type="bodyMedium" style={[styles.socialButtonText, { color: "#FFFFFF" }]}>
                              Continue with Facebook
                            </ThemedText>
                          </Pressable>
                        </View>
                      );

                      const renderDivider = () => (
                        <View style={styles.dividerRow}>
                          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                          <ThemedText type="small" style={{ color: theme.textSecondary, marginHorizontal: Spacing.lg }}>
                            or
                          </ThemedText>
                          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                        </View>
                      );

                      if (mode === "welcome") {
                        return (
                          <ScrollView
                            style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
                            contentContainerStyle={[
                              styles.contentContainer,
                              { paddingTop: insets.top + Spacing["6xl"], paddingBottom: insets.bottom + Spacing["3xl"] },
                            ]}
                          >
                            <View style={styles.heroSection}>
                              <Image source={appIcon} style={styles.appIcon} contentFit="contain" />
                              <ThemedText type="hero" style={styles.heroTitle}>
                                Kitch
                              </ThemedText>
                              <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", lineHeight: 24 }}>
                                Turn social media food content into your personal cookbook
                              </ThemedText>
                            </View>

                            <View style={styles.featureList}>
                              {[
                                { icon: "link" as const, text: "Save recipes from Instagram & TikTok" },
                                { icon: "book-open" as const, text: "Build your personal cookbook" },
                                { icon: "mic" as const, text: "AI-powered recipe extraction" },
                              ].map((feature, i) => (
                                <View key={i} style={styles.featureRow}>
                                  <View style={[styles.featureIconWrap, { backgroundColor: KitchColors.primaryMuted }]}>
                                    <Feather name={feature.icon} size={18} color={KitchColors.primary} />
                                  </View>
                                  <ThemedText type="body" style={{ flex: 1 }}>
                                    {feature.text}
                                  </ThemedText>
                                </View>
                              ))}
                            </View>

                            <View style={styles.trialBadge}>
                              <Feather name="gift" size={16} color={KitchColors.accent} />
                              <ThemedText type="bodyMedium" style={{ color: KitchColors.accent, marginLeft: Spacing.sm }}>
                                Start your 30-day free trial
                              </ThemedText>
                            </View>

                            <View style={styles.buttonGroup}>
                              <Pressable
                                testID="button-get-started"
                                style={[styles.primaryButton, { backgroundColor: KitchColors.primary }]}
                                onPress={() => { setMode("register"); setErrorMsg(""); }}
                              >
                                <ThemedText type="bodyMedium" style={{ color: "#FFFFFF" }}>
                                  Get Started
                                </ThemedText>
                              </Pressable>

                              <Pressable
                                testID="button-sign-in"
                                style={[styles.secondaryButton, { borderColor: theme.border }]}
                                onPress={() => { setMode("login"); setErrorMsg(""); }}
                              >
                                <ThemedText type="bodyMedium">
                                  I already have an account
                                </ThemedText>
                              </Pressable>
                            </View>
                          </ScrollView>
                        );
                      }

                      return (
                        <ScrollView
                          style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
                          contentContainerStyle={[
                            styles.contentContainer,
                            { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing["3xl"] },
                          ]}
                          keyboardShouldPersistTaps="handled"
                        >
                          <Pressable
                            testID="button-back"
                            style={styles.backButton}
                            onPress={() => { setMode("welcome"); setErrorMsg(""); }}
                          >
                            <Feather name="arrow-left" size={24} color={theme.text} />
                          </Pressable>

                          <View style={styles.formHeader}>
                            <ThemedText type="h2">
                              {mode === "login" ? "Welcome back" : "Create account"}
                            </ThemedText>
                            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                              {mode === "login"
                                ? "Sign in to access your recipes"
                                : "Start your 30-day free trial"}
                            </ThemedText>
                          </View>

                          {renderSocialButtons()}
                          {renderDivider()}

                          {errorMsg.length > 0 ? (
                            <View style={[styles.errorBanner, { backgroundColor: `${KitchColors.error}15` }]}>
                              <Feather name="alert-circle" size={16} color={KitchColors.error} />
                              <ThemedText type="small" style={{ color: KitchColors.error, marginLeft: Spacing.sm, flex: 1 }}>
                                {errorMsg}
                              </ThemedText>
                            </View>
                          ) : null}

                          <View style={styles.formFields}>
                            {mode === "register" ? (
                              <View>
                                <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                  Name
                                </ThemedText>
                                <TextInput
                                  testID="input-name"
                                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                                  value={displayName}
                                  onChangeText={setDisplayName}
                                  placeholder="Your name"
                                  placeholderTextColor={theme.textSecondary}
                                  autoCapitalize="words"
                                  autoComplete="name"
                                />
                              </View>
                            ) : null}

                            <View>
                              <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                Email
                              </ThemedText>
                              <TextInput
                                testID="input-email"
                                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="your@email.com"
                                placeholderTextColor={theme.textSecondary}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                              />
                            </View>

                            <View>
                              <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                Password
                              </ThemedText>
                              <View style={styles.passwordWrap}>
                                <TextInput
                                  testID="input-password"
                                  style={[styles.input, styles.passwordInput, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                                  value={password}
                                  onChangeText={setPassword}
                                  placeholder={mode === "register" ? "Min. 6 characters" : "Enter password"}
                                  placeholderTextColor={theme.textSecondary}
                                  secureTextEntry={!showPassword}
                                  autoCapitalize="none"
                                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                                />
                                <Pressable
                                  style={styles.eyeButton}
                                  onPress={() => setShowPassword(!showPassword)}
                                >
                                  <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={theme.textSecondary} />
                                </Pressable>
                              </View>
                            </View>
                          </View>

                          <Pressable
                            testID="button-submit"
                            style={[styles.primaryButton, { backgroundColor: KitchColors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
                            onPress={handleEmailAuth}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                              <ThemedText type="bodyMedium" style={{ color: "#FFFFFF" }}>
                                {mode === "login" ? "Sign In" : "Create Account"}
                              </ThemedText>
                            )}
                          </Pressable>

                          <Pressable
                            testID="button-switch-mode"
                            style={styles.switchModeButton}
                            onPress={() => {
                              setMode(mode === "login" ? "register" : "login");
                              setErrorMsg("");
                            }}
                          >
                            <ThemedText type="small" style={{ color: theme.textSecondary }}>
                              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                            </ThemedText>
                            <ThemedText type="small" style={{ color: KitchColors.primary, fontWeight: "600" }}>
                              {mode === "login" ? "Sign Up" : "Sign In"}
                            </ThemedText>
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
                      trialBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: Spacing["3xl"], paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, alignSelf: "center", borderRadius: BorderRadius.full, backgroundColor: "rgba(232, 168, 56, 0.12)" },
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
                      formFields: { gap: Spacing.lg, marginBottom: Spacing.xl },
                      inputLabel: { marginBottom: Spacing.xs, marginLeft: Spacing.xs, fontWeight: "500" },
                      input: { height: 52, borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.lg, fontSize: 16, fontFamily: "Inter_400Regular" },
                      passwordWrap: { position: "relative" },
                      passwordInput: { paddingRight: 52 },
                      eyeButton: { position: "absolute", right: 0, top: 0, height: 52, width: 52, justifyContent: "center", alignItems: "center" },
                      switchModeButton: { flexDirection: "row", justifyContent: "center", marginTop: Spacing.xl, paddingVertical: Spacing.md },
                    });