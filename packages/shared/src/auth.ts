export type AuthEvent =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'PASSWORD_RECOVERY'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED';

export interface User {
  id: string;
  email: string;
}

export interface AuthAdapter {
  signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }>;
  signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }>;
  signOut(): Promise<void>;
  resetPassword(email: string, redirectTo: string): Promise<{ error: string | null }>;
  updatePassword(newPassword: string): Promise<{ error: string | null }>;
  onAuthStateChange(cb: (user: User | null, event: AuthEvent) => void): () => void;
}
