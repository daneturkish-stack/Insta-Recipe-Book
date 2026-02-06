import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  FadeIn,
} from "react-native-reanimated";
import { Audio } from "expo-av";
import { File } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { KitchColors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useRecipes } from "@/hooks/useRecipes";
import { getApiUrl } from "@/lib/query-client";
import { usePreferences } from "@/hooks/usePreferences";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WORDS_PER_SECOND = 3.2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TypewriterText({
  text,
  isAnimating,
  revealedCount,
  highlightColor,
  textColor,
}: {
  text: string;
  isAnimating: boolean;
  revealedCount: number;
  highlightColor: string;
  textColor: string;
}) {
  if (!isAnimating) {
    return <Text style={[styles.messageText, { color: textColor }]}>{text}</Text>;
  }

  const words = text.split(/(\s+)/);
  let wordIndex = 0;

  return (
    <Text style={[styles.messageText, { color: textColor }]}>
      {words.map((segment, i) => {
        if (/^\s+$/.test(segment)) {
          const prevWordIndex = wordIndex;
          return prevWordIndex <= revealedCount ? (
            <Text key={i}>{segment}</Text>
          ) : null;
        }

        wordIndex++;
        const currentWordIndex = wordIndex;

        if (currentWordIndex > revealedCount) return null;

        const isLatest = currentWordIndex === revealedCount;

        return (
          <Text
            key={i}
            style={
              isLatest
                ? { color: highlightColor, fontFamily: "Inter_600SemiBold" }
                : undefined
            }
          >
            {segment}
          </Text>
        );
      })}
    </Text>
  );
}

interface TipItem {
  icon: string;
  iconFamily: "feather" | "mci";
  title: string;
  description: string;
}

const TIPS: { section: string; items: TipItem[] }[] = [
  {
    section: "Saving Recipes",
    items: [
      {
        icon: "link",
        iconFamily: "feather",
        title: "Paste a Link",
        description:
          "Go to the Add tab and paste an Instagram Reel or TikTok link. Kitch will use AI to extract the full recipe for you automatically.",
      },
      {
        icon: "alert-circle",
        iconFamily: "feather",
        title: "Recipe Not Quite Right?",
        description:
          "Each recipe shows an accuracy badge (High, Medium, or Low). If something looks off, check the source info — you can tap through to the original post or the creator's website.",
      },
    ],
  },
  {
    section: "Gesture Shortcuts",
    items: [
      {
        icon: "gesture-swipe-right",
        iconFamily: "mci",
        title: "Swipe Right to Cook",
        description:
          "On any recipe card in your collection, swipe right to jump straight into Cook Mode with step-by-step guidance.",
      },
      {
        icon: "cellphone-vibrate",
        iconFamily: "mci",
        title: "Shake for Recipe Roulette",
        description:
          "Can't decide what to make? Give your phone a shake on the Collection screen and Kitch will pick a recipe for you — prioritising ones you can make with your pantry.",
      },
      {
        icon: "gesture-pinch",
        iconFamily: "mci",
        title: "Pinch to Scale Ingredients",
        description:
          "On a recipe's detail page, pinch in or out on the ingredients section to scale the servings up or down. You can also use the +/- buttons.",
      },
    ],
  },
  {
    section: "Pantry & Matching",
    items: [
      {
        icon: "shopping-bag",
        iconFamily: "feather",
        title: "Add Pantry Items",
        description:
          "Head to the Pantry tab and add what you have at home. Kitch will match your ingredients to your saved recipes and show you what you can make.",
      },
      {
        icon: "mic",
        iconFamily: "feather",
        title: "Voice Input",
        description:
          "Tap the microphone in the Pantry tab and speak your ingredients aloud — Kitch will parse and categorise them automatically. Great when you're unloading shopping!",
      },
    ],
  },
  {
    section: "Cooking with Kitch",
    items: [
      {
        icon: "play-circle",
        iconFamily: "feather",
        title: "Cook Mode",
        description:
          "Tap 'Start Cooking' on any recipe to enter full-screen Cook Mode. It reads each step aloud so you can keep your hands free.",
      },
      {
        icon: "message-circle",
        iconFamily: "feather",
        title: "Ask Remi",
        description:
          "That's me! Ask me for recipe suggestions, substitutions, technique tips, or just have a chat about food. I know about all your saved recipes too.",
      },
    ],
  },
];

