import { Platform } from "react-native";

// Simmer Design System - "Organic"
// Warm terracotta + sage on a cream base, built from the Simmer Claude Design project.
// Tonal ramps generated in OKLCH on a shared lightness scale so each step of any
// role matches the others in visual value.

export const KitchColors = {
  primary: "#c67139", // Terracotta - warm, appetite-forward accent
  primaryLight: "#ffc6a5", // accent-300 - light terracotta wash
  primaryMuted: "#fff2eb", // accent-100 - very light terracotta wash
  background: "#f5ead8", // Warm cream
  surface: "#ebddc5", // Slightly deeper cream - cards, inputs
  textPrimary: "#201e1d", // Near-black ink
  textSecondary: "#645c50", // neutral-700
  border: "#dcd3c4", // neutral-300
  accent: "#c67139", // Terracotta (same family as primary - single accent system)
  accentLight: "#ffe1d0", // accent-200
  navy: "#2e2b25", // neutral-900 - premium dark cards
  highlight: "#c67139",
  secondary: "#7a8a5e", // Sage - secondary accent
  neutral: "#eee7db", // neutral-200
  error: "#DC2626",
  success: "#56633f", // accent-2-700 - sage success tone
  coral: "#F472B6",
  skyBlue: "#38BDF8",
  lavender: "#A78BFA",
  peach: "#f6a06b", // accent-400
  // Sage tonal ramp (secondary accent)
  sage100: "#f0fae1",
  sage200: "#e1eecc",
  sage300: "#ccdbb2",
  sage500: "#8fa073",
  sage700: "#56633f",
  sage900: "#272e1b",
  // Dark mode
  darkBackground: "#201e1d",
  darkSurface: "#2e2b25",
  darkTextPrimary: "#f9f4ed",
  darkTextSecondary: "#a19786",
  darkBorder: "#474238",
};

// Streamlined card accents - 4 harmonious tones
export const CardAccentColors = [
  KitchColors.primary, // Terracotta
  KitchColors.secondary, // Sage
  KitchColors.coral, // Pink
  KitchColors.lavender, // Lavender
];

export const Colors = {
  light: {
    text: KitchColors.textPrimary,
    textSecondary: KitchColors.textSecondary,
    buttonText: "#FFFFFF",
    tabIconDefault: KitchColors.textSecondary,
    tabIconSelected: KitchColors.primary,
    link: KitchColors.primary,
    backgroundRoot: KitchColors.background,
    backgroundDefault: KitchColors.surface,
    backgroundSecondary: KitchColors.neutral,
    backgroundTertiary: KitchColors.primaryMuted,
    border: KitchColors.border,
    accent: KitchColors.accent,
    accentLight: KitchColors.accentLight,
    highlight: KitchColors.highlight,
    error: KitchColors.error,
    primary: KitchColors.primary,
    secondary: KitchColors.secondary,
    navy: KitchColors.navy,
    coral: KitchColors.coral,
    skyBlue: KitchColors.skyBlue,
    progressTrack: "#E2E0DD",
    statDivider: "#E2E0DD",
    difficultyBg: "#F3EEFF",
    difficultyText: "#7C3AED",
  },
  dark: {
    text: KitchColors.darkTextPrimary,
    textSecondary: KitchColors.darkTextSecondary,
    buttonText: "#FFFFFF",
    tabIconDefault: KitchColors.darkTextSecondary,
    tabIconSelected: KitchColors.primary,
    link: KitchColors.primary,
    backgroundRoot: KitchColors.darkBackground,
    backgroundDefault: KitchColors.darkSurface,
    backgroundSecondary: "#2D2B33",
    backgroundTertiary: "#3A3842",
    border: KitchColors.darkBorder,
    accent: KitchColors.accent,
    accentLight: "#3D3420",
    highlight: KitchColors.highlight,
    error: KitchColors.error,
    primary: KitchColors.primary,
    secondary: KitchColors.secondary,
    navy: KitchColors.navy,
    coral: KitchColors.coral,
    skyBlue: KitchColors.skyBlue,
    progressTrack: "#2D2B33",
    statDivider: "#2D2B33",
    difficultyBg: "#2D2040",
    difficultyText: "#A78BFA",
  },
};

