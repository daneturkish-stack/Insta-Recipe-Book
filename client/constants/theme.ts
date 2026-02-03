import { Platform } from "react-native";

// Kitch Design System - Organic/Editorial fusion with warm cookbook aesthetic

export const KitchColors = {
  primary: "#D97E43", // Warm terracotta
  background: "#FFFBF7", // Cream
  surface: "#FFFFFF", // White cards
  textPrimary: "#2D2520", // Dark brown
  textSecondary: "#7A6F68", // Muted brown
  border: "#E8DFD8", // Subtle taupe
  accent: "#8FA67C", // Sage green
  error: "#C94528", // Warm red
  // Dark mode variants
  darkBackground: "#1A1614",
  darkSurface: "#252220",
  darkTextPrimary: "#F5F0EB",
  darkTextSecondary: "#9A918A",
  darkBorder: "#3D3835",
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
    backgroundSecondary: "#F7F2ED",
    backgroundTertiary: "#EFE8E1",
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
    backgroundSecondary: "#2D2926",
    backgroundTertiary: "#3A3532",
    border: KitchColors.darkBorder,
    accent: KitchColors.accent,
    error: KitchColors.error,
    primary: KitchColors.primary,
  },
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
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  // Headings use Crimson Text (serif)
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
  // Body text uses Inter (sans-serif)
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

export const Shadows = {
  card: {
    shadowColor: "#2D2520",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: "#2D2520",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
