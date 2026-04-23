import type { AuthAdapter, User, AuthEvent } from '@inwealthment/shared';
import { supabase } from './supabase';

function toUser(u: { id: string; email?: string } | null): User | null {
  if (!u || !u.email) return null;
  return { id: u.id, email: u.email };
}

export const webAuthAdapter: AuthAdapter = {
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { user: toUser(data.user), error: error?.message ?? null };
  },
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: toUser(data.user), error: error?.message ?? null };
  },
  async signOut() {
    await supabase.auth.signOut();
  },
  async resetPassword(email, redirectTo) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { error: error?.message ?? null };
  },
  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  },
  onAuthStateChange(cb) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      cb(toUser(session?.user ?? null), event as AuthEvent);
    });
    return () => subscription.unsubscribe();
  },
};
