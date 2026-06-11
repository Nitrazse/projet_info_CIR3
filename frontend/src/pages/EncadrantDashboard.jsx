import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './EncadrantDashboard.css';

const STATUT_LABEL = {
  propose:   'Proposé',
  valide:    'Validé',
  en_cours:  'En cours',
  en_retard: 'En retard',
  livre:     'Livré',
  soutenu:   'Soutenu',
  cloture:   'Clôturé',
};

const STATUT_COLOR = {
  propose:   'grey',
  valide:    'blue',
  en_cours:  'blue',
  en_retard: 'red',
  livre:     'green',
  soutenu:   'green',
  cloture:   'grey',
};

const HEALTH_COLOR = {
  bon:      'green',
  moyen:    'amber',
  critique: 'red',
};

const HEALTH_LABEL = {
  bon:      'Bon',
  moyen:    'Moyen',
  critique: 'Critique',
};

export default function EncadrantDashboard() {
  const { user } = useAuth();

  const [kpis, setKpis]                     = useState(null);
  const [projets, setProjets]               = useState([]);
  const [distribution, setDistribution]     = useState({ bon: 0, moyen: 0, critique: 0 });
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/dashboard');
        setKpis(data.kpis);
        setProjets(data.projets ?? []);
        setDistribution(data.distribution_sante ?? { bon: 0, moyen: 0, critique: 0 });
      } catch {
        setError('Impossible de charger le tableau de bord.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="enc-dashboard">
      {/* Welcome */}
      <div className="dash-welcome">
        <div>
          <h1 className="dash-welcome__title">Bonjour, {user?.nom}</h1>
          <p className="dash-welcome__sub">
            <span className="dash-role-badge dash-role-badge--encadrant">Encadrant</span>
            Vue d'ensemble de vos projets supervisés.
          </p>
        </div>
        <Link to="/encadrant/projets" className="dash-welcome__cta">Mes projets</Link>
      </div>

      {error && <p className="dash-error">{error}</p>}

      {loading ? (
        <div className="dash-loading">Chargement…</div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="dash-kpis">
            <div className="dash-kpi">
              <span className="dash-kpi__value">{kpis?.total_projets ?? 0}</span>
              <span className="dash-kpi__label">Projet{kpis?.total_projets > 1 ? 's' : ''} supervisé{kpis?.total_projets > 1 ? 's' : ''}</span>
              <Link to="/encadrant/projets" className="dash-kpi__link">Voir tout</Link>
            </div>
            <div className="dash-kpi dash-kpi--blue">
              <span className="dash-kpi__value">{kpis?.total_etudiants ?? 0}</span>
              <span className="dash-kpi__label">Étudiant{kpis?.total_etudiants > 1 ? 's' : ''}</span>
            </div>
            <div className="dash-kpi dash-kpi--amber">
              <span className="dash-kpi__value">{kpis?.livrables_en_attente ?? 0}</span>
              <span className="dash-kpi__label">Livrable{kpis?.livrables_en_attente > 1 ? 's' : ''} à valider</span>
              <Link to="/encadrant/livrables" className="dash-kpi__link">Voir tout</Link>
            </div>
            {(kpis?.taches_en_retard ?? 0) > 0 && (
              <div className="dash-kpi dash-kpi--red">
                <span className="dash-kpi__value">{kpis.taches_en_retard}</span>
                <span className="dash-kpi__label">Tâche{kpis.taches_en_retard > 1 ? 's' : ''} en retard</span>
              </div>
            )}
            <div className={`dash-kpi dash-kpi--${kpis?.health_score_moyen >= 75 ? 'green' : kpis?.health_score_moyen >= 50 ? 'amber' : 'red'}`}>
              <span className="dash-kpi__value">{kpis?.health_score_moyen ?? 0}</span>
              <span className="dash-kpi__label">Health score moyen</span>
            </div>
          </div>

          {/* Liste projets */}
          <section className="dash-section">
            <div className="dash-section__hd">
              <h2 className="dash-section__title">Projets supervisés</h2>
              <Link to="/encadrant/projets" className="dash-section__more">Tout voir</Link>
            </div>

            {projets.length === 0 ? (
              <div className="dash-empty">
                <p>Aucun projet supervisé pour le moment.</p>
                <Link to="/encadrant/projets" className="dash-empty__link">Créer un projet</Link>
              </div>
            ) : (
              <div className="dash-project-list">
                {projets.map(p => (
                  <div key={p.id} className="dash-project-card">
                    <div className="dash-project-card__hd">
                      <h3 className="dash-project-card__name">{p.nom}</h3>
                      <div className="enc-card-badges">
                        <span className={`dash-badge dash-badge--${STATUT_COLOR[p.statut] ?? 'grey'}`}>
                          {STATUT_LABEL[p.statut] ?? p.statut}
                        </span>
                        <span className={`enc-health-badge enc-health-badge--${HEALTH_COLOR[p.health_categorie]}`}>
                          {HEALTH_LABEL[p.health_categorie]} · {p.health_score}/100
                        </span>
                      </div>
                    </div>

                    {p.description && (
                      <p className="dash-project-card__desc">{p.description}</p>
                    )}

                    {/* Barre avancement */}
                    <div className="dash-progress">
                      <div className="dash-progress__bar">
                        <div
                          className="dash-progress__fill"
                          style={{ width: `${p.stats?.total_taches > 0 ? Math.round((p.stats.taches_terminees / p.stats.total_taches) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="dash-progress__label">
                        {p.stats?.taches_terminees ?? 0}/{p.stats?.total_taches ?? 0} tâches
                      </span>
                    </div>

                    {/* Stats mini */}
                    <div className="enc-card-stats">
                      {p.stats?.livrables_en_attente > 0 && (
                        <span className="enc-card-stat enc-card-stat--amber">
                          {p.stats.livrables_en_attente} livrable{p.stats.livrables_en_attente > 1 ? 's' : ''} à valider
                        </span>
                      )}
                      {p.stats?.taches_en_retard > 0 && (
                        <span className="enc-card-stat enc-card-stat--red">
                          {p.stats.taches_en_retard} en retard
                        </span>
                      )}
                      <span className="enc-card-stat">
                        {p.stats?.total_membres ?? 0} membre{p.stats?.total_membres > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="dash-project-card__ft">
                      {p.date_fin && (
                        <span className="dash-project-card__date">
                          Échéance : {new Date(p.date_fin).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      <Link to={`/encadrant/projets/${p.id}`} className="dash-project-card__link">
                        Voir le détail →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Accès rapide */}
          <section className="dash-section">
            <h2 className="dash-section__title">Accès rapide</h2>
            <div className="dash-quick-links">
              <Link to="/encadrant/livrables" className="dash-ql dash-ql--amber">
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Livrables à valider</span>
                {(kpis?.livrables_en_attente ?? 0) > 0 && (
                  <span className="enc-badge-count">{kpis.livrables_en_attente}</span>
                )}
              </Link>
              <Link to="/encadrant/projets" className="dash-ql dash-ql--blue">
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <span>Mes projets</span>
              </Link>
              <Link to="/evaluation" className="dash-ql dash-ql--blue">
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Évaluations</span>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
