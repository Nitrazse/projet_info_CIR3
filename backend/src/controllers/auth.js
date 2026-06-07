import { supabaseAdmin, createUserClient } from '../config/supabase.js';
import { sendError } from '../utils/index.js';

function getRoleFromEmail(email) {
  if (email.endsWith('@student.junia.com')) return 'etudiant';
  if (
    (email.endsWith('@junia.com') && !email.endsWith('@student.junia.com')) ||
    email.endsWith('@ext.junia.com')
  ) return 'encadrant';
  return null;
}

export async function register(req, res) {
  const { email, password, nom } = req.body;

  if (!email || !password || !nom)
    return sendError(res, 400, 'email, password et nom sont obligatoires');

  const role = getRoleFromEmail(email);
  if (!role)
    return sendError(res, 400, 'Domaine email non autorisé. Utilisez une adresse @student.junia.com, @junia.com ou @ext.junia.com');

  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { role, nom },
    email_confirm: true,
  });

  if (createError) return sendError(res, 400, createError.message);

  // Connexion automatique immédiate après création
  const { data, error: loginError } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (loginError || !data.session)
    return sendError(res, 400, 'Compte créé mais connexion automatique impossible. Connectez-vous manuellement.');

  return res.status(201).json({
    token: data.session.access_token,
    user: {
      id:    data.user.id,
      email: data.user.email,
      role,
      nom,
    },
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password)
    return sendError(res, 400, 'email et password sont obligatoires');

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (error || !data.session)
    return sendError(res, 401, 'Identifiants invalides');

  return res.json({
    token: data.session.access_token,
    user: {
      id:    data.user.id,
      email: data.user.email,
      role:  data.user.user_metadata?.role ?? 'etudiant',
      nom:   data.user.user_metadata?.nom,
    },
  });
}

export async function logout(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    const userClient = createUserClient(token);
    await userClient.auth.signOut();
  }
  return res.json({ message: 'Déconnecté avec succès' });
}

export async function getMe(req, res) {
  return res.json({ user: req.user });
}
