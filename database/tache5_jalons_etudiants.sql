-- Tâche 5 — Jalons et étudiants disponibles
-- À exécuter dans Supabase SQL Editor

-- Vue pour accéder aux profils utilisateurs depuis auth.users
-- (Supabase ne permet pas d'interroger auth.users directement depuis le backend JS)
CREATE OR REPLACE VIEW users_view AS
SELECT
  id,
  email,
  raw_user_meta_data->>'nom'  AS nom,
  raw_user_meta_data->>'role' AS role
FROM auth.users;

-- Permet au service role de lire la vue
GRANT SELECT ON users_view TO service_role;
