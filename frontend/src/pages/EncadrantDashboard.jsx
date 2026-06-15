import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './EncadrantDashboard.css';

const STATUT_LABEL = {
  propose: 'Proposé', valide: 'Validé', en_cours: 'En cours',
  en_retard: 'En retard', livre: 'Livré', soutenu: 'Soutenu', cloture: 'Clôturé',
};
const STATUT_COLOR = {
  propose: 'grey', valide: 'blue', en_cours: 'blue',
  en_retard: 'red', livre: 'green', soutenu: 'green', cloture: 'grey',
};
const HEALTH_COLOR = { bon: 'green', moyen: 'amber', critique: 'red' };
const HEALTH_LABEL = { bon: 'Bon', moyen: 'Moyen', critique: 'Critique' };

// ── Composant GroupeCard ──────────────────────────────────────────────────────
function GroupeCard({ groupe, projetId }) {
  const navigate = useNavigate();
  return (
    <div
      className="enc-groupe-card"
      onClick={() => navigate(`/encadrant/projets/${projetId}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/encadrant/projets/${projetId}`)}
    >
      <div className="enc-groupe-card__header">
        <div className="enc-groupe-card__avatar">
          {groupe.nom.charAt(0).toUpperCase()}
        </div>
        <div className="enc-groupe-card__title-block">
          <span className="enc-groupe-card__nom">{groupe.nom}</span>
          <span className="enc-groupe-card__count">
            {groupe.membres?.length ?? 0} étudiant{(groupe.membres?.length ?? 0) > 1 ? 's' : ''}
          </span>
        </div>
        <span className="enc-groupe-card__cta">Voir →</span>
      </div>
      {groupe.membres?.length > 0 && (
        <div className="enc-groupe-card__membres">
          {groupe.membres.map(m => (
            <div key={m.user_id} className="enc-groupe-card__membre">
              <div className="enc-groupe-card__membre-avatar">
                {(m.nom ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="enc-groupe-card__membre-info">
                <span className="enc-groupe-card__membre-nom">{m.nom ?? 'Inconnu'}</span>
                <span className="enc-groupe-card__membre-email">{m.email ?? ''}</span>
              </div>
              {m.role === 'team_leader' && (
                <span className="enc-groupe-card__leader-badge">Chef</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Composant ProjetSection ───────────────────────────────────────────────────
function ProjetSection({ projet }) {
  const [groupes, setGroupes]   = useState([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [loaded, setLoaded]     = useState(false);

  async function toggle() {
    if (!open && !loaded) {
      setLoading(true);
      try {
        const { data } = await api.get(`/projects/${projet.id}/groupes`);
        setGroupes(data.groupes ?? []);
        setLoaded(true);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    setOpen(o => !o);
  }

  const avancement = projet.stats?.total_taches > 0
    ? Math.round((projet.stats.taches_terminees / projet.stats.total_taches) * 100)
    : 0;

  return (
    <div className={`enc-projet-section${open ? ' enc-projet-section--open' : ''}`}>
      {/* En-tête projet */}
      <button className="enc-projet-section__header" onClick={toggle}>
        <div className="enc-projet-section__left">
          <svg className={`enc-projet-section__chevron${open ? ' enc-projet-section__chevron--open' : ''}`}
            viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <div>
            <span className="enc-projet-section__nom">{projet.nom}</span>
            <span className="enc-projet-section__meta">
              {avancement}% · {projet.stats?.total_taches ?? 0} tâches
            </span>
          </div>
        </div>
        <div className="enc-projet-section__right">
          <span className={`dash-badge dash-badge--${STATUT_COLOR[projet.statut] ?? 'grey'}`}>
            {STATUT_LABEL[projet.statut] ?? projet.statut}
          </span>
          <span className={`enc-health-badge enc-health-badge--${HEALTH_COLOR[projet.health_categorie]}`}>
            {HEALTH_LABEL[projet.health_categorie]} · {projet.health_score}/100
          </span>
        </div>
      </button>

      {/* Corps — groupes */}
      {open && (
        <div className="enc-projet-section__body">
          {loading ? (
            <div className="enc-projet-section__loading">Chargement des groupes…</div>
          ) : groupes.length === 0 ? (
            <div className="enc-projet-section__empty">
              <p>Aucun groupe créé pour ce projet.</p>
              <Link to="/encadrant/projets" className="btn btn--ghost btn--sm">
                Gérer le projet →
              </Link>
            </div>
          ) : (
            <div className="enc-groupes-grid">
              {groupes.map(g => (
                <GroupeCard key={g.id} groupe={g} projetId={projet.id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export default function EncadrantDashboard() {
  const { user } = useAuth();

  const [kpis, setKpis]       = useState(null);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/dashboard');
        setKpis(data.kpis);
        setProjets(data.projets ?? []);
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
            Vue d'ensemble de vos projets et groupes.
          </p>
        </div>
        <Link to="/encadrant/projets" className="dash-welcome__cta">+ Nouveau projet</Link>
      </div>

      {error && <p className="dash-error">{error}</p>}

      {loading ? (
        <div className="dash-loading">Chargement…</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="dash-kpis">
            <div className="dash-kpi">
              <span className="dash-kpi__value">{kpis?.total_projets ?? 0}</span>
              <span className="dash-kpi__label">Projet{kpis?.total_projets > 1 ? 's' : ''}</span>
              <Link to="/encadrant/projets" className="dash-kpi__link">Voir tout</Link>
            </div>
            <div className="dash-kpi dash-kpi--blue">
              <span className="dash-kpi__value">{kpis?.total_etudiants ?? 0}</span>
              <span className="dash-kpi__label">Étudiant{kpis?.total_etudiants > 1 ? 's' : ''}</span>
            </div>
            <div className="dash-kpi dash-kpi--amber">
              <span className="dash-kpi__value">{kpis?.livrables_en_attente ?? 0}</span>
              <span className="dash-kpi__label">Livrables à valider</span>
              <Link to="/encadrant/livrables" className="dash-kpi__link">Voir</Link>
            </div>
            {(kpis?.taches_en_retard ?? 0) > 0 && (
              <div className="dash-kpi dash-kpi--red">
                <span className="dash-kpi__value">{kpis.taches_en_retard}</span>
                <span className="dash-kpi__label">Tâches en retard</span>
              </div>
            )}
            <div className={`dash-kpi dash-kpi--${kpis?.health_score_moyen >= 75 ? 'green' : kpis?.health_score_moyen >= 50 ? 'amber' : 'red'}`}>
              <span className="dash-kpi__value">{kpis?.health_score_moyen ?? 0}</span>
              <span className="dash-kpi__label">Health score moyen</span>
            </div>
          </div>

          {/* Projets & Groupes */}
          <section className="dash-section">
            <div className="dash-section__hd">
              <h2 className="dash-section__title">Mes projets & groupes</h2>
              <span className="dash-section__hint">Cliquez sur un projet pour voir ses groupes</span>
            </div>

            {projets.length === 0 ? (
              <div className="dash-empty">
                <p>Aucun projet supervisé pour le moment.</p>
                <Link to="/encadrant/projets" className="btn btn--primary" style={{ marginTop: '0.75rem' }}>
                  Créer un projet
                </Link>
              </div>
            ) : (
              <div className="enc-projets-list">
                {projets.map(p => (
                  <ProjetSection key={p.id} projet={p} />
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
              <Link to="/encadrant/evaluation" className="dash-ql dash-ql--blue">
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
