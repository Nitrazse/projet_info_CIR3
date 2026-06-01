import { supabaseAdmin } from '../config/supabase.js';
import { sendError, getPagination } from '../utils/index.js';

// Historique des messages d'un projet (ordre chronologique, paginé)
export async function getMessages(req, res) {
  const { project_id } = req.query;
  const { page, limit, offset } = getPagination(req.query);

  if (!project_id) return sendError(res, 400, 'project_id est requis');

  const { data, error, count } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('project_id', project_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return sendError(res, 500, error.message);

  // Renvoie dans l'ordre chronologique (le plus ancien en premier)
  return res.json({ messages: (data ?? []).reverse(), total: count, page, limit });
}

// Supprime un message (auteur uniquement ou ENCADRANT)
export async function deleteMessage(req, res) {
  const { id } = req.params;

  const { data: msg, error: fetchError } = await supabaseAdmin
    .from('messages')
    .select('auteur_id')
    .eq('id', id)
    .single();

  if (fetchError || !msg) return sendError(res, 404, 'Message introuvable');

  if (msg.auteur_id !== req.user.id && req.user.role !== 'encadrant') {
    return sendError(res, 403, 'Vous ne pouvez supprimer que vos propres messages');
  }

  const { error } = await supabaseAdmin.from('messages').delete().eq('id', id);

  if (error) return sendError(res, 400, error.message);

  return res.status(204).send();
}
