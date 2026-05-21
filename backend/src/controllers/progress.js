import { supabaseAdmin } from '../config/supabase.js';
import { sendError } from '../utils/index.js';

// Calcule l'avancement d'un projet : % tâches terminées + répartition par statut
export async function getProgress(req, res) {
  const { projectId } = req.params;

  const { data: tasks, error } = await supabaseAdmin
    .from('tasks')
    .select('statut')
    .eq('project_id', projectId);

  if (error) return sendError(res, 500, error.message);

  const total = tasks.length;
  const repartition = tasks.reduce((acc, t) => {
    acc[t.statut] = (acc[t.statut] ?? 0) + 1;
    return acc;
  }, {});

  const terminees = repartition['termine'] ?? 0;
  const pourcentage = total > 0 ? Math.round((terminees / total) * 100) : 0;

  // Récupère aussi les points d'avancement manuels enregistrés
  const { data: entries } = await supabaseAdmin
    .from('progress_entries')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(10);

  return res.json({ pourcentage, total, repartition, entries: entries ?? [] });
}

// Enregistre un point d'avancement commenté (ENCADRANT uniquement)
export async function addProgressEntry(req, res) {
  const { projectId } = req.params;
  const { commentaire, pourcentage } = req.body;

  if (!commentaire) return sendError(res, 400, 'commentaire est obligatoire');

  const { data, error } = await supabaseAdmin
    .from('progress_entries')
    .insert({ project_id: projectId, encadrant_id: req.user.id, commentaire, pourcentage })
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);

  return res.status(201).json({ entry: data });
}
