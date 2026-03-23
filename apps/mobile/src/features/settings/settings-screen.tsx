import { useAtomValue, useSetAtom } from "jotai";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { resolvedApiBaseUrl } from "../../lib/opensearch-client";
import { theme } from "../../lib/theme";
import { preferencesAtom, updatePreferenceAtom } from "../../store/app-store";

export function SettingsScreen() {
  const preferences = useAtomValue(preferencesAtom);
  const updatePreference = useSetAtom(updatePreferenceAtom);

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Workspace</Text>
          <Text style={styles.heroTitle}>Native-feeling defaults for private search.</Text>
          <Text style={styles.heroCopy}>This build expects the OpenSearch dev client and uses your Mac-hosted API automatically in the iOS simulator.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Runtime</Text>
          <View style={styles.runtimeCard}>
            <Text style={styles.runtimeLabel}>API base URL</Text>
            <Text style={styles.runtimeValue}>{resolvedApiBaseUrl}</Text>
            <Text style={styles.note}>Override with `EXPO_PUBLIC_OPENSEARCH_API_URL` when you need a remote API target.</Text>
          </View>
          <Text style={styles.note}>Open the installed OpenSearch dev client from `expo start --dev-client`. Expo Go will not match this app's native module graph.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Interaction</Text>
          <SettingRow
            description="Keep a light native tap response when you start a private search or send a follow-up."
            onValueChange={(value) => updatePreference({ key: "hapticsEnabled", value })}
            title="Haptics"
            value={preferences.hapticsEnabled}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Sources</Text>
          <SettingRow
            description="Show compact source counts instead of full titles in each answer card."
            onValueChange={(value) => updatePreference({ key: "compactSources", value })}
            title="Compact source chips"
            value={preferences.compactSources}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Privacy</Text>
          <Text style={styles.note}>OpenSearch keeps assistant search grounded in your approved datasources, so each thread stays scoped and reviewable.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type SettingRowProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function SettingRow({ title, description, value, onValueChange }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        onValueChange={onValueChange}
        thumbColor={theme.colors.surface}
        trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.canvas,
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: theme.colors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  heroCopy: {
    color: theme.colors.inkMuted,
    lineHeight: 22,
  },
  section: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  runtimeCard: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.canvasRaised,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  runtimeLabel: {
    color: theme.colors.inkSoft,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  runtimeValue: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  copy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  rowDescription: {
    color: theme.colors.inkMuted,
    lineHeight: 20,
  },
  note: {
    color: theme.colors.inkMuted,
    lineHeight: 22,
  },
});
