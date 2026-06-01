import { supabaseAdmin } from '../config/supabase.js';
import { sendError } from '../utils/index.js';

// Pondération des statuts pour l'algorithme d'avancement
const STATUS_WEIGHTS = {
  'a_faire': 0,
  'bloque': 0,
  'en_cours': 0.5,
  'termine': 1
};

export async function getProgress(req, res) {
  try {
    const { projectId } = req.params;

    // On récupère TOUTES les colonnes des tâches pour vérifier les dates d'échéance
    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('project_id', projectId);

    if (error) return sendError(res, 500, error.message);

    const total = tasks.length;
    
    // Initialisation de la répartition
    const repartition = { a_faire: 0, en_cours: 0, termine: 0, bloque: 0 };
    let totalPoints = 0;
    const enRetard = [];

    // Date du jour au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // Calcul de la répartition, du score d'avancement et des retards en une seule passe
    tasks.forEach(t => {
      // 1. Répartition
      if (repartition[t.statut] !== undefined) {
        repartition[t.statut]++;
      } else {
        repartition[t.statut] = (repartition[t.statut] ?? 0) + 1;
      }

      // 2. Points pour l'algorithme d'avancement
      const poids = STATUS_WEIGHTS[t.statut] !== undefined ? STATUS_WEIGHTS[t.statut] : 0;
      totalPoints += poids;

      // 3. Identification des tâches en retard
      if (t.date_echeance && t.date_echeance < today && t.statut !== 'termine') {
        enRetard.push({
          id: t.id,
          titre: t.titre,
          statut: t.statut,
          date_echeance: t.date_echeance,
          assignee_id: t.assignee_id
        });
      }
    });

    // Application de la formule pondérée
    const pourcentage = total > 0 ? Math.round((totalPoints / total) * 100) : 0;

    // Récupère aussi les points d'avancement manuels enregistrés (ton code d'origine)
    const { data: entries } = await supabaseAdmin
      .from('progress_entries')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10);

    // On renvoie un Dashboard complet pour les encadrants
    return res.json({ 
      pourcentage, 
      total, 
      repartition, 
      taches_en_retard_compte: enRetard.length,
      taches_en_retard_details: enRetard,
      entries: entries ?? [] 
    });

  } catch (err) {
    return sendError(res, 500, "Erreur interne lors du calcul de la progression");
  }
}

// Enregistre un point d'avancement commenté (ENCADRANT uniquement — ton code d'origine)
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