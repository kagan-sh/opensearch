import { Pressable, StyleSheet, Text, View } from "react-native";

import type { SearchTurn } from "../lib/opensearch-client";
import { theme } from "../lib/theme";

type MessageCardProps = {
  key?: string;
  turn: SearchTurn;
  compactSources: boolean;
  onOpenSources: () => void;
  onStageFollowUp: (query: string) => void;
};

export function MessageCard({ turn, compactSources, onOpenSources, onStageFollowUp }: MessageCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>Query</Text>
        <Text style={styles.status}>{turn.status === "completed" ? "Grounded" : "Working"}</Text>
      </View>
      <Text style={styles.query}>{turn.query}</Text>

      <Text style={styles.label}>Answer</Text>
      <Text style={styles.answer}>{turn.answerText || "Working on an answer..."}</Text>

      {turn.sources.length > 0 ? (
        <Pressable onPress={onOpenSources} style={styles.sourcesButton}>
          <Text style={styles.sourcesLabel}>
            {compactSources ? `${turn.sources.length} sources` : turn.sources.map((source) => source.title).slice(0, 2).join(" · ")}
          </Text>
        </Pressable>
      ) : null}

      {turn.followUps.length > 0 ? (
        <View style={styles.followUps}>
          {turn.followUps.map((suggestion) => (
            <Pressable key={suggestion} onPress={() => onStageFollowUp(suggestion)} style={styles.followUpChip}>
              <Text style={styles.followUpText}>{suggestion}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.colors.inkSoft,
  },
  status: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  query: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
    color: theme.colors.ink,
  },
  answer: {
    fontSize: 15,
    lineHeight: 24,
    color: theme.colors.ink,
  },
  sourcesButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(125, 247, 195, 0.22)",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  sourcesLabel: {
    color: theme.colors.accent,
    fontWeight: "700",
  },
  followUps: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  followUpChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  followUpText: {
    color: theme.colors.ink,
    fontWeight: "600",
  },
});