function TipsModal({
  visible,
  onClose,
  theme,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  theme: any;
  isDark: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[tipsStyles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View
          style={[
            tipsStyles.header,
            {
              paddingTop: insets.top + Spacing.sm,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View style={tipsStyles.headerLeft}>
            <View style={[tipsStyles.headerIcon, { backgroundColor: KitchColors.accent }]}>
              <Feather name="book-open" size={20} color="#FFF" />
            </View>
            <Text style={[tipsStyles.headerTitle, { color: theme.text }]}>
              Tips & Tricks
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} testID="tips-close-button">
            <Feather name="x" size={24} color={theme.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            tipsStyles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[tipsStyles.intro, { color: theme.textSecondary }]}>
            Here are some handy ways to get the most out of Kitch.
          </Text>

          {TIPS.map((section) => (
            <View key={section.section} style={tipsStyles.section}>
              <Text style={[tipsStyles.sectionTitle, { color: theme.text }]}>
                {section.section}
              </Text>
              {section.items.map((tip) => (
                <View
                  key={tip.title}
                  style={[
                    tipsStyles.tipCard,
                    {
                      backgroundColor: isDark
                        ? theme.backgroundDefault
                        : KitchColors.neutral,
                    },
                  ]}
                >
                  <View
                    style={[
                      tipsStyles.tipIconWrap,
                      { backgroundColor: theme.primary + "18" },
                    ]}
                  >
                    {tip.iconFamily === "feather" ? (
                      <Feather
                        name={tip.icon as any}
                        size={18}
                        color={theme.primary}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={tip.icon as any}
                        size={18}
                        color={theme.primary}
                      />
                    )}
                  </View>
                  <View style={tipsStyles.tipTextWrap}>
                    <Text style={[tipsStyles.tipTitle, { color: theme.text }]}>
                      {tip.title}
                    </Text>
                    <Text
                      style={[
                        tipsStyles.tipDescription,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {tip.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function RemiScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { data: recipes } = useRecipes();
  const { ttsVoice, dietaryPreferences } = usePreferences();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi there, I'm Remi. I'm here to help with anything food and cooking \u2014 whether it's figuring out what to make tonight, working through a tricky recipe, or just chatting about food. What can I help with?",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const [animatingMessageId, setAnimatingMessageId] = useState<string | null>("welcome");
  const [revealedWords, setRevealedWords] = useState(0);
  const animationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingSpeakRef = useRef<{ messageId: string; text: string } | null>(null);
  const audioPlayStartedRef = useRef(false);

  const getWordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

  const startTypewriter = useCallback(
    (messageId: string, text: string, speakSync: boolean = false) => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
      setAnimatingMessageId(messageId);
      setRevealedWords(0);

      const totalWords = getWordCount(text);
      const intervalMs = speakSync
        ? 1000 / WORDS_PER_SECOND
        : Math.max(30, Math.min(80, 2000 / totalWords));

      let count = 0;
      animationTimerRef.current = setInterval(() => {
        count++;
        setRevealedWords(count);
        if (count >= totalWords) {
          if (animationTimerRef.current) {
            clearInterval(animationTimerRef.current);
            animationTimerRef.current = null;
          }
          setAnimatingMessageId(null);
        }
      }, intervalMs);
    },
    []
  );

  useEffect(() => {
    startTypewriter("welcome", messages[0].content, false);
    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, []);

  const micScale = useSharedValue(1);

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  useEffect(() => {
    if (isRecording) {
      micScale.value = withSequence(
        withTiming(1.2, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
      const interval = setInterval(() => {
        micScale.value = withSequence(
          withTiming(1.2, { duration: 300 }),
          withTiming(1, { duration: 300 })
        );
      }, 600);
      return () => clearInterval(interval);
    } else {
      micScale.value = withSpring(1);
    }
  }, [isRecording]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText("");
      setIsLoading(true);

      try {
        const conversationHistory = messages
          .filter((m) => m.id !== "welcome")
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const response = await fetch(
          new URL("/api/remy/chat", getApiUrl()).toString(),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: text.trim(),
              conversationHistory,
              allRecipes: recipes || [],
              dietaryPreferences,
            }),
          }
        );

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        startTypewriter(assistantMessage.id, data.reply, false);
      } catch (error: any) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Oh no, something went a bit wonky there! Give it another go for me?",
        };
        setMessages((prev) => [...prev, errorMessage]);
        startTypewriter(errorMessage.id, errorMessage.content, false);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, recipes, dietaryPreferences, startTypewriter]
  );

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsLoading(true);

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) throw new Error("No recording URI");

      const audioFile = new File(uri);
      const base64Audio = await audioFile.base64();

      const response = await fetch(
        new URL("/api/remy/transcribe", getApiUrl()).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64Audio }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.text) {
        setIsLoading(false);
        await sendMessage(data.text);
      }
    } catch (error) {
      console.error("Failed to transcribe:", error);
      setIsLoading(false);
    }
  };

  const speakMessage = async (messageId: string, text: string) => {
    Haptics.selectionAsync();

    if (isSpeaking && speakingMessageId === messageId) {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
      setAnimatingMessageId(null);
      setRevealedWords(getWordCount(text));
      pendingSpeakRef.current = null;
      return;
    }

    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    setIsSpeaking(true);
    setSpeakingMessageId(messageId);
    setAnimatingMessageId(messageId);
    setRevealedWords(0);
    pendingSpeakRef.current = { messageId, text };
    audioPlayStartedRef.current = false;

    try {
      const response = await fetch(
        new URL("/api/remy/speak", getApiUrl()).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: ttsVoice }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate speech");

      const { audio } = await response.json();
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${audio}` },
        { shouldPlay: true }
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.isPlaying && !audioPlayStartedRef.current) {
            audioPlayStartedRef.current = true;
            const pending = pendingSpeakRef.current;
            if (pending) {
              const totalWords = getWordCount(pending.text);
              const durationMs = status.durationMillis || totalWords * (1000 / WORDS_PER_SECOND);
              const intervalMs = durationMs / totalWords;

              let count = 0;
              if (animationTimerRef.current) {
                clearInterval(animationTimerRef.current);
              }
              animationTimerRef.current = setInterval(() => {
                count++;
                setRevealedWords(count);
                if (count >= totalWords) {
                  if (animationTimerRef.current) {
                    clearInterval(animationTimerRef.current);
                    animationTimerRef.current = null;
                  }
                }
              }, intervalMs);
            }
          }

          if (status.didJustFinish) {
            setIsSpeaking(false);
            setSpeakingMessageId(null);
            if (animationTimerRef.current) {
              clearInterval(animationTimerRef.current);
              animationTimerRef.current = null;
            }
            setAnimatingMessageId(null);
            pendingSpeakRef.current = null;
            sound.unloadAsync();
            soundRef.current = null;
          }
        }
      });
    } catch (error) {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
      setAnimatingMessageId(null);
      pendingSpeakRef.current = null;
    }
  };

  const speakLatestMessage = () => {
    const latestAssistantMessage = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (latestAssistantMessage) {
      speakMessage(latestAssistantMessage.id, latestAssistantMessage.content);
    }
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync();
        soundRef.current.unloadAsync();
      }
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, []);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    const isAnimating = animatingMessageId === item.id;

    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.assistantRow,
        ]}
      >
        {!isUser ? (
          <View
            style={[styles.remyAvatar, { backgroundColor: theme.primary }]}
          >
            <MaterialCommunityIcons name="chef-hat" size={14} color="#FFF" />
          </View>
        ) : null}
        <View
          style={[
            styles.messageContent,
            isUser
              ? [styles.userContent, { backgroundColor: theme.primary }]
              : styles.assistantContent,
          ]}
        >
          {isUser ? (
            <Text style={[styles.messageText, styles.userText]}>
              {item.content}
            </Text>
          ) : (
            <TypewriterText
              text={item.content}
              isAnimating={isAnimating}
              revealedCount={
                isAnimating ? revealedWords : getWordCount(item.content)
              }
              highlightColor={theme.primary}
              textColor={theme.text}
            />
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.sm,
            backgroundColor: theme.backgroundRoot,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.remyIcon, { backgroundColor: theme.primary }]}>
            <MaterialCommunityIcons name="chef-hat" size={22} color="#FFF" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Remi
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: theme.textSecondary }]}
            >
              Your kitchen companion
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowTips(true)}
            style={[
              styles.headerButton,
              {
                backgroundColor: isDark
                  ? theme.backgroundDefault
                  : KitchColors.neutral,
              },
            ]}
            hitSlop={8}
            testID="remi-tips-button"
          >
            <Feather
              name="book-open"
              size={18}
              color={theme.textSecondary}
            />
          </Pressable>
          <Pressable
            onPress={speakLatestMessage}
            style={[
              styles.headerButton,
              {
                backgroundColor: isDark
                  ? theme.backgroundDefault
                  : KitchColors.neutral,
              },
              isSpeaking
                ? { backgroundColor: theme.primary + "20" }
                : undefined,
            ]}
            hitSlop={8}
            testID="remi-play-button"
          >
            <Feather
              name={isSpeaking ? "volume-x" : "volume-2"}
              size={20}
              color={isSpeaking ? theme.primary : theme.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages.toReversed()}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted={messages.length > 0}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                Ask me anything about cooking!
              </Text>
            </View>
          }
          onContentSizeChange={() => {
            if (messages.length > 1) {
              flatListRef.current?.scrollToOffset({
                offset: 0,
                animated: true,
              });
            }
          }}
        />

        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: tabBarHeight + Spacing.sm,
              backgroundColor: theme.backgroundRoot,
              borderTopColor: theme.border,
            },
          ]}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: isDark
                    ? theme.backgroundDefault
                    : KitchColors.neutral,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Ask Remi anything..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading && !isRecording}
              testID="remi-input"
            />

            <AnimatedPressable
              style={[
                styles.micButton,
                {
                  backgroundColor: isDark
                    ? theme.backgroundDefault
                    : KitchColors.neutral,
                  borderColor: theme.border,
                },
                micAnimatedStyle,
              ]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              disabled={isLoading}
              testID="remi-mic-button"
            >
              <Feather
                name="mic"
                size={20}
                color={isRecording ? KitchColors.error : theme.primary}
              />
            </AnimatedPressable>

            <Pressable
              style={[
                styles.sendButton,
                { backgroundColor: theme.primary },
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
              testID="remi-send-button"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Feather name="send" size={18} color="#FFF" />
              )}
            </Pressable>
          </View>

          {isRecording ? (
            <Animated.View entering={FadeIn} style={styles.recordingHint}>
              <View style={styles.recordingDot} />
              <Text
                style={[styles.recordingText, { color: KitchColors.error }]}
              >
                Listening... Release to send
              </Text>
            </Animated.View>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <TipsModal
        visible={showTips}
        onClose={() => setShowTips(false)}
        theme={theme}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  remyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.h3,
  },
  headerSubtitle: {
    ...Typography.caption,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    maxWidth: "88%",
  },
  userRow: {
    alignSelf: "flex-end",
  },
  assistantRow: {
    alignSelf: "flex-start",
    gap: Spacing.sm,
    alignItems: "flex-start",
  },
  remyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  messageContent: {
    flex: 1,
  },
  userContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  assistantContent: {
    paddingVertical: 2,
  },
  messageText: {
    fontSize: 17,
    lineHeight: 26,
    fontFamily: "Inter_400Regular",
  },
  userText: {
    color: "#FFF",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyText: {
    ...Typography.body,
  },
  inputContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
    borderWidth: 1,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: KitchColors.textSecondary,
  },
  recordingHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KitchColors.error,
  },
  recordingText: {
    ...Typography.caption,
  },
});

const tipsStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.h3,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  intro: {
    ...Typography.body,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  tipCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  tipDescription: {
    ...Typography.small,
    lineHeight: 20,
  },
});
