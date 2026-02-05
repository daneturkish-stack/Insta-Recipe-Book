import { Platform } from "react-native";

// Kitch Design System - Warm Modern Kitchen
// Refined teal primary with warm undertones for a premium culinary experience

export const KitchColors = {
  primary: "#0D9488", // Deep warm teal - better contrast, richer
  primaryLight: "#5EEAD4", // Light teal for subtle backgrounds
  primaryMuted: "#CCFBF1", // Very light teal wash
  background: "#FAF7F5", // Warm off-white - inviting, editorial
  surface: "#FFFFFF", // Pure white - cards, inputs
  textPrimary: "#1A1A2E", // Deep charcoal - excellent readability
  textSecondary: "#64748B", // Slate gray - softer secondary
  border: "#E2E0DD", // Warm gray border
  accent: "#E8A838", // Refined golden amber - premium feel
  accentLight: "#FEF3C7", // Light golden wash
  navy: "#1E293B", // Modern dark slate - premium cards
  highlight: "#0D9488", // Teal - emphasis
  secondary: "#E8A838", // Golden for secondary actions
  neutral: "#F1EFEC", // Warm light gray - subtle backgrounds
  error: "#DC2626", // Refined red
  success: "#059669", // Emerald green - distinct from primary
  coral: "#F472B6", // Soft pink accent
  skyBlue: "#38BDF8", // Sky blue accent
  lavender: "#A78BFA", // Lavender accent
  peach: "#FB923C", // Warm orange accent
  // Dark mode - warm undertones
  darkBackground: "#141218", // Deep warm black
  darkSurface: "#1E1B24", // Warm dark surface
  darkTextPrimary: "#F5F3F0", // Warm white
  darkTextSecondary: "#94A3B8", // Soft slate
  darkBorder: "#2D2B33", // Warm dark border
};

// Streamlined card accents - 4 harmonious tones
export const CardAccentColors = [
  KitchColors.primary, // Teal
  KitchColors.accent, // Golden
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
  card: 24,
  full: 9999,
};

export const Typography = {
  hero: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "800" as const,
    fontFamily: "Nunito_800ExtraBold",
  },
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: "Nunito_700Bold",
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
    fontFamily: "Nunito_700Bold",
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
    fontFamily: "Nunito_600SemiBold",
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
    fontFamily: "Nunito_600SemiBold",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    fontFamily: "Inter_400Regular",
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
    fontFamily: "Inter_500Medium",
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
    fontFamily: "Inter_400Regular",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    fontFamily: "Inter_400Regular",
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
    fontFamily: "Inter_500Medium",
  },
};

// Cook Mode Typography - Extra large for kitchen visibility
export const CookModeTypography = {
  stepNumber: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "800" as const,
    fontFamily: "Nunito_800ExtraBold",
  },
  stepText: {
    fontSize: 26,
    lineHeight: 38,
    fontWeight: "400" as const,
    fontFamily: "Inter_400Regular",
  },
  ingredient: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: "500" as const,
    fontFamily: "Inter_500Medium",
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: "Nunito_700Bold",
  },
  timer: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: "800" as const,
    fontFamily: "Nunito_800ExtraBold",
  },
};

// Refined shadows - warmer, more visible depth
export const Shadows = {
  card: {
    shadowColor: "#1A1A2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardLight: {
    shadowColor: "#1A1A2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  floating: {
    shadowColor: "#1A1A2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};

// Semantic match colors for pantry results
export const MatchColors = {
  high: "#059669",
  medium: "#0D9488",
  low: "#E8A838",
};

// Pastel backgrounds for category chips
export const PastelColors = [
  "#FECDD3", // Warm rose
  KitchColors.accentLight, // Golden
  KitchColors.primaryMuted, // Mint
  "#DBEAFE", // Soft blue
  "#EDE9FE", // Lavender
  "#FFF1F2", // Blush
];

// Vibe tag colors
export const VibeTagColors = {
  light: { bg: KitchColors.accentLight, text: "#92400E" },
  dark: { bg: "#3D3420", text: "#FCD34D" },
};

export const Fonts = Platform.select({
  ios: {
    sans: "Inter_400Regular",
    sansBold: "Inter_700Bold",
    display: "Nunito_700Bold",
    displayBold: "Nunito_800ExtraBold",
    mono: "ui-monospace",
  },
  default: {
    sans: "Inter_400Regular",
    sansBold: "Inter_700Bold",
    display: "Nunito_700Bold",
    displayBold: "Nunito_800ExtraBold",
    mono: "monospace",
  },
  web: {
    sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sansBold: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "'Nunito', 'Inter', system-ui, sans-serif",
    displayBold: "'Nunito', 'Inter', system-ui, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
