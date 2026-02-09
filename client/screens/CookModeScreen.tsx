import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View, Pressable, Dimensions, StatusBar, ScrollView, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import Animated, { FadeIn, SlideInRight, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, cancelAnimation } from "react-native-reanimated";
import YoutubePlayer from "react-native-youtube-iframe";
import { File } from "expo-file-system";

import { ThemedText } from "@/components/ThemedText";
import { useRecipe } from "@/hooks/useRecipes";
import { CookModeColors, CookModeTypography, Spacing } from "@/constants/theme";
import { Ingredient, InstructionStep } from "@/types/recipe";
import { getApiUrl } from "@/lib/query-client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function getInstructionText(instruction: string | InstructionStep): string {
  if (typeof instruction === "string") return instruction;
  return instruction.text;
}

function getInstructionTimestamp(instruction: string | InstructionStep): number | undefined {
  if (typeof instruction === "object" && instruction.timestamp !== undefined) {
    return instruction.timestamp;
  }
  return undefined;
}

function getStepIngredients(instruction: string | InstructionStep, ingredients: Ingredient[]): Ingredient[] {
  const text = getInstructionText(instruction);
  if (!text || !ingredients) return [];
  const lowerInstruction = text.toLowerCase();
  return ingredients.filter((ingredient) => {
    const name = ingredient.name.toLowerCase();
    const words = name.split(/\s+/);
    if (words.length > 1) {
      return words.some((word) => word.length > 2 && lowerInstruction.includes(word));
    }
    return lowerInstruction.includes(name);
  });
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function parseTimeMentions(text: string): { amount: number; unit: string; totalSeconds: number }[] {
  const results: { amount: number; unit: string; totalSeconds: number }[] = [];
  const pattern = /(\d+)\s*(min(?:ute)?s?|hour?s?|hr?s?|sec(?:ond)?s?)/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const amount = parseInt(match[1], 10);
    const unitRaw = match[2].toLowerCase();
    let unit = "minutes";
    let totalSeconds = 0;
    if (unitRaw.startsWith("sec")) {
      unit = "seconds";
      totalSeconds = amount;
    } else if (unitRaw.startsWith("h")) {
      unit = "hours";
      totalSeconds = amount * 3600;
    } else {
      unit = "minutes";
      totalSeconds = amount * 60;
    }
    results.push({ amount, unit, totalSeconds });
  }
  return results;
}

type VoiceState = "off" | "listening" | "processing" | "speaking";

