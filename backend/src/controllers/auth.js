import { supabaseAdmin } from '../config/supabase.js';

// TODO: Inscription — crée l'utilisateur Supabase + stocke le rôle dans user_metadata
export async function register(req, res) {}

// TODO: Connexion — délègue à supabase.auth.signInWithPassword, retourne { user, token }
export async function login(req, res) {}

// TODO: Déconnexion — révoque la session via supabaseAdmin.auth.signOut
export async function logout(req, res) {}

// TODO: Profil courant — retourne req.user (injecté par le middleware authenticate)
export async function getMe(req, res) {}
