import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// expo-av is deprecated in SDK 53 but works fine; the native module is compiled
// into the binary. Migration to expo-audio requires a native rebuild — suppress
// the deprecation warning until we do that upgrade.
LogBox.ignoreLogs(['[expo-av]']);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
