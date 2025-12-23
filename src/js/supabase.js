// public/js/supabase.js
import { createClient } from '@supabase/supabase-js';
import { CFG } from './src/js/config.js';

export const sb = createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: { params: { eventsPerSecond: 10 } }
});
