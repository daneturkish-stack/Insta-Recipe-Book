import { Platform } from "react-native";

// Kitch Design System - Premium Light aesthetic
// Emerald Green primary with warm Amber accents for a modern culinary experience

export const KitchColors = {
  primary: "#10B981", // Vibrant Emerald Green - primary actions
  background: "#F8F9FA", // Soft off-white - lets food photography pop
  surface: "#FFFFFF", // Pure white - cards, inputs
  textPrimary: "#1F2937", // Dark slate - high readability
  textSecondary: "#6B7280", // Cool gray - secondary text
  border: "#E5E7EB", // Light gray border
  accent: "#FBBF24", // Warm Amber - secondary accents
  highlight: "#10B981", // Emerald green - emphasis
  secondary: "#FBBF24", // Amber for secondary actions
  neutral: "#F3F4F6", // Light gray - subtle backgrounds
  error: "#EF4444", // Red
  success: "#10B981", // Emerald
  // Dark mode variants
  darkBackground: "#111827",
  darkSurface: "#1F2937",
  darkTextPrimary: "#F9FAFB",
  darkTextSecondary: "#9CA3AF",
  darkBorder: "#374151",
};

export const Colors = {
  light: {
    text: KitchColors.textPrimary,
    textSecondary: KitchColors.textSecondary,
    buttonText: "#FFFFFF", // White text on emerald buttons
    tabIconDefault: KitchColors.textSecondary,
    tabIconSelected: KitchColors.primary, // Emerald for selected tab
    link: KitchColors.primary,
    backgroundRoot: KitchColors.background,
    backgroundDefault: KitchColors.surface,
    backgroundSecondary: KitchColors.neutral,
    backgroundTertiary: KitchColors.accent + "20",
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
    tabIconSelected: KitchColors.primary,
    link: KitchColors.primary,
    backgroundRoot: KitchColors.darkBackground,
    backgroundDefault: KitchColors.darkSurface,
    backgroundSecondary: "#374151",
    backgroundTertiary: "#4B5563",
    border: KitchColors.darkBorder,
    accent: KitchColors.accent,
    highlight: KitchColors.highlight,
    error: KitchColors.error,
    primary: KitchColors.primary,
    secondary: KitchColors.secondary,
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
  card: 24, // Large rounded cards per spec
  full: 9999,
};

export const Typography = {
  // Headings use Inter Bold for modern, friendly feel
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  // Body text uses Inter for consistent modern look
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
    fontFamily: "Inter_700Bold",
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
    fontFamily: "Inter_700Bold",
  },
  timer: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
};

// Soft shadows - subtle and elegant for Premium Light aesthetic
export const Shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardLight: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  floating: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "Inter_400Regular",
    sansBold: "Inter_700Bold",
    mono: "ui-monospace",
  },
  default: {
    sans: "Inter_400Regular",
    sansBold: "Inter_700Bold",
    mono: "monospace",
  },
  web: {
    sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sansBold: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