export default function CookModeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { recipeId } = route.params;

  const recipe = useRecipe(recipeId);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const playerRef = useRef<any>(null);
  const timerIntervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const [voiceState, setVoiceState] = useState<VoiceState>("off");
  const [voiceStatusText, setVoiceStatusText] = useState("");
  const recordingRef = useRef<Audio.Recording | null>(null);
  const voiceActiveRef = useRef(false);
  const conversationHistoryRef = useRef<{ role: string; content: string }[]>([]);
  const maxRecordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  const totalSteps = recipe?.instructions?.length || 0;

  const currentInstructionText = useMemo(() => {
    if (!recipe?.instructions?.[currentStep]) return "";
    return getInstructionText(recipe.instructions[currentStep]);
  }, [recipe, currentStep]);

  const stepIngredients = useMemo(() => {
    if (!recipe?.instructions?.[currentStep] || !recipe?.ingredients) return [];
    return getStepIngredients(recipe.instructions[currentStep], recipe.ingredients);
  }, [recipe, currentStep]);

  const timeMentions = useMemo(() => {
    return parseTimeMentions(currentInstructionText);
  }, [currentInstructionText]);

  const hasYouTubeVideo = useMemo(() => {
    return recipe?.platform === "youtube" && recipe?.videoUrl && extractYouTubeId(recipe.videoUrl);
  }, [recipe]);

  const youtubeVideoId = useMemo(() => {
    if (!recipe?.videoUrl) return null;
    return extractYouTubeId(recipe.videoUrl);
  }, [recipe?.videoUrl]);

  useEffect(() => {
    if (hasYouTubeVideo && playerRef.current) {
      const instruction = recipe?.instructions?.[currentStep];
      if (instruction) {
        const timestamp = getInstructionTimestamp(instruction);
        if (timestamp !== undefined) {
          playerRef.current.seekTo(timestamp, true);
        }
      }
    }
  }, [currentStep, hasYouTubeVideo, recipe]);

  useEffect(() => {
    if (voiceState === "listening") {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        true
      );
    } else if (voiceState === "processing") {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        true
      );
      pulseOpacity.value = withTiming(0.6, { duration: 200 });
    } else if (voiceState === "speaking") {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 500 }),
          withTiming(1.05, { duration: 500 })
        ),
        -1,
        true
      );
      pulseOpacity.value = withTiming(0.7, { duration: 200 });
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [voiceState]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const speakRemiResponse = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      setVoiceState("speaking");
      setVoiceStatusText("Remi is speaking...");
      Speech.speak(text, {
        rate: 0.88,
        pitch: 1.1,
        language: "en-GB",
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(),
      });
    });
  }, []);

  const sendToRemi = useCallback(async (userMessage: string): Promise<string> => {
    const baseUrl = getApiUrl();
    const url = new URL("/api/remy/chat", baseUrl);

    const currentRecipeContext = recipe ? {
      title: recipe.title,
      description: recipe.description,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      dishType: recipe.dishType,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions?.map((s: string | InstructionStep) => 
        typeof s === "string" ? s : s.text
      ),
    } : undefined;

    const contextMessage = `I'm currently on Step ${currentStep + 1} of "${recipe?.title || "a recipe"}": "${currentInstructionText}". My question: ${userMessage}`;

    conversationHistoryRef.current.push({ role: "user", content: contextMessage });
    if (conversationHistoryRef.current.length > 10) {
      conversationHistoryRef.current = conversationHistoryRef.current.slice(-10);
    }

    const res = await fetch(url.href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: contextMessage,
        conversationHistory: conversationHistoryRef.current.slice(0, -1),
        currentRecipe: currentRecipeContext,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to get response from Remi");
    }

    const data = await res.json();
    const reply = data.reply || "Sorry, I didn't catch that. Could you try again?";

    conversationHistoryRef.current.push({ role: "assistant", content: reply });

    return reply;
  }, [recipe, currentStep, currentInstructionText]);

  const getBase64FromRecording = useCallback(async (uri: string): Promise<string> => {
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(",")[1] || "";
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("Failed to read audio blob"));
        reader.readAsDataURL(blob);
      });
    }
    const audioFile = new File(uri);
    return await audioFile.base64();
  }, []);

  const transcribeAudio = useCallback(async (recordingUri: string): Promise<string> => {
    const baseUrl = getApiUrl();
    const url = new URL("/api/remy/transcribe", baseUrl);

    const base64Audio = await getBase64FromRecording(recordingUri);

    if (!base64Audio || base64Audio.length === 0) {
      return "";
    }

    const res = await fetch(url.href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio: base64Audio }),
    });

    if (!res.ok) {
      throw new Error("Transcription failed");
    }

    const data = await res.json();
    return data.text || "";
  }, [getBase64FromRecording]);

  const transcribeAudioRef = useRef(transcribeAudio);
  const sendToRemiRef = useRef(sendToRemi);
  const speakRemiResponseRef = useRef(speakRemiResponse);

  useEffect(() => {
    transcribeAudioRef.current = transcribeAudio;
  }, [transcribeAudio]);

  useEffect(() => {
    sendToRemiRef.current = sendToRemi;
  }, [sendToRemi]);

  useEffect(() => {
    speakRemiResponseRef.current = speakRemiResponse;
  }, [speakRemiResponse]);

  const processRecordingRef = useRef<() => Promise<void>>();
  const startRecordingRef = useRef<() => Promise<void>>();

  const startRecording = useCallback(async () => {
    if (!voiceActiveRef.current) return;

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Microphone access needed", "Please enable microphone access in your settings to talk to Remi.");
        voiceActiveRef.current = false;
        setVoiceState("off");
        setVoiceStatusText("");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setVoiceState("listening");
      setVoiceStatusText("Listening... speak to Remi");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      maxRecordingTimeoutRef.current = setTimeout(() => {
        if (voiceActiveRef.current && recordingRef.current) {
          processRecordingRef.current?.();
        }
      }, 12000);

    } catch (error) {
      console.error("Failed to start recording:", error);
      if (voiceActiveRef.current) {
        setTimeout(() => startRecordingRef.current?.(), 1000);
      }
    }
  }, []);

  const processRecording = useCallback(async () => {
    if (maxRecordingTimeoutRef.current) {
      clearTimeout(maxRecordingTimeoutRef.current);
      maxRecordingTimeoutRef.current = null;
    }

    const currentRecording = recordingRef.current;
    if (!currentRecording) {
      if (voiceActiveRef.current) startRecordingRef.current?.();
      return;
    }

    recordingRef.current = null;

    try {
      setVoiceState("processing");
      setVoiceStatusText("Thinking...");

      await currentRecording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = currentRecording.getURI();

      if (!uri) {
        if (voiceActiveRef.current) startRecordingRef.current?.();
        return;
      }

      const transcription = await transcribeAudioRef.current(uri);
      console.log("[CookMode Voice] Transcribed:", transcription);

      if (!transcription || transcription.trim().length < 2) {
        if (voiceActiveRef.current) {
          setVoiceState("listening");
          setVoiceStatusText("Listening... speak to Remi");
          startRecordingRef.current?.();
        }
        return;
      }

      setVoiceStatusText("Remi is thinking...");
      const remiReply = await sendToRemiRef.current(transcription);
      console.log("[CookMode Voice] Remi says:", remiReply.substring(0, 100));

      if (!voiceActiveRef.current) return;

      await speakRemiResponseRef.current(remiReply);

      if (voiceActiveRef.current) {
        startRecordingRef.current?.();
      }
    } catch (error) {
      console.error("[CookMode Voice] Error:", error);
      if (voiceActiveRef.current) {
        setVoiceStatusText("Listening... speak to Remi");
        startRecordingRef.current?.();
      }
    }
  }, []);

  useEffect(() => {
    startRecordingRef.current = startRecording;
    processRecordingRef.current = processRecording;
  }, [startRecording, processRecording]);

  const toggleVoice = useCallback(async () => {
    if (voiceActiveRef.current) {
      voiceActiveRef.current = false;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Speech.stop();

      if (maxRecordingTimeoutRef.current) {
        clearTimeout(maxRecordingTimeoutRef.current);
        maxRecordingTimeoutRef.current = null;
      }

      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          // already stopped
        }
        recordingRef.current = null;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      setVoiceState("off");
      setVoiceStatusText("");
      conversationHistoryRef.current = [];
    } else {
      voiceActiveRef.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      startRecordingRef.current?.();
    }
  }, []);

  useEffect(() => {
    return () => {
      voiceActiveRef.current = false;
      Speech.stop();
      if (maxRecordingTimeoutRef.current) {
        clearTimeout(maxRecordingTimeoutRef.current);
      }
      if (recordingRef.current) {
        try {
          recordingRef.current.stopAndUnloadAsync();
        } catch (e) {}
        recordingRef.current = null;
      }
      Object.values(timerIntervalsRef.current).forEach(clearInterval);
    };
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const startTimer = useCallback((totalSeconds: number, label: string) => {
    const timerKey = `${currentStep}-${label}`;
    if (activeTimers[timerKey] !== undefined) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveTimers((prev) => ({ ...prev, [timerKey]: totalSeconds }));

    const interval = setInterval(() => {
      setActiveTimers((prev) => {
        const remaining = (prev[timerKey] || 0) - 1;
        if (remaining <= 0) {
          clearInterval(interval);
          delete timerIntervalsRef.current[timerKey];
          Alert.alert("Timer Done", `${label} timer is up! Time to move on.`);
          const { [timerKey]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [timerKey]: remaining };
      });
    }, 1000);

    timerIntervalsRef.current[timerKey] = interval;
  }, [currentStep, activeTimers]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!recipe) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ThemedText style={{ color: CookModeColors.text }}>Recipe not found</ThemedText>
      </View>
    );
  }

  const micIconName = voiceState === "speaking" ? "volume-2" : "mic";
  const isVoiceActive = voiceState !== "off";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={handleClose} style={styles.closeButton} testID="cook-mode-close">
          <Feather name="x" size={28} color={CookModeColors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText style={[styles.recipeTitle, { color: CookModeColors.textSecondary }]} numberOfLines={1}>
            {recipe.title}
          </ThemedText>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {recipe.instructions.map((_: string | InstructionStep, index: number) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  index < currentStep
                    ? CookModeColors.stepCompleted
                    : index === currentStep
                      ? CookModeColors.stepActive
                      : CookModeColors.stepPending,
              },
            ]}
          />
        ))}
      </View>

      {/* Main Content */}
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content}>
        {/* YouTube Player */}
        {hasYouTubeVideo && youtubeVideoId ? (
          <View style={styles.youtubeContainer}>
            <YoutubePlayer
              ref={playerRef}
              height={Math.round((SCREEN_WIDTH - Spacing["3xl"] * 2) * 9 / 16)}
              width={SCREEN_WIDTH - Spacing["3xl"] * 2}
              videoId={youtubeVideoId}
              play={false}
              webViewProps={{
                allowsInlineMediaPlayback: true,
              }}
            />
          </View>
        ) : null}

        <Animated.View 
          key={currentStep}
          entering={SlideInRight.duration(300)}
          style={styles.stepContainer}
        >
          <View style={styles.stepHeader}>
            <ThemedText style={[CookModeTypography.stepNumber, { color: CookModeColors.primary }]}>
              Step {currentStep + 1}
            </ThemedText>
            <View style={styles.remiInlineContainer}>
              {isVoiceActive ? (
                <Animated.View style={[styles.remiInlinePulse, pulseAnimatedStyle]} />
              ) : null}
              <Pressable
                onPress={toggleVoice}
                onLongPress={undefined}
                style={[
                  styles.remiInlineButton,
                  isVoiceActive ? styles.remiInlineButtonActive : null,
                ]}
                testID="remi-voice-toggle"
              >
                <Feather
                  name={micIconName}
                  size={18}
                  color={isVoiceActive ? "#FFFFFF" : CookModeColors.textSecondary}
                />
              </Pressable>
            </View>
          </View>
          <ThemedText style={[CookModeTypography.stepText, { color: CookModeColors.text, marginTop: Spacing.lg }]}>
            {currentInstructionText}
          </ThemedText>

          {/* Timer Detection */}
          {timeMentions.length > 0 ? (
            <Animated.View entering={FadeIn.duration(300)} style={styles.timerSection}>
              {timeMentions.map((mention, index) => {
                const timerKey = `${currentStep}-${mention.amount} ${mention.unit}`;
                const isActive = activeTimers[timerKey] !== undefined;
                return (
                  <View key={index} style={styles.timerRow}>
                    {isActive ? (
                      <View style={styles.activeTimerBadge}>
                        <Feather name="clock" size={14} color={CookModeColors.accent} />
                        <ThemedText style={styles.activeTimerText}>
                          {formatTimer(activeTimers[timerKey])}
                        </ThemedText>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => startTimer(mention.totalSeconds, `${mention.amount} ${mention.unit}`)}
                        style={styles.startTimerButton}
                        testID={`start-timer-${index}`}
                      >
                        <Feather name="clock" size={14} color={CookModeColors.background} />
                        <ThemedText style={styles.startTimerText}>
                          Start {mention.amount} {mention.unit} Timer
                        </ThemedText>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </Animated.View>
          ) : null}

          {stepIngredients.length > 0 ? (
            <Animated.View entering={FadeIn.duration(300)} style={styles.ingredientsSection}>
              <View style={styles.ingredientsSectionHeader}>
                <Feather name="shopping-bag" size={16} color={CookModeColors.primary} />
                <ThemedText style={styles.ingredientsSectionTitle}>
                  Ingredients in this step
                </ThemedText>
              </View>
              <View style={styles.ingredientChips}>
                {stepIngredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientChip}>
                    <ThemedText style={styles.ingredientChipAmount}>
                      {ingredient.amount} {ingredient.unit}
                    </ThemedText>
                    <ThemedText style={styles.ingredientChipName}>
                      {ingredient.name}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </Animated.View>
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* Voice Status Bar */}
      {isVoiceActive ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.voiceStatusBar}>
          <View style={[styles.voiceStatusDot, {
            backgroundColor: voiceState === "listening" ? "#10B981" : voiceState === "processing" ? "#F59E0B" : "#6366F1",
          }]} />
          <ThemedText style={styles.voiceStatusText}>
            {voiceStatusText}
          </ThemedText>
        </Animated.View>
      ) : null}

      {/* Navigation Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          onPress={handlePrevious}
          disabled={currentStep === 0}
          style={[
            styles.navButton,
            { opacity: currentStep === 0 ? 0.3 : 1 },
          ]}
          testID="cook-mode-previous"
        >
          <Feather name="chevron-left" size={40} color={CookModeColors.text} />
          <ThemedText style={[styles.navLabel, { color: CookModeColors.textSecondary }]}>
            Previous
          </ThemedText>
        </Pressable>

        <View style={styles.stepIndicator}>
          <ThemedText style={[styles.stepCount, { color: CookModeColors.text }]}>
            {currentStep + 1} / {totalSteps}
          </ThemedText>
        </View>

        <Pressable
          onPress={handleNext}
          disabled={currentStep === totalSteps - 1}
          style={[
            styles.navButton,
            { opacity: currentStep === totalSteps - 1 ? 0.3 : 1 },
          ]}
          testID="cook-mode-next"
        >
          <Feather name="chevron-right" size={40} color={CookModeColors.text} />
          <ThemedText style={[styles.navLabel, { color: CookModeColors.textSecondary }]}>
            Next
          </ThemedText>
        </Pressable>
      </View>

      {/* Tap zones for navigation */}
      <Pressable 
        style={styles.tapZoneLeft} 
        onPress={handlePrevious}
      />
      <Pressable 
        style={styles.tapZoneRight} 
        onPress={handleNext}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CookModeColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingTop: 12,
  },
  closeButton: {
    padding: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 9999,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  recipeTitle: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.6,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
    gap: 6,
    marginBottom: 20,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["4xl"],
    paddingVertical: Spacing.xl,
  },
  youtubeContainer: {
    marginBottom: Spacing["2xl"],
    borderRadius: 24,
    overflow: "hidden",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  stepContainer: {
    alignItems: "flex-start",
  },
  timerSection: {
    marginTop: Spacing["3xl"],
    width: "100%",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  startTimerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: CookModeColors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 9999,
  },
  activeTimerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "transparent",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: CookModeColors.accent,
  },
  activeTimerText: {
    fontSize: 48,
    fontWeight: "800",
    color: CookModeColors.accent,
    fontVariant: ["tabular-nums"],
  },
  ingredientsSection: {
    marginTop: Spacing["4xl"],
    width: "100%",
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  ingredientsSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: CookModeColors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 16,
  },
  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 8,
  },
  ingredientChipAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: CookModeColors.primary,
  },
  ingredientChipName: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  voiceStatusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    gap: Spacing.sm,
  },
  voiceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  voiceStatusText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    flex: 1,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing["3xl"],
    paddingBottom: 40,
    paddingTop: Spacing.xl,
    backgroundColor: CookModeColors.background,
  },
  navButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  remiInlineContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  remiInlineButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  remiInlineButtonActive: {
    backgroundColor: CookModeColors.primary,
    borderColor: CookModeColors.primary,
    shadowColor: CookModeColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  remiInlinePulse: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CookModeColors.primary,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  stepIndicator: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerRow: {
    marginBottom: Spacing.md,
    width: "100%",
    alignItems: "center",
  },
  startTimerText: {
    fontSize: 14,
    fontWeight: "700",
    color: CookModeColors.background,
  },
  ingredientsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ingredientChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tapZoneLeft: {
    position: "absolute",
    left: 0,
    top: "30%",
    width: "15%",
    height: "40%",
  },
  tapZoneRight: {
    position: "absolute",
    right: 0,
    top: "30%",
    width: "15%",
    height: "40%",
  },
});
