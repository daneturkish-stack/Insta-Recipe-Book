import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DIETARY_KEY = "@kitch_dietary_preferences";
const VOICE_KEY = "@kitch_remi_voice";

export type DietaryPreference =
  | "Vegetarian"
  | "Vegan"
  | "Gluten-Free"
  | "Dairy-Free"
  | "Nut-Free"
  | "Keto"
  | "Halal"
  | "Kosher"
  | "Low-Carb"
  | "Pescatarian";

export type RemiVoice = "female" | "male";

export const ALL_DIETARY_OPTIONS: DietaryPreference[] = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Keto",
  "Halal",
  "Kosher",
  "Low-Carb",
  "Pescatarian",
];

export const VOICE_TO_TTS: Record<RemiVoice, string> = {
  female: "fable",
  male: "onyx",
};

export function usePreferences() {
  const [dietaryPreferences, setDietaryPreferencesState] = useState<DietaryPreference[]>([]);
  const [remiVoice, setRemiVoiceState] = useState<RemiVoice>("female");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [dietaryJson, voiceJson] = await Promise.all([
          AsyncStorage.getItem(DIETARY_KEY),
          AsyncStorage.getItem(VOICE_KEY),
        ]);
        if (dietaryJson) setDietaryPreferencesState(JSON.parse(dietaryJson));
        if (voiceJson) setRemiVoiceState(voiceJson as RemiVoice);
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const toggleDietaryPreference = useCallback(
    async (pref: DietaryPreference) => {
      setDietaryPreferencesState((prev) => {
        const next = prev.includes(pref)
          ? prev.filter((p) => p !== pref)
          : [...prev, pref];
        AsyncStorage.setItem(DIETARY_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const setRemiVoice = useCallback(async (voice: RemiVoice) => {
    setRemiVoiceState(voice);
    await AsyncStorage.setItem(VOICE_KEY, voice);
  }, []);

  return {
    dietaryPreferences,
    toggleDietaryPreference,
    remiVoice,
    setRemiVoice,
    ttsVoice: VOICE_TO_TTS[remiVoice],
    loaded,
  };
}
