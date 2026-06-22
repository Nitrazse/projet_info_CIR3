import { supabaseAdmin } from '../config/supabase.js';
import { sendError } from '../utils/index.js';

// ─── ALGORITHME HEALTH SCORE ──────────────────────────────────────────────────
// Score sur 100 basé sur 4 critères pondérés :
//   - Avancement tâches       : 40 pts
//   - Activité récente        : 20 pts
//   - Respect des jalons      : 20 pts
//   - Proximité des échéances : 20 pts

function calculerHealthScore({ tasks, jalons, derniereLivraison }) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // 1. Avancement tâches (40 pts)
  const total = tasks.length;
  let scoreAvancement = 0;
  if (total > 0) {
    const points = tasks.reduce((sum, t) => {
      if (t.statut === 'termine') return sum + 1;
      if (t.statut === 'en_cours') return sum + 0.5;
      return sum;
    }, 0);
    scoreAvancement = (points / total) * 40;
  } else {
    scoreAvancement = 40; // pas de tâches = pas de pénalité
  }

  // 2. Activité récente (20 pts) — au moins une action dans les 7 derniers jours
  let scoreActivite = 0;
  if (derniereLivraison) {
    const joursInactif = Math.floor((today - new Date(derniereLivraison)) / (1000 * 60 * 60 * 24));
    if (joursInactif <= 3) scoreActivite = 20;
    else if (joursInactif <= 7) scoreActivite = 15;
    else if (joursInactif <= 14) scoreActivite = 8;
    else scoreActivite = 0;
  }

  // 3. Respect des jalons (20 pts) — jalons non respectés = pénalité
  let scoreJalons = 20;
  if (jalons.length > 0) {
    const jalonsEnRetard = jalons.filter(j => j.date_echeance < todayStr && j.statut !== 'termine');
    scoreJalons = Math.max(0, 20 - jalonsEnRetard.length * 7);
  }

  // 4. Proximité des échéances (20 pts) — tâches en retard = pénalité
  let scoreEcheances = 20;
  const tachesEnRetard = tasks.filter(t => t.date_echeance && t.date_echeance < todayStr && t.statut !== 'termine');
  const ratioRetard = total > 0 ? tachesEnRetard.length / total : 0;
  scoreEcheances = Math.max(0, Math.round(20 * (1 - ratioRetard)));

  const score = Math.round(scoreAvancement + scoreActivite + scoreJalons + scoreEcheances);

  // Catégorie
  let categorie;
  if (score >= 75) categorie = 'bon';
  else if (score >= 50) categorie = 'moyen';
  else categorie = 'critique';

  return { score, categorie, details: { scoreAvancement: Math.round(scoreAvancement), scoreActivite, scoreJalons, scoreEcheances } };
}

// ─── API DASHBOARD ────────────────────────────────────────────────────────────

