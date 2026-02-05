import { Platform } from "react-native";

// Kitch Design System - Fresh, Playful Cooking App
// Mint/Teal primary with Navy accents for a modern culinary experience

export const KitchColors = {
  primary: "#14B8A6", // Mint/Teal - primary actions
  primaryLight: "#5EEAD4", // Light teal for backgrounds
  background: "#E8F6F3", // Light mint background
  surface: "#FFFFFF", // Pure white - cards, inputs
  textPrimary: "#1F2937", // Dark slate - high readability
  textSecondary: "#6B7280", // Cool gray - secondary text
  border: "#E5E7EB", // Light gray border
  accent: "#FBBF24", // Warm Amber - secondary accents
  navy: "#1E3A5F", // Dark navy - premium cards, dark sections
  highlight: "#14B8A6", // Teal - emphasis
  secondary: "#FBBF24", // Amber for secondary actions
  neutral: "#F3F4F6", // Light gray - subtle backgrounds
  error: "#EF4444", // Red
  success: "#14B8A6", // Teal
  coral: "#FB7185", // Coral accent for cards
  skyBlue: "#38BDF8", // Sky blue accent for cards
  lavender: "#A78BFA", // Lavender accent for cards
  peach: "#FDBA74", // Peach accent
  // Dark mode variants
  darkBackground: "#111827",
  darkSurface: "#1F2937",
  darkTextPrimary: "#F9FAFB",
  darkTextSecondary: "#9CA3AF",
  darkBorder: "#374151",
};

// Colorful card border accents
export const CardAccentColors = [
  KitchColors.coral,
  KitchColors.accent,
  KitchColors.skyBlue,
  KitchColors.lavender,
  KitchColors.peach,
  KitchColors.primary,
];

export const Colors = {
  light: {
    text: KitchColors.textPrimary,
    textSecondary: KitchColors.textSecondary,
    buttonText: "#FFFFFF", // White text on teal buttons
    tabIconDefault: KitchColors.textSecondary,
    tabIconSelected: KitchColors.primary, // Teal for selected tab
    link: KitchColors.primary,
    backgroundRoot: KitchColors.background,
    backgroundDefault: KitchColors.surface,
    backgroundSecondary: KitchColors.neutral,
    backgroundTertiary: KitchColors.primaryLight + "30",
    border: KitchColors.border,
    accent: KitchColors.accent,
    highlight: KitchColors.highlight,
    error: KitchColors.error,
    primary: KitchColors.primary,
    secondary: KitchColors.secondary,
    navy: KitchColors.navy,
    coral: KitchColors.coral,
    skyBlue: KitchColors.skyBlue,
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
    navy: KitchColors.navy,
    coral: KitchColors.coral,
    skyBlue: KitchColors.skyBlue,
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
  card: 24, // Large rounded cards per spec
  full: 9999,
};

export const Typography = {
  // Large hero headline for splash/onboarding screens - Nunito ExtraBold for impact
  hero: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "800" as const,
    fontFamily: "Nunito_800ExtraBold",
  },
  // Headings use Nunito Bold for friendly, rounded personality
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
  // Body text uses Inter for clean, modern readability
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
  // Small uppercase label for categories
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

// Soft shadows - subtle and elegant for Premium Light aesthetic
export const Shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLight: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    shadowColor: "#14B8A6",
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
