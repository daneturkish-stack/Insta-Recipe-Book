import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { Recipe } from "@/types/recipe";
import { getApiUrl } from "@/lib/query-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface RemyChatProps {
  visible: boolean;
  onClose: () => void;
  currentRecipe?: Recipe | null;
  allRecipes?: Recipe[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RemyChat({
  visible,
  onClose,
  currentRecipe,
  allRecipes,
}: RemyChatProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: currentRecipe
        ? `Hey! I'm Remi. I see you're checking out "${currentRecipe.title}" — feel free to ask me anything about it, or we can just chat about food!`
        : "Hey! I'm Remi. Ask me anything about cooking, your saved recipes, or just food in general — I love talking about it all!",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

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
              currentRecipe,
              allRecipes,
            }),
          }
        );

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: data.reply,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        
      } catch (error: any) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Oops! I had a little hiccup. Could you try asking again?",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, currentRecipe, allRecipes]
  );

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        return;
      }

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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        throw new Error("No recording URI");
      }

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

      if (data.error) {
        throw new Error(data.error);
      }

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
      return;
    }

    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    setIsSpeaking(true);
    setSpeakingMessageId(messageId);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(new URL("/api/remy/speak", apiUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "nova" }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const { audio } = await response.json();
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${audio}` },
        { shouldPlay: true }
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  const speakLatestMessage = () => {
    const latestAssistantMessage = [...messages].reverse().find(m => m.role === "assistant");
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
    };
  }, []);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    const isCurrentlySpeaking = isSpeaking && speakingMessageId === item.id;

    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {!isUser && (
          <View style={styles.remyAvatar}>
            <Text style={styles.remyAvatarText}>R</Text>
          </View>
        )}
        <View
          style={[
            styles.messageContent,
            isUser ? styles.userContent : styles.assistantContent,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.assistantText,
            ]}
          >
            {item.content}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.remyIcon}>
              <MaterialCommunityIcons name="chef-hat" size={22} color="#FFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Remi</Text>
              <Text style={styles.headerSubtitle}>Your cooking assistant</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={speakLatestMessage}
              style={[styles.playButton, isSpeaking && styles.playButtonActive]}
              hitSlop={8}
              testID="remy-play-button"
            >
              <Feather 
                name={isSpeaking ? "volume-x" : "volume-2"} 
                size={20} 
                color={isSpeaking ? KitchColors.primary : KitchColors.textSecondary} 
              />
            </Pressable>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={12}
              testID="remy-close-button"
            >
              <Feather name="x" size={24} color={KitchColors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages.toReversed()}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            inverted={messages.length > 0}
            contentContainerStyle={[
              styles.messagesList,
              { paddingBottom: insets.bottom + 80 },
            ]}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
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
            style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}
          >
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Ask Remi anything..."
                placeholderTextColor={KitchColors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isLoading && !isRecording}
                testID="remy-input"
              />

              <AnimatedPressable
                style={[styles.micButton, micAnimatedStyle]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                disabled={isLoading}
                testID="remy-mic-button"
              >
                <Feather
                  name="mic"
                  size={20}
                  color={isRecording ? KitchColors.error : KitchColors.primary}
                />
              </AnimatedPressable>

              <Pressable
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                ]}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
                testID="remy-send-button"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={KitchColors.background} />
                ) : (
                  <Feather name="send" size={18} color={KitchColors.background} />
                )}
              </Pressable>
            </View>

            {isRecording && (
              <Animated.View entering={FadeIn} style={styles.recordingHint}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  Listening... Release to send
                </Text>
              </Animated.View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function RemyFloatingButton({
  onPress,
  testID,
}: {
  onPress: () => void;
  testID?: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.floatingButton, animatedStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.9);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      onPress={onPress}
      testID={testID || "remy-floating-button"}
    >
      <View style={styles.floatingButtonInner}>
        <MaterialCommunityIcons name="chef-hat" size={28} color="#FFF" />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KitchColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: KitchColors.border,
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
    backgroundColor: KitchColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  remyIconText: {
    ...Typography.h2,
    color: KitchColors.background,
    fontSize: 20,
  },
  headerTitle: {
    ...Typography.h3,
    color: KitchColors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: KitchColors.textSecondary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  playButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: KitchColors.neutral,
    marginRight: Spacing.xs,
  },
  playButtonActive: {
    backgroundColor: KitchColors.primary + "20",
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  messageBubble: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    maxWidth: "85%",
  },
  userBubble: {
    alignSelf: "flex-end",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    gap: Spacing.xs,
  },
  remyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: KitchColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  remyAvatarText: {
    ...Typography.small,
    color: KitchColors.background,
    fontWeight: "700",
  },
  messageContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  userContent: {
    backgroundColor: KitchColors.primary,
  },
  assistantContent: {
    backgroundColor: KitchColors.neutral,
    borderWidth: 1,
    borderColor: KitchColors.border,
  },
  messageText: {
    ...Typography.body,
    lineHeight: 22,
  },
  userText: {
    color: KitchColors.textPrimary,
  },
  assistantText: {
    color: KitchColors.textPrimary,
  },
  speakButton: {
    marginTop: Spacing.xs,
    alignSelf: "flex-end",
    padding: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyText: {
    ...Typography.body,
    color: KitchColors.textSecondary,
  },
  inputContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: KitchColors.border,
    backgroundColor: KitchColors.background,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: KitchColors.textPrimary,
    backgroundColor: KitchColors.neutral,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: KitchColors.border,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: KitchColors.neutral,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: KitchColors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: KitchColors.primary,
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
    color: KitchColors.error,
  },
  floatingButton: {
    position: "absolute",
    bottom: 170,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: KitchColors.primary,
    shadowColor: KitchColors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingButtonText: {
    ...Typography.h2,
    color: KitchColors.textPrimary,
    fontSize: 24,
  },
});
