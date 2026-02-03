import { Platform } from "react-native";

// Kitch Design System - Soft pastel palette with elegant typography
// Designed to complement vibrant food photography

export const KitchColors = {
  primary: "#d0cfe1", // Lavender pastel - buttons and interactive elements
  background: "#FFFFFF", // Pure white - clean canvas
  surface: "#FFFFFF", // Pure white - cards, inputs
  textPrimary: "#231212", // Dark brown - warm readability
  textSecondary: "#5C5252", // Muted brown
  border: "#eceaea", // Soft warm gray
  accent: "#e3e6d0", // Sage green pastel - organic, fresh
  highlight: "#d0cfe1", // Lavender pastel - gentle emphasis
  neutral: "#eceaea", // Light warm gray - subtle backgrounds
  error: "#D85858", // Soft red
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
    buttonText: KitchColors.textPrimary, // Dark brown text on pastel buttons
    tabIconDefault: KitchColors.textSecondary,
    tabIconSelected: KitchColors.textPrimary, // Dark brown for selected tab
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
  },
  dark: {
    text: KitchColors.darkTextPrimary,
    textSecondary: KitchColors.darkTextSecondary,
    buttonText: "#FFFFFF",
    tabIconDefault: KitchColors.darkTextSecondary,
    tabIconSelected: "#d0cfe1",
    link: "#d0cfe1",
    backgroundRoot: KitchColors.darkBackground,
    backgroundDefault: KitchColors.darkSurface,
    backgroundSecondary: "#252525",
    backgroundTertiary: "#2E2E2E",
    border: KitchColors.darkBorder,
    accent: KitchColors.accent,
    highlight: KitchColors.highlight,
    error: KitchColors.error,
    primary: "#d0cfe1",
  },
};

// Cook Mode - High contrast theme for kitchen use (readable from 3 feet away)
export const CookModeColors = {
  background: "#0A0A0A",
  surface: "#1A1A1A",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  primary: "#d0cfe1",
  accent: "#e3e6d0",
  border: "#333333",
  stepActive: "#d0cfe1",
  stepCompleted: "#e3e6d0",
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
  // Headings use DM Sans Bold for modern, clean feel
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: "DMSans_700Bold",
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
    fontFamily: "DMSans_700Bold",
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  // Body text uses DM Sans for consistent modern look
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    fontFamily: "DMSans_400Regular",
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
    fontFamily: "DMSans_500Medium",
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
    fontFamily: "DMSans_400Regular",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    fontFamily: "DMSans_400Regular",
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
    fontFamily: "DMSans_500Medium",
  },
};

// Cook Mode Typography - Extra large for kitchen visibility
export const CookModeTypography = {
  stepNumber: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "700" as const,
    fontFamily: "DMSans_700Bold",
  },
  stepText: {
    fontSize: 26,
    lineHeight: 38,
    fontWeight: "400" as const,
    fontFamily: "DMSans_400Regular",
  },
  ingredient: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: "500" as const,
    fontFamily: "DMSans_500Medium",
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: "DMSans_700Bold",
  },
  timer: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: "700" as const,
    fontFamily: "DMSans_700Bold",
  },
};

// Minimal shadows - let content breathe
export const Shadows = {
  card: {
    shadowColor: "#231212",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  button: {
    shadowColor: "#231212",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  floating: {
    shadowColor: "#231212",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "DMSans_400Regular",
    sansBold: "DMSans_700Bold",
    mono: "ui-monospace",
  },
  default: {
    sans: "DMSans_400Regular",
    sansBold: "DMSans_700Bold",
    mono: "monospace",
  },
  web: {
    sans: "'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sansBold: "'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
