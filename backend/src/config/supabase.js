import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY obligatoires dans .env');
}

// Crée toujours un client frais pour éviter les connexions stale
function makeFreshClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (...args) => fetch(...args) },
  });
}

// Proxy : chaque accès à supabaseAdmin crée un client frais
export const supabaseAdmin = new Proxy({}, {
  get(_, prop) {
    return makeFreshClient()[prop];
  }
});

export function createFreshAdmin() {
  return makeFreshClient();
}

// Client scoped au JWT de l'utilisateur — respecte les RLS Supabase
export function createUserClient(token) {
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
