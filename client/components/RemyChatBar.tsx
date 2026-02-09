import React, { useState, useRef, useCallback, memo } from "react";
import { StyleSheet, View, TextInput, Pressable, TextInputProps, Image } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import chefsHatIcon from "../assets/images/chefs-hat.png";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface RemyChatBarProps {
  onSubmit: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function RemyChatBarComponent({ onSubmit, placeholder, disabled }: RemyChatBarProps) {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || disabled) return;
    onSubmit(trimmedValue);
    setInputValue("");
    inputRef.current?.blur();
  }, [inputValue, onSubmit, disabled]);

  const handleChangeText = useCallback((text: string) => {
    setInputValue(text);
  }, []);

  return (
    <View style={[styles.remyBar, { backgroundColor: theme.backgroundDefault }]}>
      <View style={[styles.remyAvatar, { backgroundColor: theme.primary }]}>
        <Image source={chefsHatIcon} style={{ width: 24, height: 24, tintColor: "#FFF" }} />
      </View>
      <View style={styles.remyChatInput}>
        <TextInput
          ref={inputRef}
          style={[styles.chatInput, { color: theme.text }]}
          placeholder={placeholder || "Hi! I'm Remi. What can I help you cook?"}
          placeholderTextColor={theme.textSecondary}
          value={inputValue}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          editable={!disabled}
          autoCorrect={true}
          autoCapitalize="sentences"
          blurOnSubmit={false}
        />
        {inputValue.length > 0 ? (
          <Pressable 
            onPress={handleSubmit} 
            style={[styles.sendButton, { backgroundColor: disabled ? theme.textSecondary : theme.primary }]}
            disabled={disabled}
          >
            <Feather name="arrow-right" size={18} color="#FFF" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export const RemyChatBar = memo(RemyChatBarComponent);

const styles = StyleSheet.create({
  remyBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  remyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  remyEmoji: {
    fontSize: 22,
  },
  remyChatInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  chatInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
});