// Cook Mode - High contrast theme for kitchen use (readable from 3 feet away)
export const CookModeColors = {
  background: "#0A0A0A",
  surface: "#1A1A1A",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  primary: KitchColors.primary,
  accent: KitchColors.accent,
  border: "#333333",
  stepActive: KitchColors.primary,
  stepCompleted: KitchColors.accent,
  stepPending: "#444444",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 56,
  inputHeight: 52,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  card: 28,
  full: 9999,
};

// Caprasimo only ships one weight (400) - it's a display face, used for
// headings at larger sizes where the single weight reads fine.
export const Typography = {
  hero: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "400" as const,
    fontFamily: "Caprasimo_400Regular",
  },
  h1: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "400" as const,
    fontFamily: "Caprasimo_400Regular",
  },
  h2: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "400" as const,
    fontFamily: "Caprasimo_400Regular",
  },
  h3: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "400" as const,
    fontFamily: "Caprasimo_400Regular",
  },
  h4: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "400" as const,
    fontFamily: "Caprasimo_400Regular",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    fontFamily: "Figtree_400Regular",
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
    fontFamily: "Figtree_500Medium",
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
    fontFamily: "Figtree_400Regular",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    fontFamily: "Figtree_400Regular",
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as const,
    fontFamily: "Figtree_600SemiBold",
    letterSpacing: 1,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
    fontFamily: "Figtree_500Medium",
  },
};

// Cook Mode Typography - Extra large for kitchen visibility.
// Uses Figtree ExtraBold rather than the display face: Cook Mode needs to be
// read at a glance from across the counter, and a novelty serif costs legibility.
export const CookModeTypography = {
  stepNumber: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "800" as const,
    fontFamily: "Figtree_800ExtraBold",
  },
  stepText: {
    fontSize: 26,
    lineHeight: 38,
    fontWeight: "400" as const,
    fontFamily: "Figtree_400Regular",
  },
  ingredient: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: "500" as const,
    fontFamily: "Figtree_500Medium",
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: "Figtree_700Bold",
  },
  timer: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: "800" as const,
    fontFamily: "Figtree_800ExtraBold",
  },
};

// Refined shadows - ink-tinted, matching the Organic system's elevation
export const Shadows = {
  card: {
    shadowColor: "#2e2b25",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  cardLight: {
    shadowColor: "#2e2b25",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    shadowColor: "#c67139",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  floating: {
    shadowColor: "#2e2b25",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
};

// Semantic match colors for pantry results
export const MatchColors = {
  high: "#56633f", // sage-700 - strong match
  medium: "#c67139", // terracotta - partial match
  low: "#f6a06b", // accent-400 - weak match
};

// Pastel backgrounds for category chips
export const PastelColors = [
  KitchColors.accentLight, // Terracotta wash
  KitchColors.sage200, // Sage wash
  KitchColors.neutral, // Warm neutral
  "#DBEAFE", // Soft blue
  "#EDE9FE", // Lavender
  KitchColors.primaryMuted, // Pale terracotta
];

// Vibe tag colors
export const VibeTagColors = {
  light: { bg: KitchColors.accentLight, text: "#643312" }, // accent-200 / accent-800
  dark: { bg: "#402310", text: "#ffc6a5" }, // accent-900 / accent-300
};

export const Fonts = Platform.select({
  ios: {
    sans: "Figtree_400Regular",
    sansBold: "Figtree_700Bold",
    display: "Caprasimo_400Regular",
    displayBold: "Caprasimo_400Regular",
    mono: "ui-monospace",
  },
  default: {
    sans: "Figtree_400Regular",
    sansBold: "Figtree_700Bold",
    display: "Caprasimo_400Regular",
    displayBold: "Caprasimo_400Regular",
    mono: "monospace",
  },
  web: {
    sans: "'Figtree', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sansBold: "'Figtree', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "'Caprasimo', 'Figtree', system-ui, sans-serif",
    displayBold: "'Caprasimo', 'Figtree', system-ui, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
