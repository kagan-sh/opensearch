import { Pressable, StyleSheet, Text, View } from "react-native";

import type { SearchThread } from "../lib/opensearch-client";
import { theme } from "../lib/theme";

type ThreadCardProps = {
  key?: string;
  thread: SearchThread;
  onPress: () => void;
};

export function ThreadCard({ thread, onPress }: ThreadCardProps) {
  const latestTurn = thread.turns.at(-1);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.kickerRow}>
        <Text style={styles.kicker}>Thread</Text>
        <Text style={styles.meta}>{new Date(thread.updatedAt).toLocaleDateString()}</Text>
      </View>
      <Text numberOfLines={2} style={styles.title}>{thread.title}</Text>
      <Text numberOfLines={3} style={styles.answer}>{latestTurn?.answerText ?? latestTurn?.query ?? "Open thread"}</Text>
      <View style={styles.footer}>
        <Text style={styles.turnCount}>{thread.turns.length} turns</Text>
        <Text style={styles.chevron}>Open</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  kickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  kicker: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  answer: {
    color: theme.colors.inkMuted,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meta: {
    color: theme.colors.inkSoft,
    fontSize: 12,
    fontWeight: "600",
  },
  turnCount: {
    color: theme.colors.inkMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  chevron: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
});
