import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yvkekhjsfgyojmnwpknh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TTtrVi9p38msxTmZ5vg3SA_5ToqZuHE';

export const mySupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
