import { supabaseAdmin } from '../config/supabase.js';
import { sendError, getPagination } from '../utils/index.js';
import { createNotification } from './notifications.js';

// ─── GRILLES ────────────────────────────────────────────────────────────────

// Liste les grilles disponibles
export async function listGrilles(req, res) {
  const { data, error } = await supabaseAdmin
    .from('grilles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return sendError(res, 500, error.message);
  return res.json({ grilles: data });
}

// Crée une grille paramétrable (ENCADRANT)
// criteres = [{ nom, description, poids }]  — poids en %, doit totaliser 100
export async function createGrille(req, res) {
  const { nom, description, criteres } = req.body;

  if (!nom || !Array.isArray(criteres) || criteres.length === 0) {
    return sendError(res, 400, 'nom et criteres (tableau) sont obligatoires');
  }

  const totalPoids = criteres.reduce((sum, c) => sum + (Number(c.poids) || 0), 0);
  if (Math.abs(totalPoids - 100) > 0.01) {
    return sendError(res, 400, `La somme des poids doit être 100 (actuellement ${totalPoids})`);
  }

  for (const c of criteres) {
    if (!c.nom || c.poids === undefined) {
      return sendError(res, 400, 'Chaque critère doit avoir un nom et un poids');
    }
  }

  const { data, error } = await supabaseAdmin
    .from('grilles')
    .insert({ nom, description, criteres, createur_id: req.user.id })
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);
  return res.status(201).json({ grille: data });
}

// Détail d'une grille
export async function getGrille(req, res) {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin.from('grilles').select('*').eq('id', id).single();
  if (error || !data) return sendError(res, 404, 'Grille introuvable');
  return res.json({ grille: data });
}

// Modifie une grille (ENCADRANT auteur uniquement)
export async function updateGrille(req, res) {
  const { id } = req.params;
  const { nom, description, criteres } = req.body;

  const { data: existing } = await supabaseAdmin.from('grilles').select('createur_id').eq('id', id).single();
  if (!existing) return sendError(res, 404, 'Grille introuvable');
  if (existing.createur_id !== req.user.id) return sendError(res, 403, 'Vous ne pouvez modifier que vos propres grilles');

  if (criteres !== undefined) {
    const totalPoids = criteres.reduce((sum, c) => sum + (Number(c.poids) || 0), 0);
    if (Math.abs(totalPoids - 100) > 0.01) {
      return sendError(res, 400, `La somme des poids doit être 100 (actuellement ${totalPoids})`);
    }
  }

  const { data, error } = await supabaseAdmin
    .from('grilles')
    .update({ nom, description, criteres })
    .eq('id', id)
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);
  return res.json({ grille: data });
}

// ─── ÉVALUATIONS ────────────────────────────────────────────────────────────

// Calcule la note pondérée à partir des notes par critère et de la grille
function calculerNotePonderee(grille, notesCriteres) {
  let total = 0;
  for (const critere of grille.criteres) {
    const note = notesCriteres[critere.nom];
    if (note === undefined) throw new Error(`Note manquante pour le critère "${critere.nom}"`);
    if (note < 0 || note > 20) throw new Error(`Note invalide pour "${critere.nom}" : doit être entre 0 et 20`);
    total += (note * critere.poids) / 100;
  }
  return Math.round(total * 100) / 100;
}

// Liste les évaluations d'un projet
export async function listEvaluations(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const { project_id } = req.query;

  if (!project_id) return sendError(res, 400, 'project_id est requis');

  const { data, error, count } = await supabaseAdmin
    .from('evaluations')
    .select('*, grilles(nom, criteres)', { count: 'exact' })
    .eq('project_id', project_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return sendError(res, 500, error.message);

  // Enrichir avec le nom du groupe
  let evaluationsAvecGroupe = data ?? [];
  if (evaluationsAvecGroupe.length > 0) {
    const groupeIds = [...new Set(evaluationsAvecGroupe.map(e => e.groupe_id).filter(Boolean))];
    if (groupeIds.length > 0) {
      const { data: groupes } = await supabaseAdmin
        .from('groupes')
        .select('id, nom')
        .in('id', groupeIds);
      const groupeMap = new Map((groupes ?? []).map(g => [g.id, g.nom]));
      evaluationsAvecGroupe = evaluationsAvecGroupe.map(e => ({
        ...e,
        groupe_nom: e.groupe_id ? groupeMap.get(e.groupe_id) ?? null : null,
      }));
    }
  }

  return res.json({ evaluations: evaluationsAvecGroupe, total: count, page, limit });
}

// Crée une évaluation en brouillon (ENCADRANT, JURY)
// notes_criteres = { "Rapport écrit": 15, "Soutenance": 12, ... }
export async function createEvaluation(req, res) {
  const { project_id, groupe_id, grille_id, notes_criteres, commentaire } = req.body;

  if (!project_id || !grille_id || !notes_criteres) {
    return sendError(res, 400, 'project_id, grille_id et notes_criteres sont obligatoires');
  }

  const { data: grille, error: grilleError } = await supabaseAdmin
    .from('grilles')
    .select('*')
    .eq('id', grille_id)
    .single();

  if (grilleError || !grille) return sendError(res, 404, 'Grille introuvable');

  let note;
  try {
    note = calculerNotePonderee(grille, notes_criteres);
  } catch (e) {
    return sendError(res, 400, e.message);
  }

  const { data, error } = await supabaseAdmin
    .from('evaluations')
    .insert({
      project_id,
      groupe_id: groupe_id ?? null,
      grille_id,
      notes_criteres,
      note,
      commentaire,
      evaluateur_id: req.user.id,
      statut: 'brouillon',
    })
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);
  return res.status(201).json({ evaluation: data });
}

