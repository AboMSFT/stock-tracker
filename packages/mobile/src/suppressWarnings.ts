/**
 * Patches console.warn before any other module initializes so benign
 * deprecation and animation warnings never reach LogBox.
 * Import this as the FIRST import in app/_layout.tsx.
 */
const SUPPRESSED = [
  'expo-av',
  'Expo AV has been deprecated',
  'onAnimatedValueUpdate',
  'AsyncStorage has been extracted',
];

const _warn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (SUPPRESSED.some((s) => msg.includes(s))) return;
  _warn(...args);
};
