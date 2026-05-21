import { supabaseAdmin } from '../config/supabase.js';
import { sendError, getPagination } from '../utils/index.js';

// Liste les évaluations d'un projet
export async function listEvaluations(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const { project_id } = req.query;

  if (!project_id) return sendError(res, 400, 'project_id est requis');

  const { data, error, count } = await supabaseAdmin
    .from('evaluations')
    .select('*', { count: 'exact' })
    .eq('project_id', project_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return sendError(res, 500, error.message);

  return res.json({ evaluations: data, total: count, page, limit });
}

// Crée une évaluation (ENCADRANT, JURY)
export async function createEvaluation(req, res) {
  const { project_id, criteres, note, commentaire } = req.body;

  if (!project_id || note === undefined) {
    return sendError(res, 400, 'project_id et note sont obligatoires');
  }
  if (note < 0 || note > 20) {
    return sendError(res, 400, 'La note doit être comprise entre 0 et 20');
  }

  const { data, error } = await supabaseAdmin
    .from('evaluations')
    .insert({ project_id, criteres, note, commentaire, evaluateur_id: req.user.id })
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);

  return res.status(201).json({ evaluation: data });
}

// Détail d'une évaluation
export async function getEvaluation(req, res) {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin.from('evaluations').select('*').eq('id', id).single();

  if (error || !data) return sendError(res, 404, 'Évaluation introuvable');

  return res.json({ evaluation: data });
}

// Modifie une évaluation (ENCADRANT, JURY — et uniquement l'auteur)
export async function updateEvaluation(req, res) {
  const { id } = req.params;
  const { criteres, note, commentaire } = req.body;

  if (note !== undefined && (note < 0 || note > 20)) {
    return sendError(res, 400, 'La note doit être comprise entre 0 et 20');
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('evaluations')
    .select('evaluateur_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) return sendError(res, 404, 'Évaluation introuvable');

  if (existing.evaluateur_id !== req.user.id) {
    return sendError(res, 403, 'Vous ne pouvez modifier que vos propres évaluations');
  }

  const { data, error } = await supabaseAdmin
    .from('evaluations')
    .update({ criteres, note, commentaire })
    .eq('id', id)
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);

  return res.json({ evaluation: data });
}

// Export CSV des évaluations d'un projet (ENCADRANT, JURY)
export async function exportEvaluations(req, res) {
  const { projectId } = req.params;

  const { data, error } = await supabaseAdmin
    .from('evaluations')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) return sendError(res, 500, error.message);
  if (!data.length) return sendError(res, 404, 'Aucune évaluation pour ce projet');

  const headers = ['id', 'project_id', 'evaluateur_id', 'note', 'commentaire', 'created_at'];
  const rows = data.map(e => headers.map(h => JSON.stringify(e[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="evaluations_projet_${projectId}.csv"`);
  return res.send(csv);
}
