import { supabaseAdmin, createUserClient } from '../config/supabase.js';
import { sendError } from '../utils/index.js';

const ALLOWED_ROLES = ['etudiant', 'team_leader', 'encadrant', 'jury'];

// Inscription — Supabase hache le mot de passe avec bcrypt avant de le stocker
export async function register(req, res) {
  const { email, password, role = 'etudiant', nom } = req.body;

  if (!email || !password || !nom) {
    return sendError(res, 400, 'email, password et nom sont obligatoires');
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return sendError(res, 400, `Rôle invalide. Valeurs acceptées : ${ALLOWED_ROLES.join(', ')}`);
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { role, nom },
    email_confirm: true,
  });

  if (error) return sendError(res, 400, error.message);

  return res.status(201).json({
    user: {
      id: data.user.id,
      email: data.user.email,
      role,
      nom,
    },
  });
}

// Connexion — retourne le JWT Supabase (access_token) à utiliser dans les requêtes suivantes
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, 'email et password sont obligatoires');
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return sendError(res, 401, 'Identifiants invalides');
  }

  return res.json({
    token: data.session.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role ?? 'etudiant',
      nom: data.user.user_metadata?.nom,
    },
  });
}

// Déconnexion — révoque la session côté Supabase
export async function logout(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    const userClient = createUserClient(token);
    await userClient.auth.signOut();
  }
  return res.json({ message: 'Déconnecté avec succès' });
}

// Profil courant — req.user est injecté par le middleware authenticate
export async function getMe(req, res) {
  return res.json({ user: req.user });
}
