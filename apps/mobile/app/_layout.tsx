import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider as JotaiProvider, useSetAtom } from "jotai";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { theme } from "../src/lib/theme";
import { bootstrapAppAtom } from "../src/store/app-store";

export default function RootLayout() {
  return (
    <JotaiProvider>
      <RootNavigator />
    </JotaiProvider>
  );
}

function RootNavigator() {
  const bootstrap = useSetAtom(bootstrapAppAtom);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.colors.canvas },
          headerTitleStyle: {
            color: theme.colors.ink,
            fontSize: 17,
            fontWeight: "700",
          },
          contentStyle: { backgroundColor: theme.colors.canvas },
          headerTintColor: theme.colors.ink,
          headerBackButtonDisplayMode: "minimal",
          animation: "fade_from_bottom",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="thread/[threadId]" options={{ title: "Thread" }} />
        <Stack.Screen
          name="settings"
          options={{
            presentation: "formSheet",
            title: "Workspace",
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen name="+not-found" options={{ title: "Not found" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
