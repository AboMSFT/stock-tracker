import { Audio } from 'expo-av';

/** Play a descending two-tone alert beep using expo-av. */
export async function playAlertSound(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync(
      // Inline base64-encoded short beep so no asset file is required.
      // Generated: 880 Hz → 440 Hz sine, 0.6 s, 44100 Hz, mono WAV.
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
