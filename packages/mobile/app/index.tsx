import { View, ActivityIndicator } from 'react-native';
import { colors } from '../src/theme';

// Placeholder — _layout.tsx's useEffect handles all auth routing.
export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}
