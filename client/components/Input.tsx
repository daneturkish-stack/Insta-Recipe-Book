import React, { useState } from "react";
import { StyleSheet, TextInput, View, TextInputProps, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography, KitchColors } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: "default" | "search";
  icon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
}

export function Input({ 
  label, 
  error, 
  style, 
  variant = "default", 
  icon, 
  rightIcon,
  onRightIconPress,
  ...props 
}: InputProps) {
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
              : isSearch ? "transparent" : theme.border,
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
            rightIcon && styles.inputWithRightIcon,
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
        {rightIcon ? (
          <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
            <View style={[styles.rightIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather
                name={rightIcon}
                size={18}
                color={theme.textSecondary}
              />
            </View>
          </Pressable>
        ) : null}
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
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  searchWrapper: {
    borderRadius: BorderRadius.full,
  },
  icon: {
    marginLeft: Spacing.lg,
  },
  rightIcon: {
    paddingRight: Spacing.sm,
  },
  rightIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
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
  inputWithRightIcon: {
    paddingRight: Spacing.xs,
  },
  error: {
    marginTop: Spacing.xs,
  },
});
