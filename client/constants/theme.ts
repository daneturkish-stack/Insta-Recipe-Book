import { Platform } from "react-native";

// Kitch Design System - Playful, vibrant palette inspired by Maggie
// Fresh mint green with sunny yellow accents for a joyful cooking experience

export const KitchColors = {
  primary: "#82EDA6", // Fresh mint green - buttons and interactive elements
  background: "#F9F8F4", // Warm cream - cozy canvas
  surface: "#FFFFFF", // Pure white - cards, inputs
  textPrimary: "#03594D", // Deep teal - warm readability
  textSecondary: "#4A6B65", // Muted teal
  border: "#E8E6E0", // Soft warm gray
  accent: "#FFFF94", // Sunny yellow - highlights and playful accents
  highlight: "#82EDA6", // Mint green - gentle emphasis
  secondary: "#FCCDDC", // Soft pink - secondary actions
  neutral: "#F0EFEB", // Light warm gray - subtle backgrounds
  error: "#E85858", // Warm red
  // Dark mode variants
  darkBackground: "#121212",
  darkSurface: "#1E1E1E",
  darkTextPrimary: "#FAFAFA",
  darkTextSecondary: "#A0A0A0",
  darkBorder: "#2E2E2E",
};

export const Colors = {
  light: {
    text: KitchColors.textPrimary,
    textSecondary: KitchColors.textSecondary,
    buttonText: KitchColors.textPrimary, // Deep teal text on mint buttons
    tabIconDefault: KitchColors.textSecondary,
    tabIconSelected: KitchColors.textPrimary, // Deep teal for selected tab
    link: KitchColors.primary,
    backgroundRoot: KitchColors.background,
    backgroundDefault: KitchColors.surface,
    backgroundSecondary: KitchColors.neutral,
    backgroundTertiary: KitchColors.accent,
    border: KitchColors.border,
    accent: KitchColors.accent,
    highlight: KitchColors.highlight,
    error: KitchColors.error,
    primary: KitchColors.primary,
    secondary: KitchColors.secondary,
  },
  dark: {
    text: KitchColors.darkTextPrimary,
    textSecondary: KitchColors.darkTextSecondary,
    buttonText: "#FFFFFF",
    tabIconDefault: KitchColors.darkTextSecondary,
    tabIconSelected: "#82EDA6",
    link: "#82EDA6",
    backgroundRoot: KitchColors.darkBackground,
    backgroundDefault: KitchColors.darkSurface,
    backgroundSecondary: "#252525",
    backgroundTertiary: "#2E2E2E",
    border: KitchColors.darkBorder,
    accent: KitchColors.accent,
    highlight: KitchColors.highlight,
    error: KitchColors.error,
    primary: "#82EDA6",
    secondary: "#FCCDDC",
  },
};

// Cook Mode - High contrast theme for kitchen use (readable from 3 feet away)
export const CookModeColors = {
  background: "#0A0A0A",
  surface: "#1A1A1A",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  primary: "#82EDA6",
  accent: "#FFFF94",
  border: "#333333",
  stepActive: "#82EDA6",
  stepCompleted: "#FFFF94",
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
  inputHeight: 52,
  buttonHeight: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

export const Typography = {
  // Headings use Archivo Bold for modern, friendly feel
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: "Archivo_700Bold",
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
    fontFamily: "Archivo_700Bold",
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
    fontFamily: "Archivo_600SemiBold",
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
    fontFamily: "Archivo_600SemiBold",
  },
  // Body text uses Archivo for consistent modern look
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    fontFamily: "Archivo_400Regular",
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
    fontFamily: "Archivo_500Medium",
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
    fontFamily: "Archivo_400Regular",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    fontFamily: "Archivo_400Regular",
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
    fontFamily: "Archivo_500Medium",
  },
};

// Cook Mode Typography - Extra large for kitchen visibility
export const CookModeTypography = {
  stepNumber: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "700" as const,
    fontFamily: "Archivo_700Bold",
  },
  stepText: {
    fontSize: 26,
    lineHeight: 38,
    fontWeight: "400" as const,
    fontFamily: "Archivo_400Regular",
  },
  ingredient: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: "500" as const,
    fontFamily: "Archivo_500Medium",
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: "Archivo_700Bold",
  },
  timer: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: "700" as const,
    fontFamily: "Archivo_700Bold",
  },
};

// Soft shadows - playful but subtle
export const Shadows = {
  card: {
    shadowColor: "#03594D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    shadowColor: "#03594D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  floating: {
    shadowColor: "#03594D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "Archivo_400Regular",
    sansBold: "Archivo_700Bold",
    mono: "ui-monospace",
  },
  default: {
    sans: "Archivo_400Regular",
    sansBold: "Archivo_700Bold",
    mono: "monospace",
  },
  web: {
    sans: "'Archivo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sansBold: "'Archivo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
