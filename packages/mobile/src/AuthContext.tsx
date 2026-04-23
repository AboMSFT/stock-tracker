import { createContext, useContext } from 'react';
import type { User } from '@inwealthment/shared';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuthContext() {
  return useContext(AuthContext);
}
