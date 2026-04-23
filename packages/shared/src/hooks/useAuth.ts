import { useState, useEffect, useCallback } from 'react';
import type { AuthAdapter, User, AuthEvent } from '../auth';

export function useAuth(adapter: AuthAdapter) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEvent, setAuthEvent] = useState<AuthEvent | null>(null);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = adapter.onAuthStateChange((u, event) => {
      if (!mounted) return;
      setUser(u);
      setAuthEvent(event);
      setLoading(false);
    });
    return () => { mounted = false; unsubscribe(); };
  }, [adapter]);

  const signUp = useCallback(
    (email: string, password: string) => adapter.signUp(email, password),
    [adapter]
  );
  const signIn = useCallback(
    (email: string, password: string) => adapter.signIn(email, password),
    [adapter]
  );
  const signOut = useCallback(() => adapter.signOut(), [adapter]);
  const resetPassword = useCallback(
    (email: string, redirectTo: string) => adapter.resetPassword(email, redirectTo),
    [adapter]
  );
  const updatePassword = useCallback(
    (newPassword: string) => adapter.updatePassword(newPassword),
    [adapter]
  );

  return { user, loading, authEvent, signUp, signIn, signOut, resetPassword, updatePassword };
}
