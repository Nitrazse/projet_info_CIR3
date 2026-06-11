import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar,
} from 'recharts';
import './Progress.css';

const STATUT_COLORS = {
  termine:  '#16a34a',
  en_cours: '#2563eb',
  a_faire:  '#94a3b8',
  bloque:   '#dc2626',
};

const STATUT_LABELS = {
  termine:  'Terminées',
  en_cours: 'En cours',
  a_faire:  'À faire',
  bloque:   'Bloquées',
};

export default function Progress() {
  const { hasRole } = useAuth();
  const isEncadrant = hasRole('encadrant');

  const [projects, setProjects]   = useState([]);
  const [projectId, setProjectId] = useState('');
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Charger les projets
  useEffect(() => {
    api.get('/projects?limit=100').then(r => {
      const ps = r.data.projects ?? [];
      setProjects(ps);
      if (ps.length > 0) setProjectId(String(ps[0].id));
    }).catch(() => {});
  }, []);

  // Charger les données de progression
  useEffect(() => {
    if (!projectId) return;
    let alive = true;
    setLoading(true);
    setError('');
    api.get(`/progress/${projectId}`)
      .then(r => { if (alive) setData(r.data); })
      .catch(() => { if (alive) setError('Impossible de charger la progression.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [projectId]);

  // Données pour le camembert
  const pieData = data ? Object.entries(data.repartition)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name:  STATUT_LABELS[key] ?? key,
      value,
      color: STATUT_COLORS[key] ?? '#94a3b8',
    })) : [];

  // Données pour le bar chart
  const barData = data ? [
    { name: 'À faire',   value: data.repartition.a_faire  ?? 0, fill: STATUT_COLORS.a_faire  },
    { name: 'En cours',  value: data.repartition.en_cours ?? 0, fill: STATUT_COLORS.en_cours },
    { name: 'Terminées', value: data.repartition.termine  ?? 0, fill: STATUT_COLORS.termine  },
    { name: 'Bloquées',  value: data.repartition.bloque   ?? 0, fill: STATUT_COLORS.bloque   },
  ] : [];

  // Données pour la jauge radiale
  const radialData = data ? [
    { name: 'Avancement', value: data.pourcentage, fill: data.pourcentage >= 75 ? '#16a34a' : data.pourcentage >= 40 ? '#2563eb' : '#d97706' },
  ] : [];

  const pctColor = data
    ? data.pourcentage >= 75 ? '#16a34a'
    : data.pourcentage >= 40 ? '#2563eb'
    : '#d97706'
    : '#94a3b8';

  return (
    <div className="progress-page">

      {/* Header */}
      <div className="page-hd">
        <div>
          <h1 className="page-hd__title">Suivi de progression</h1>
          <p className="page-hd__sub">Visualisation de l'avancement par projet</p>
        </div>
      </div>

      {/* Sélecteur de projet */}
      <div className="progress-selector">
        <label className="fld__label" htmlFor="prog-project">Projet</label>
        <select
          id="prog-project"
          className="fld__input progress-select"
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
        >
          <option value="">-- Sélectionner un projet --</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.nom}</option>
          ))}
        </select>
      </div>

      {error && <p className="page-error">{error}</p>}

      {!projectId ? (
        <div className="page-empty"><p>Sélectionnez un projet pour voir sa progression.</p></div>
      ) : loading ? (
        <div className="page-loading">Chargement…</div>
      ) : data ? (
        <>
          {/* KPI cards */}
          <div className="progress-kpis">
            <div className="progress-kpi" style={{ borderTopColor: pctColor }}>
              <span className="progress-kpi__value" style={{ color: pctColor }}>
                {data.pourcentage}%
              </span>
              <span className="progress-kpi__label">Avancement global</span>
            </div>
            <div className="progress-kpi" style={{ borderTopColor: '#2563eb' }}>
              <span className="progress-kpi__value">{data.total}</span>
              <span className="progress-kpi__label">Tâches totales</span>
            </div>
            <div className="progress-kpi" style={{ borderTopColor: '#16a34a' }}>
              <span className="progress-kpi__value">{data.repartition.termine ?? 0}</span>
              <span className="progress-kpi__label">Terminées</span>
            </div>
            {(data.taches_en_retard_compte ?? 0) > 0 && (
              <div className="progress-kpi" style={{ borderTopColor: '#dc2626' }}>
                <span className="progress-kpi__value" style={{ color: '#dc2626' }}>
                  {data.taches_en_retard_compte}
                </span>
                <span className="progress-kpi__label">En retard</span>
              </div>
            )}
          </div>

          {/* Graphiques */}
          <div className="progress-charts">

            {/* Jauge radiale */}
            <div className="progress-chart-card">
              <h3 className="progress-chart-card__title">Avancement global</h3>
              <div className="progress-radial-wrapper">
                <ResponsiveContainer width="100%" height={220}>
                  <RadialBarChart
                    innerRadius="60%"
                    outerRadius="90%"
                    data={radialData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar dataKey="value" max={100} cornerRadius={8} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="progress-radial-label" style={{ color: pctColor }}>
                  {data.pourcentage}%
                </div>
              </div>
            </div>

            {/* Camembert répartition */}
            <div className="progress-chart-card">
              <h3 className="progress-chart-card__title">Répartition des tâches</h3>
              {pieData.length === 0 ? (
                <p className="progress-empty">Aucune tâche.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} tâche${v > 1 ? 's' : ''}`, '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bar chart */}
            <div className="progress-chart-card progress-chart-card--wide">
              <h3 className="progress-chart-card__title">Détail par statut</h3>
              {data.total === 0 ? (
                <p className="progress-empty">Aucune tâche.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(v) => [`${v} tâche${v > 1 ? 's' : ''}`, 'Nombre']}
                      contentStyle={{ borderRadius: '8px', fontSize: '13px' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tâches en retard */}
          {data.taches_en_retard_details?.length > 0 && (
            <section className="dash-section">
              <h2 className="dash-section__title" style={{ color: '#dc2626' }}>
                ⚠ Tâches en retard ({data.taches_en_retard_compte})
              </h2>
              <div className="progress-retard-list">
                {data.taches_en_retard_details.map(t => (
                  <div key={t.id} className="progress-retard-row">
                    <span className="progress-retard-row__titre">{t.titre}</span>
                    <span className="progress-retard-row__statut">{t.statut}</span>
                    <span className="progress-retard-row__date">
                      Échéance : {new Date(t.date_echeance).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}