// GET /api/dashboard — KPIs globaux + liste projets supervisés + distribution santé
export async function getDashboard(req, res) {
  const encadrantId = req.user.id;

  // Récupère tous les projets supervisés par cet encadrant
  const { data: projects, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('encadrant_id', encadrantId)
    .order('created_at', { ascending: false });

  if (error) return sendError(res, 500, error.message);
  if (!projects.length) {
    return res.json({ kpis: viderKpis(), projets: [], distribution_sante: { bon: 0, moyen: 0, critique: 0 } });
  }

  const projectIds = projects.map(p => p.id);

  // Requêtes agrégées en parallèle
  const [
    { data: allTasks },
    { data: allDeliverables },
    { data: allMembers },
    { data: allJalons },
    { data: allEvaluations },
  ] = await Promise.all([
    supabaseAdmin.from('tasks').select('id, project_id, statut, date_echeance, created_at').in('project_id', projectIds),
    supabaseAdmin.from('deliverables').select('id, project_id, statut, created_at').in('project_id', projectIds),
    supabaseAdmin.from('project_members').select('project_id, user_id, role').in('project_id', projectIds),
    supabaseAdmin.from('jalons').select('id, project_id, titre, date_echeance, statut').in('project_id', projectIds),
    supabaseAdmin.from('evaluations').select('project_id, note').in('project_id', projectIds).eq('statut', 'soumise'),
  ]);

  const today = new Date().toISOString().split('T')[0];

  // Construit les données par projet + health score
  const projetsAvecSante = projects.map(project => {
    const tasks = allTasks?.filter(t => t.project_id === project.id) ?? [];
    const deliverables = allDeliverables?.filter(d => d.project_id === project.id) ?? [];
    const members = allMembers?.filter(m => m.project_id === project.id) ?? [];
    const jalons = allJalons?.filter(j => j.project_id === project.id) ?? [];
    const evaluations = allEvaluations?.filter(e => e.project_id === project.id) ?? [];

    const derniereLivraison = deliverables.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.created_at ?? null;

    const { score, categorie, details } = calculerHealthScore({ tasks, jalons, derniereLivraison });

    const tachesEnRetard = tasks.filter(t => t.date_echeance && t.date_echeance < today && t.statut !== 'termine');
    const notesMoyenne = evaluations.length
      ? Math.round((evaluations.reduce((s, e) => s + (e.note ?? 0), 0) / evaluations.length) * 100) / 100
      : null;

    return {
      ...project,
      health_score: score,
      health_categorie: categorie,
      health_details: details,
      stats: {
        total_membres: members.length,
        total_taches: tasks.length,
        taches_terminees: tasks.filter(t => t.statut === 'termine').length,
        taches_en_retard: tachesEnRetard.length,
        livrables_en_attente: deliverables.filter(d => d.statut === 'soumis').length,
        livrables_valides: deliverables.filter(d => d.statut === 'valide').length,
        jalons_respectes: jalons.filter(j => j.statut === 'termine').length,
        total_jalons: jalons.length,
        note_moyenne: notesMoyenne,
      },
    };
  });

  // Distribution santé
  const distribution_sante = projetsAvecSante.reduce(
    (acc, p) => { acc[p.health_categorie]++; return acc; },
    { bon: 0, moyen: 0, critique: 0 }
  );

  // KPIs globaux
  const kpis = {
    total_projets: projects.length,
    projets_par_statut: projects.reduce((acc, p) => { acc[p.statut] = (acc[p.statut] ?? 0) + 1; return acc; }, {}),
    total_etudiants: new Set(allMembers?.filter(m => ['etudiant', 'team_leader'].includes(m.role)).map(m => m.user_id)).size,
    total_taches: allTasks?.length ?? 0,
    taches_en_retard: allTasks?.filter(t => t.date_echeance && t.date_echeance < today && t.statut !== 'termine').length ?? 0,
    livrables_en_attente: allDeliverables?.filter(d => d.statut === 'soumis').length ?? 0,
    health_score_moyen: projetsAvecSante.length
      ? Math.round(projetsAvecSante.reduce((s, p) => s + p.health_score, 0) / projetsAvecSante.length)
      : 0,
  };

  return res.json({ kpis, projets: projetsAvecSante, distribution_sante });
}

// GET /api/dashboard/project/:id/health — health score détaillé d'un projet
export async function getProjectHealth(req, res) {
  const { id } = req.params;

  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('encadrant_id', req.user.id)
    .single();

  if (error || !project) return sendError(res, 404, 'Projet introuvable ou non autorisé');

  const today = new Date().toISOString().split('T')[0];

  const [{ data: tasks }, { data: jalons }, { data: deliverables }] = await Promise.all([
    supabaseAdmin.from('tasks').select('id, statut, date_echeance, created_at').eq('project_id', id),
    supabaseAdmin.from('jalons').select('id, titre, date_echeance, statut').eq('project_id', id),
    supabaseAdmin.from('deliverables').select('id, statut, created_at').eq('project_id', id).order('created_at', { ascending: false }).limit(1),
  ]);

  const derniereLivraison = deliverables?.[0]?.created_at ?? null;
  const { score, categorie, details } = calculerHealthScore({ tasks: tasks ?? [], jalons: jalons ?? [], derniereLivraison });

  const tachesEnRetard = (tasks ?? []).filter(t => t.date_echeance && t.date_echeance < today && t.statut !== 'termine');
  const jalonsEnRetard = (jalons ?? []).filter(j => j.date_echeance < today && j.statut !== 'termine');

  return res.json({
    project_id: id,
    health_score: score,
    health_categorie: categorie,
    health_details: details,
    taches_en_retard: tachesEnRetard,
    jalons_en_retard: jalonsEnRetard,
  });
}

function viderKpis() {
  return {
    total_projets: 0,
    projets_par_statut: {},
    total_etudiants: 0,
    total_taches: 0,
    taches_en_retard: 0,
    livrables_en_attente: 0,
    health_score_moyen: 0,
  };
}
