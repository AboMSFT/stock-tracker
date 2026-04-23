import { useEffect } from 'react';
import { View, ActivityIndicator, LogBox } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '@inwealthment/shared';
import { mobileAuthAdapter } from '../src/authAdapter';
import { colors } from '../src/theme';

LogBox.ignoreLogs([
  '[expo-av]',
  'Expo AV has been deprecated',
  'AsyncStorage has been extracted',
  'Setting a timer',
  'onAnimatedValueUpdate',
]);

export default function RootLayout() {
  const { user, loading } = useAuth(mobileAuthAdapter);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [user, loading, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="index" />
        </Stack>
      )}
    </GestureHandlerRootView>
  );
}
