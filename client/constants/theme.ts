import { Platform } from "react-native";

// Kitch Design System - Modern, clean, and light
// Designed to complement vibrant food photography

export const KitchColors = {
  primary: "#4A90E2", // Soft blue - fresh, trustworthy
  background: "#FAFAFA", // Soft white - airy, clean
  surface: "#FFFFFF", // Pure white - cards, inputs
  textPrimary: "#1A1A1A", // Near-black - crisp readability
  textSecondary: "#6B6B6B", // Medium gray
  border: "#E5E5E5", // Subtle gray
  accent: "#7DC579", // Fresh green - organic, positive
  error: "#E85D5D", // Soft red
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
    buttonText: "#FFFFFF",
    tabIconDefault: KitchColors.textSecondary,
    tabIconSelected: KitchColors.primary,
    link: KitchColors.primary,
    backgroundRoot: KitchColors.background,
    backgroundDefault: KitchColors.surface,
    backgroundSecondary: "#F5F5F5",
    backgroundTertiary: "#EEEEEE",
    border: KitchColors.border,
    accent: KitchColors.accent,
    error: KitchColors.error,
    primary: KitchColors.primary,
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
    backgroundSecondary: "#252525",
    backgroundTertiary: "#2E2E2E",
    border: KitchColors.darkBorder,
    accent: KitchColors.accent,
    error: KitchColors.error,
    primary: KitchColors.primary,
  },
};

// Cook Mode - High contrast theme for kitchen use (readable from 3 feet away)
export const CookModeColors = {
  background: "#0A0A0A",
  surface: "#1A1A1A",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  primary: "#4A90E2",
  accent: "#7DC579",
  border: "#333333",
  stepActive: "#4A90E2",
  stepCompleted: "#7DC579",
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
  // Headings use Crimson Text (serif) for editorial feel
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: "CrimsonText_700Bold",
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
    fontFamily: "CrimsonText_700Bold",
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
    fontFamily: "CrimsonText_600SemiBold",
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
    fontFamily: "CrimsonText_600SemiBold",
  },
  // Body text uses Inter (sans-serif) for clean readability
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
    fontWeight: "700" as const,
    fontFamily: "CrimsonText_700Bold",
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
    fontFamily: "CrimsonText_700Bold",
  },
  timer: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
};

// Minimal shadows - let content breathe
export const Shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  button: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  floating: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "Inter_400Regular",
    serif: "CrimsonText_400Regular",
    mono: "ui-monospace",
  },
  default: {
    sans: "Inter_400Regular",
    serif: "CrimsonText_400Regular",
    mono: "monospace",
  },
  web: {
    sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "'Crimson Text', Georgia, 'Times New Roman', serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
