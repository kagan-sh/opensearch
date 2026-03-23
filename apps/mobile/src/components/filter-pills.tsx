import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../lib/theme";
import type { Datasource } from "../lib/opensearch-client";

type FilterPillsProps = {
  datasources: Datasource[];
  selectedDatasourceIds: string[];
  onToggleSource: (datasourceId: string) => void;
};

export function FilterPills({ datasources, selectedDatasourceIds, onToggleSource }: FilterPillsProps) {
  return (
    <View style={styles.wrap}>
      {datasources.map((datasource) => {
        const active = selectedDatasourceIds.includes(datasource.id);
        return (
          <Pressable
            key={datasource.id}
            onPress={() => onToggleSource(datasource.id)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{datasource.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  pill: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: "center",
  },
  pillActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accentStrong,
  },
  pillText: {
    color: theme.colors.inkMuted,
    fontWeight: "600",
  },
  pillTextActive: {
    color: theme.colors.accent,
  },
});
