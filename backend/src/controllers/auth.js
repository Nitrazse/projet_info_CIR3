import { supabaseAdmin, createUserClient } from '../config/supabase.js';
import { sendError } from '../utils/index.js';
import { sendOtpEmail } from '../services/mailer.js';

const ALLOWED_ROLES = ['etudiant', 'team_leader', 'encadrant', 'jury'];
const OTP_TTL_MS = 3 * 60 * 1000;

function validateEmailForRole(email, role) {
  if (process.env.NODE_ENV === 'development' && email.endsWith('@gmail.com')) return null;

  if (['etudiant', 'team_leader'].includes(role)) {
    if (!email.endsWith('@student.junia.com'))
      return 'Les étudiants et team leaders doivent utiliser une adresse @student.junia.com';
  } else if (['encadrant', 'jury'].includes(role)) {
    const valid =
      (email.endsWith('@junia.com') && !email.endsWith('@student.junia.com')) ||
      email.endsWith('@ext.junia.com');
    if (!valid)
      return 'Les encadrants et jurys doivent utiliser une adresse @junia.com ou @ext.junia.com';
  }
  return null;
}

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function register(req, res) {
  const { email, password, role = 'etudiant', nom } = req.body;

  if (!email || !password || !nom)
    return sendError(res, 400, 'email, password et nom sont obligatoires');
  if (!ALLOWED_ROLES.includes(role))
    return sendError(res, 400, `Rôle invalide. Valeurs acceptées : ${ALLOWED_ROLES.join(', ')}`);

  const emailError = validateEmailForRole(email, role);
  if (emailError) return sendError(res, 400, emailError);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { role, nom },
    email_confirm: false,
  });

  if (error) return sendError(res, 400, error.message);

  await supabaseAdmin.from('otp_codes').delete().eq('email', email);

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  await supabaseAdmin
    .from('otp_codes')
    .insert({ user_id: data.user.id, email, code, expires_at: expiresAt });

  try {
    await sendOtpEmail(email, code);
  } catch (mailErr) {
    console.error('Erreur envoi email OTP:', mailErr.message);
  }

  return res.status(201).json({
    message: 'Compte créé. Un code de vérification à 4 chiffres a été envoyé.',
    email,
  });
}

export async function verifyOtp(req, res) {
  const { email, code } = req.body;
  if (!email || !code) return sendError(res, 400, 'email et code sont obligatoires');

  const { data: record, error } = await supabaseAdmin
    .from('otp_codes')
    .select('*')
    .eq('email', email)
    .eq('code', String(code))
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !record) return sendError(res, 400, 'Code invalide');
  if (new Date() > new Date(record.expires_at))
    return sendError(res, 400, 'Code expiré. Cliquez sur "Renvoyer un code".');

  await supabaseAdmin.auth.admin.updateUserById(record.user_id, { email_confirm: true });
  await supabaseAdmin.from('otp_codes').delete().eq('id', record.id);

  return res.json({ verified: true, email: record.email });
}

export async function resendOtp(req, res) {
  const { email } = req.body;
  if (!email) return sendError(res, 400, 'email est obligatoire');

  let userId;
  const { data: existing } = await supabaseAdmin
    .from('otp_codes')
    .select('user_id')
    .eq('email', email)
    .limit(1)
    .single();

  if (existing?.user_id) {
    userId = existing.user_id;
  } else {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) return sendError(res, 404, 'Aucun compte trouvé pour cet email');
    userId = user.id;
  }

  await supabaseAdmin.from('otp_codes').delete().eq('email', email);

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  await supabaseAdmin
    .from('otp_codes')
    .insert({ user_id: userId, email, code, expires_at: expiresAt });

  try {
    await sendOtpEmail(email, code);
  } catch (mailErr) {
    return sendError(res, 500, "Impossible d'envoyer l'email.");
  }

  return res.json({ message: 'Nouveau code envoyé. Il expire dans 3 minutes.' });
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
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role ?? 'etudiant',
      nom: data.user.user_metadata?.nom,
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
