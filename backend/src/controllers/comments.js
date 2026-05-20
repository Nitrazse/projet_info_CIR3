import { supabaseAdmin } from '../config/supabase.js';

// TODO: Liste les commentaires liés à un projet ou une tâche (query param: projectId | taskId)
export async function listComments(req, res) {}

// TODO: Poste un commentaire (auteur = req.user.id)
export async function createComment(req, res) {}

// TODO: Supprime un commentaire (auteur uniquement ou ENCADRANT)
export async function deleteComment(req, res) {}
