import { Audio } from 'expo-av';

/** Play a descending two-tone alert beep. */
export async function playAlertSound(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://cdn.freesound.org/previews/171/171671_2437358-lq.mp3' },
      { shouldPlay: true, volume: 0.6 }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch {
    // Audio unavailable — fail silently
  }
}
