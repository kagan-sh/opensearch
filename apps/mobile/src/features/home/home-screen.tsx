import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FilterPills } from "../../components/filter-pills";
import { SearchComposer } from "../../components/search-composer";
import { SourceSheet } from "../../components/source-sheet";
import { ThreadCard } from "../../components/thread-card";
import { resolvedApiBaseUrl, type SearchThread } from "../../lib/opensearch-client";
import { theme } from "../../lib/theme";
import {
  bootstrapStatusAtom,
  closeSourcesAtom,
  datasourcesAtom,
  openSourcesAtom,
  orderedThreadsAtom,
  preferencesAtom,
  queryDraftAtom,
  runSearchAtom,
  searchStatusAtom,
  sourceSheetAtom,
  toggleDatasourceAtom,
} from "../../store/app-store";

export function HomeScreen() {
  const [queryDraft, setQueryDraft] = useAtom(queryDraftAtom);
  const preferences = useAtomValue(preferencesAtom);
  const datasources = useAtomValue(datasourcesAtom);
  const bootstrapStatus = useAtomValue(bootstrapStatusAtom);
  const toggleDatasource = useSetAtom(toggleDatasourceAtom);
  const runSearch = useSetAtom(runSearchAtom);
  const openSources = useSetAtom(openSourcesAtom);
  const closeSources = useSetAtom(closeSourcesAtom);
  const threads = useAtomValue(orderedThreadsAtom);
  const searchStatus = useAtomValue(searchStatusAtom);
  const sourceSheet = useAtomValue(sourceSheetAtom);

  const subtitle = useMemo(() => {
    if (threads.length === 0) {
      return "Dark, minimal search threads with source-backed answers and room for calm follow-ups.";
    }
    return `${threads.length} active thread${threads.length === 1 ? "" : "s"} ready for follow-up.`;
  }, [threads.length]);

  const submitSearch = async () => {
    if (preferences.hapticsEnabled) {
      await Haptics.selectionAsync();
    }

    const threadId = await runSearch();
    if (threadId) {
      router.push(`/thread/${threadId}`);
    }
  };

  const latestTurn = threads[0]?.turns.at(-1);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrow}>OpenSearch mobile</Text>
            <View style={styles.readinessPill}>
              <Text style={styles.readinessText}>iOS simulator ready</Text>
            </View>
          </View>
          <Text style={styles.title}>Search what matters. Reveal the rest when you need it.</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.supportingCopy}>Search across approved memory, code, and web without losing context or drowning the UI in chrome.</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusCopy}>
            <Text style={styles.statusLabel}>Workspace link</Text>
            <Text numberOfLines={1} style={styles.statusValue}>{resolvedApiBaseUrl}</Text>
          </View>
          <Text style={styles.statusHint}>Use the generated dev client, not Expo Go.</Text>
        </View>

        <SearchComposer
          busy={searchStatus.state === "loading"}
          onChangeText={setQueryDraft}
          onSettingsPress={() => router.push("/settings")}
          onSubmit={submitSearch}
          value={queryDraft}
        />

        <FilterPills
          datasources={datasources.filter((datasource: { enabled: boolean }) => datasource.enabled)}
          onToggleSource={toggleDatasource}
          selectedDatasourceIds={preferences.selectedDatasourceIds}
        />

        {bootstrapStatus.state === "loading" ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.loadingText}>Loading approved datasources and saved threads...</Text>
          </View>
        ) : null}

        {bootstrapStatus.state === "error" ? <Text style={styles.error}>{bootstrapStatus.message}</Text> : null}
        {searchStatus.state === "error" ? <Text style={styles.error}>{searchStatus.message}</Text> : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent threads</Text>
          {latestTurn?.sources.length ? (
            <Text
              onPress={() =>
                openSources({
                  title: threads[0].title,
                  sources: latestTurn.sources,
                })
              }
              style={styles.inlineLink}
            >
              Preview sources
            </Text>
          ) : null}
        </View>

        <View style={styles.threadList}>
          {threads.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No threads yet</Text>
              <Text style={styles.emptyCopy}>Run a search and each answer stays in a privacy-first thread with sources and follow-ups.</Text>
            </View>
          ) : (
            threads.map((thread: SearchThread) => (
              <ThreadCard key={thread.id} onPress={() => router.push(`/thread/${thread.id}`)} thread={thread} />
            ))
          )}
        </View>
      </ScrollView>

      <SourceSheet
        datasources={datasources}
        onClose={closeSources}
        open={sourceSheet.visible}
        sources={sourceSheet.sources}
        title={sourceSheet.title}
      />
    </SafeAreaView>
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
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  eyebrow: {
    color: theme.colors.accent,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
  },
  readinessPill: {
    borderRadius: 999,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(125, 247, 195, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  readinessText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  title: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "800",
    color: theme.colors.ink,
  },
  subtitle: {
    color: theme.colors.inkMuted,
    fontSize: 17,
    lineHeight: 24,
  },
  supportingCopy: {
    color: theme.colors.inkSoft,
    lineHeight: 21,
  },
  statusCard: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  statusCopy: {
    gap: 4,
  },
  statusLabel: {
    color: theme.colors.inkSoft,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  statusValue: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  statusHint: {
    color: theme.colors.inkMuted,
    lineHeight: 20,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: 2,
  },
  loadingText: {
    color: theme.colors.inkMuted,
    lineHeight: 20,
  },
  error: {
    color: theme.colors.danger,
    fontWeight: "600",
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  inlineLink: {
    color: theme.colors.accent,
    fontWeight: "700",
  },
  threadList: {
    gap: theme.spacing.sm,
  },
  emptyState: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  emptyCopy: {
    color: theme.colors.inkMuted,
    lineHeight: 22,
  },
});
