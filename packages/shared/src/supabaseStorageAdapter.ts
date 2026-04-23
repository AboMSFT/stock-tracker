import type { StorageAdapter } from './storage';

/**
 * Creates a Supabase-backed StorageAdapter. Requires a `user_storage` table:
 *
 *   create table user_storage (
 *     user_id uuid references auth.users(id) on delete cascade not null,
 *     key     text not null,
 *     value   text not null,
 *     updated_at timestamptz default now() not null,
 *     primary key (user_id, key)
 *   );
 *   alter table user_storage enable row level security;
 *   create policy "Users manage their own storage"
 *     on user_storage for all
 *     using  (auth.uid() = user_id)
 *     with check (auth.uid() = user_id);
 *
 * @param supabase  A Supabase client instance (web or mobile).
 * @param userId    The authenticated user's ID. Pass '' to get a no-op adapter.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSupabaseStorageAdapter(supabase: any, userId: string): StorageAdapter {
  return {
    async getItem(key: string) {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_storage')
        .select('value')
        .eq('user_id', userId)
        .eq('key', key)
        .maybeSingle();
      if (error) throw new Error(`[supabase-storage] read failed: ${error.message}`);
      return data?.value ?? null;
    },

    async setItem(key: string, value: string) {
      if (!userId) return;
      const { error } = await supabase.from('user_storage').upsert(
        { user_id: userId, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' }
      );
      if (error) throw new Error(`[supabase-storage] write failed: ${error.message}`);
    },
  };
}
