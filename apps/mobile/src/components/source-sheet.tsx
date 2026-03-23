import { BlurView } from "expo-blur";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Datasource, SearchSource } from "../lib/opensearch-client";
import { theme } from "../lib/theme";

type SourceSheetProps = {
  open: boolean;
  title: string;
  sources: SearchSource[];
  datasources: Datasource[];
  onClose: () => void;
};

export function SourceSheet({ open, title, sources, datasources, onClose }: SourceSheetProps) {
  const datasourceLookup = Object.fromEntries(datasources.map((datasource) => [datasource.id, datasource]));

  return (
    <Modal animationType="slide" presentationStyle="overFullScreen" transparent visible={open} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
      </Pressable>
      <SafeAreaView edges={["bottom"]} style={styles.sheetSafeArea}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text numberOfLines={1} style={styles.title}>{title}</Text>
              <Text style={styles.caption}>{sources.length} supporting source{sources.length === 1 ? "" : "s"}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeLabel}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {sources.map((source) => (
              <View key={source.id} style={styles.card}>
                <Text style={styles.kind}>
                  {datasourceLookup[source.datasourceId]?.label ?? source.datasourceId} · {source.category}
                </Text>
                <Text style={styles.cardTitle}>{source.title}</Text>
                <Text style={styles.snippet}>{source.snippet ?? source.content ?? "No excerpt available."}</Text>
                {source.url ? <Text numberOfLines={1} style={styles.url}>{source.url}</Text> : null}
              </View>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
  },
  sheetSafeArea: {
    marginTop: "auto",
  },
  sheet: {
    maxHeight: "80%",
    backgroundColor: theme.colors.surfaceElevated,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  handle: {
    alignSelf: "center",
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  caption: {
    color: theme.colors.inkMuted,
  },
  closeButton: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  closeLabel: {
    color: theme.colors.ink,
    fontWeight: "700",
  },
  list: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  card: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.canvasRaised,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  kind: {
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 0.8,
    color: theme.colors.inkSoft,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  snippet: {
    color: theme.colors.inkMuted,
    lineHeight: 20,
  },
  url: {
    color: theme.colors.accent,
    fontSize: 12,
  },
});
