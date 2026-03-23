import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { theme } from "../lib/theme";

type SearchComposerProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  onSettingsPress: () => void;
  busy?: boolean;
};

export function SearchComposer({ value, onChangeText, onSubmit, onSettingsPress, busy }: SearchComposerProps) {
  const disabled = busy || value.trim().length === 0;

  return (
    <View style={styles.shell}>
      <View style={styles.headerRow}>
        <View style={styles.labelWrap}>
          <Text style={styles.label}>Search privately</Text>
          <Text style={styles.caption}>Scoped to approved memory, code, and web sources.</Text>
        </View>
        <Pressable accessibilityLabel="Open settings" onPress={onSettingsPress} style={styles.iconButton}>
          <Feather color={theme.colors.ink} name="sliders" size={18} />
        </Pressable>
      </View>
      <TextInput
        multiline
        numberOfLines={4}
        placeholder="Ask privately across your approved sources"
        placeholderTextColor={theme.colors.inkSoft}
        returnKeyType="search"
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        style={styles.input}
        value={value}
      />
      <View style={styles.footerRow}>
        <Text style={styles.hint}>{busy ? "Assembling grounded results..." : "Large touch targets. Quiet defaults. Fast handoff to thread detail."}</Text>
        <Pressable disabled={disabled} onPress={onSubmit} style={[styles.submit, disabled && styles.submitDisabled]}>
          <Text style={styles.submitText}>{busy ? "Searching" : "Search"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  labelWrap: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  caption: {
    color: theme.colors.inkMuted,
    lineHeight: 20,
  },
  input: {
    minHeight: 124,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.canvasRaised,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.ink,
    fontSize: 18,
    lineHeight: 26,
    textAlignVertical: "top",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceMuted,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  hint: {
    flex: 1,
    color: theme.colors.inkSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  submit: {
    minWidth: 112,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.md,
  },
  submitDisabled: {
    opacity: 0.45,
  },
  submitText: {
    color: "#04110b",
    fontSize: 15,
    fontWeight: "800",
  },
});
