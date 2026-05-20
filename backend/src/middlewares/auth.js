import { supabaseAdmin } from '../config/supabase.js';

// Vérifie le JWT Supabase et attache req.user à la requête
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou mal formaté' });
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }

  // Attache l'utilisateur à la requête pour les middlewares/contrôleurs suivants
  req.user = {
    id: data.user.id,
    email: data.user.email,
    role: data.user.user_metadata?.role ?? 'etudiant',
    token, // utile pour créer un client Supabase scopé à l'utilisateur
  };

  next();
}
