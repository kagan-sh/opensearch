import { Stack, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MessageCard } from "../../components/message-card";
import { SourceSheet } from "../../components/source-sheet";
import { theme } from "../../lib/theme";
import {
  closeSourcesAtom,
  datasourcesAtom,
  hydrateThreadAtom,
  openSourcesAtom,
  preferencesAtom,
  queryDraftAtom,
  runFollowUpAtom,
  stageFollowUpAtom,
  sourceSheetAtom,
  threadStatusAtom,
  threadsAtom,
} from "../../store/app-store";
import type { SearchThread, SearchTurn } from "../../lib/opensearch-client";

export function ThreadScreen() {
  const params = useLocalSearchParams<{ threadId: string }>();
  const threads = useAtomValue(threadsAtom);
  const threadStatus = useAtomValue(threadStatusAtom);
  const preferences = useAtomValue(preferencesAtom);
  const datasources = useAtomValue(datasourcesAtom);
  const sourceSheet = useAtomValue(sourceSheetAtom);
  const [draft, setDraft] = useAtom(queryDraftAtom);
  const hydrateThread = useSetAtom(hydrateThreadAtom);
  const runFollowUp = useSetAtom(runFollowUpAtom);
  const stageFollowUp = useSetAtom(stageFollowUpAtom);
  const openSources = useSetAtom(openSourcesAtom);
  const closeSources = useSetAtom(closeSourcesAtom);
  const threadId = Array.isArray(params.threadId) ? params.threadId[0] : params.threadId;
  const thread = threads.find((entry: SearchThread) => entry.id === threadId) ?? null;

  useEffect(() => {
    if (threadId) {
      hydrateThread(threadId);
    }
  }, [hydrateThread, threadId]);

  const title = thread?.title ?? "Thread";

  const submitFollowUp = async (query: string) => {
    if (!threadId || !query.trim()) {
      return;
    }

    if (preferences.hapticsEnabled) {
      await Haptics.selectionAsync();
    }

    await runFollowUp({ threadId, query });
  };

  return (
    <>
      <Stack.Screen options={{ title }} />
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>Continue the thread with a private follow-up while keeping the same scoped datasource mix.</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>{thread?.turns.length ?? 0} turns</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>{preferences.selectedDatasourceIds.length} sources selected</Text>
                </View>
              </View>
            </View>

            {threadStatus.state === "error" ? <Text style={styles.error}>{threadStatus.message}</Text> : null}

            <View style={styles.list}>
              {thread?.turns.map((turn: SearchTurn) => (
                <MessageCard
                  compactSources={preferences.compactSources}
                  key={turn.id}
                  turn={turn}
                  onStageFollowUp={stageFollowUp}
                  onOpenSources={() => openSources({ title: turn.query, sources: turn.sources })}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.followUpComposer}>
            <Text style={styles.composerLabel}>Next question</Text>
            <TextInput
              multiline
              numberOfLines={3}
              onChangeText={setDraft}
              placeholder="Refine the answer or compare another angle"
              placeholderTextColor={theme.colors.inkSoft}
              style={styles.previewInput}
              value={draft}
            />
            {thread?.turns.at(-1)?.followUps.length ? (
              <View style={styles.stagedFollowUps}>
                {thread.turns.at(-1)?.followUps.map((prompt: string) => (
                  <Pressable key={prompt} onPress={() => stageFollowUp(prompt)} style={styles.followUpChip}>
                    <Text style={styles.followUpText}>{prompt}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Pressable
              disabled={!threadId || threadStatus.state === "loading" || !draft.trim()}
              onPress={() => submitFollowUp(draft)}
              style={[styles.submit, (!threadId || threadStatus.state === "loading" || !draft.trim()) && styles.submitDisabled]}
            >
              <Text style={styles.submitText}>{threadStatus.state === "loading" ? "Sending" : "Send follow-up"}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <SourceSheet
        datasources={datasources}
        onClose={closeSources}
        open={sourceSheet.visible}
        sources={sourceSheet.sources}
        title={sourceSheet.title}
      />
    </>
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
    paddingBottom: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: theme.colors.ink,
  },
  subtitle: {
    color: theme.colors.inkMuted,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  metaPill: {
    minHeight: 36,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  metaText: {
    color: theme.colors.inkMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  error: {
    color: theme.colors.danger,
    fontWeight: "600",
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.md,
  },
  followUpComposer: {
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
  },
  composerLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  previewInput: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.canvasRaised,
    minHeight: 92,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.ink,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  submit: {
    minHeight: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
  },
  submitDisabled: {
    opacity: 0.45,
  },
  submitText: {
    color: "#04110b",
    fontWeight: "800",
  },
  stagedFollowUps: {
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
