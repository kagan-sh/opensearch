import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../src/lib/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>That screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          Back to search
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.canvas,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.ink,
    textAlign: "center",
  },
  link: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: "600",
  },
});
