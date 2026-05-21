import { supabaseAdmin } from '../config/supabase.js';
import { sendError, getPagination } from '../utils/index.js';

// Liste les commentaires d'un projet ou d'une tâche
export async function listComments(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const { project_id, task_id } = req.query;

  if (!project_id && !task_id) {
    return sendError(res, 400, 'project_id ou task_id est requis');
  }

  let query = supabaseAdmin.from('comments').select('*', { count: 'exact' }).order('created_at', { ascending: true });

  if (project_id) query = query.eq('project_id', project_id);
  if (task_id) query = query.eq('task_id', task_id);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return sendError(res, 500, error.message);

  return res.json({ comments: data, total: count, page, limit });
}

// Poste un commentaire (auteur = utilisateur connecté)
export async function createComment(req, res) {
  const { project_id, task_id, contenu } = req.body;

  if (!contenu) return sendError(res, 400, 'contenu est obligatoire');
  if (!project_id && !task_id) return sendError(res, 400, 'project_id ou task_id est requis');

  const { data, error } = await supabaseAdmin
    .from('comments')
    .insert({ project_id, task_id, contenu, auteur_id: req.user.id })
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);

  return res.status(201).json({ comment: data });
}

// Supprime un commentaire (auteur uniquement ou ENCADRANT)
export async function deleteComment(req, res) {
  const { id } = req.params;
  const { id: userId, role } = req.user;

  const { data: comment, error: fetchError } = await supabaseAdmin
    .from('comments')
    .select('auteur_id')
    .eq('id', id)
    .single();

  if (fetchError || !comment) return sendError(res, 404, 'Commentaire introuvable');

  if (comment.auteur_id !== userId && role !== 'encadrant') {
    return sendError(res, 403, 'Vous ne pouvez supprimer que vos propres commentaires');
  }

  const { error } = await supabaseAdmin.from('comments').delete().eq('id', id);

  if (error) return sendError(res, 400, error.message);

  return res.status(204).send();
}