// Détail d'une évaluation
export async function getEvaluation(req, res) {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from('evaluations')
    .select('*, grilles(nom, criteres)')
    .eq('id', id)
    .single();

  if (error || !data) return sendError(res, 404, 'Évaluation introuvable');
  return res.json({ evaluation: data });
}

// Modifie une évaluation (brouillon uniquement — auteur seulement)
export async function updateEvaluation(req, res) {
  const { id } = req.params;
  const { notes_criteres, commentaire } = req.body;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('evaluations')
    .select('evaluateur_id, statut, grille_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) return sendError(res, 404, 'Évaluation introuvable');
  if (existing.evaluateur_id !== req.user.id) return sendError(res, 403, 'Vous ne pouvez modifier que vos propres évaluations');
  if (existing.statut === 'soumise') return sendError(res, 403, 'Une évaluation soumise ne peut plus être modifiée');

  let note;
  if (notes_criteres) {
    const { data: grille } = await supabaseAdmin.from('grilles').select('*').eq('id', existing.grille_id).single();
    try {
      note = calculerNotePonderee(grille, notes_criteres);
    } catch (e) {
      return sendError(res, 400, e.message);
    }
  }

  const updates = { commentaire };
  if (notes_criteres) { updates.notes_criteres = notes_criteres; updates.note = note; }

  const { data, error } = await supabaseAdmin
    .from('evaluations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);
  return res.json({ evaluation: data });
}

// Soumet une évaluation (brouillon → soumise) — verrouillage définitif
export async function soumetteEvaluation(req, res) {
  const { id } = req.params;

  const { data: existing } = await supabaseAdmin
    .from('evaluations')
    .select('evaluateur_id, statut, project_id, note, grille_id')
    .eq('id', id)
    .single();

  if (!existing) return sendError(res, 404, 'Évaluation introuvable');
  if (existing.evaluateur_id !== req.user.id) return sendError(res, 403, 'Vous ne pouvez soumettre que vos propres évaluations');
  if (existing.statut === 'soumise') return sendError(res, 400, 'Évaluation déjà soumise');

  const { data, error } = await supabaseAdmin
    .from('evaluations')
    .update({ statut: 'soumise', soumise_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, grilles(nom)')
    .single();

  if (error) return sendError(res, 400, error.message);

  // Notifie les membres du projet (team_leader)
  const { data: members } = await supabaseAdmin
    .from('project_members')
    .select('user_id')
    .eq('project_id', existing.project_id)
    .eq('role', 'team_leader');

  for (const member of members ?? []) {
    await createNotification(
      member.user_id,
      'evaluation_soumise',
      `Votre projet a reçu une évaluation — Note finale : ${existing.note}/20`,
      existing.project_id
    );
  }

  return res.json({ evaluation: data });
}

// Export CSV des évaluations d'un projet (ENCADRANT, JURY)
export async function exportEvaluations(req, res) {
  const { projectId } = req.params;

  const { data, error } = await supabaseAdmin
    .from('evaluations')
    .select('*, grilles(nom)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) return sendError(res, 500, error.message);
  if (!data.length) return sendError(res, 404, 'Aucune évaluation pour ce projet');

  const headers = ['id', 'project_id', 'evaluateur_id', 'grille', 'note', 'statut', 'commentaire', 'soumise_at', 'created_at'];
  const rows = data.map(e => headers.map(h => {
    if (h === 'grille') return JSON.stringify(e.grilles?.nom ?? '');
    return JSON.stringify(e[h] ?? '');
  }).join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="evaluations_projet_${projectId}.csv"`);
  return res.send(csv);
}
