// Custom entry point: suppress benign deprecation warnings BEFORE expo-router
// loads any route modules (including expo-av, Reanimated, etc.)
import './src/suppressWarnings';
import 'expo-router/entry';
