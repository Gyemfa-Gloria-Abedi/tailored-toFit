import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from "../auth/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
      </Stack>
    </AuthProvider>
  );
}
