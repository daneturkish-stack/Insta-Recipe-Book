import React, { useState } from "react";
import { StyleSheet, TextInput, View, TextInputProps } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: "default" | "search";
  icon?: keyof typeof Feather.glyphMap;
}

export function Input({ label, error, style, variant = "default", icon, ...props }: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const isSearch = variant === "search";

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
      ) : null}
      <View style={[
        styles.inputWrapper,
        isSearch && styles.searchWrapper,
        {
          backgroundColor: isSearch ? theme.backgroundSecondary : theme.backgroundDefault,
          borderColor: error
            ? theme.error
            : isFocused && !isSearch
              ? theme.primary
              : "transparent",
          borderWidth: isSearch ? 0 : (isFocused || error ? 2 : 1),
        },
      ]}>
        {icon ? (
          <Feather
            name={icon}
            size={20}
            color={theme.textSecondary}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          style={[
            styles.input,
            isSearch && styles.searchInput,
            icon && styles.inputWithIcon,
            {
              color: theme.text,
            },
            style,
          ]}
          placeholderTextColor={theme.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error ? (
        <ThemedText type="caption" style={[styles.error, { color: theme.error }]}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  searchWrapper: {
    borderRadius: BorderRadius.full, // Pill-shaped for search
  },
  icon: {
    marginLeft: Spacing.lg,
  },
  input: {
    flex: 1,
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
  },
  searchInput: {
    height: 48,
  },
  inputWithIcon: {
    paddingLeft: Spacing.sm,
  },
  error: {
    marginTop: Spacing.xs,
  },
});
