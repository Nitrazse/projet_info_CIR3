import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './EncadrantProjet.css'; // on réutilise les styles

const STATUT_LABEL = {
  propose: 'Proposé', valide: 'Validé', en_cours: 'En cours',
  en_retard: 'En retard', livre: 'Livré', soutenu: 'Soutenu', cloture: 'Clôturé',
};
const STATUT_COLOR = {
  propose: 'grey', valide: 'blue', en_cours: 'blue',
  en_retard: 'red', livre: 'green', soutenu: 'green', cloture: 'grey',
};
const TASK_STATUT_LABEL = {
  a_faire: 'À faire', en_cours: 'En cours', termine: 'Terminé', bloque: 'Bloqué',
};
const TASK_STATUT_COLOR = {
  a_faire: 'grey', en_cours: 'blue', termine: 'green', bloque: 'red',
};
const LIVRABLE_STATUT_LABEL = { soumis: 'Soumis', valide: 'Validé', rejete: 'Rejeté' };
const LIVRABLE_STATUT_COLOR = { soumis: 'amber', valide: 'green', rejete: 'red' };

const TABS = ['Vue d\'ensemble', 'Tâches', 'Livrables', 'Feedbacks encadrant'];

export default function ProjetDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [jalons, setJalons]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pRes, jRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/projects/${id}/jalons`),
        ]);
        setProject(pRes.data.project);
        setJalons(jRes.data.jalons ?? []);
      } catch {
        setError('Impossible de charger le projet.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="dash-loading">Chargement…</div>;
  if (error)   return <p className="dash-error">{error}</p>;
  if (!project) return null;

  const avancement = project.stats?.total_taches > 0
    ? Math.round((project.stats.taches_terminees / project.stats.total_taches) * 100)
    : 0;

  return (
    <div className="ep">
      {/* Fil d'Ariane */}
      <div className="ep-breadcrumb">
        <Link to="/projects" className="ep-breadcrumb__link">Projets</Link>
        <span className="ep-breadcrumb__sep">›</span>
        <span className="ep-breadcrumb__current">{project.nom}</span>
      </div>

      {/* Bandeau */}
      <div className="ep-banner">
        <div className="ep-banner__left">
          <div className="ep-banner__hd">
            <h1 className="ep-banner__title">{project.nom}</h1>
            <span className={`dash-badge dash-badge--${STATUT_COLOR[project.statut] ?? 'grey'}`}>
              {STATUT_LABEL[project.statut] ?? project.statut}
            </span>
          </div>
          {project.description && <p className="ep-banner__desc">{project.description}</p>}
          <div className="ep-banner__meta">
            {project.date_debut && (
              <span className="ep-banner__meta-item">
                📅 {new Date(project.date_debut).toLocaleDateString('fr-FR')}
                {project.date_fin && ` → ${new Date(project.date_fin).toLocaleDateString('fr-FR')}`}
              </span>
            )}
            <span className="ep-banner__meta-item">
              👥 {project.membres?.length ?? 0} membre{(project.membres?.length ?? 0) > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="ep-banner__progress">
          <div className="ep-banner__progress-circle">
            <svg viewBox="0 0 36 36" width="80" height="80">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke={avancement >= 75 ? '#16a34a' : avancement >= 40 ? '#2563eb' : '#d97706'}
                strokeWidth="3"
                strokeDasharray={`${avancement} ${100 - avancement}`}
                strokeDashoffset="25" strokeLinecap="round" />
            </svg>
            <span className="ep-banner__progress-pct">{avancement}%</span>
          </div>
          <span className="ep-banner__progress-label">Avancement</span>
        </div>
      </div>

      {/* Onglets */}
      <div className="ep-tabs">
        {TABS.map((tab, i) => (
          <button key={tab}
            className={`ep-tabs__btn${activeTab === i ? ' ep-tabs__btn--active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="ep-tab-content">

        {/* VUE D'ENSEMBLE */}
        {activeTab === 0 && (
          <div className="ep-overview">
            <section className="dash-section">
              <h2 className="dash-section__title">Jalons</h2>
              {jalons.length === 0 ? (
                <p className="ep-empty-sm">Aucun jalon défini.</p>
              ) : (
                <div className="ep-jalon-list">
                  {jalons.map(j => (
                    <div key={j.id} className="ep-jalon-item">
                      <div className={`ep-jalon-item__dot ep-jalon-item__dot--${j.statut === 'termine' ? 'green' : j.statut === 'en_cours' ? 'blue' : 'grey'}`} />
                      <div className="ep-jalon-item__info">
                        <span className="ep-jalon-item__titre">{j.titre}</span>
                        {j.description && <span className="ep-jalon-item__desc">{j.description}</span>}
                      </div>
                      <span className="ep-jalon-item__date">
                        {new Date(j.date_echeance).toLocaleDateString('fr-FR')}
                      </span>
                      <span className={`dash-badge dash-badge--${j.statut === 'termine' ? 'green' : j.statut === 'en_cours' ? 'blue' : 'grey'}`}>
                        {j.statut === 'termine' ? 'Terminé' : j.statut === 'en_cours' ? 'En cours' : 'À faire'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TÂCHES */}
        {activeTab === 1 && (
          <section className="dash-section">
            <div className="dash-section__hd">
              <h2 className="dash-section__title">Tâches</h2>
              <Link to={`/tasks?project=${id}`} className="dash-section__more">Gérer les tâches →</Link>
            </div>
            {project.taches?.length === 0 ? (
              <p className="ep-empty-sm">Aucune tâche pour ce projet.</p>
            ) : (
              <div className="ep-tache-list">
                {project.taches?.map(t => (
                  <div key={t.id} className="ep-tache-row">
                    <span className={`ep-tache-row__statut ep-tache-row__statut--${TASK_STATUT_COLOR[t.statut]}`}>
                      {TASK_STATUT_LABEL[t.statut]}
                    </span>
                    <span className="ep-tache-row__titre">{t.titre}</span>
                    {t.date_echeance && (
                      <span className={`ep-tache-row__date${new Date(t.date_echeance) < new Date() && t.statut !== 'termine' ? ' ep-tache-row__date--late' : ''}`}>
                        {new Date(t.date_echeance).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* LIVRABLES */}
        {activeTab === 2 && (
          <section className="dash-section">
            <div className="dash-section__hd">
              <h2 className="dash-section__title">Livrables</h2>
              {['cloture', 'soutenu'].includes(project.statut) ? (
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>🔒 Projet clôturé</span>
              ) : (
                <Link to="/deliverables" className="dash-section__more">Déposer un livrable →</Link>
              )}
            </div>
            {project.livrables?.length === 0 ? (
              <p className="ep-empty-sm">Aucun livrable soumis.</p>
            ) : (
              <div className="ep-livrables">
                {project.livrables?.map(l => (
                  <div key={l.id} className="ep-livrable-row">
                    <div className="ep-livrable-row__info">
                      <span className="ep-livrable-row__nom">{l.nom}</span>
                      <span className="ep-livrable-row__version">v{l.version}</span>
                    </div>
                    <div className="ep-livrable-row__right">
                      <span className={`dash-badge dash-badge--${LIVRABLE_STATUT_COLOR[l.statut]}`}>
                        {LIVRABLE_STATUT_LABEL[l.statut]}
                      </span>
                      <span className="ep-livrable-row__date">
                        {new Date(l.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* FEEDBACKS ENCADRANT */}
        {activeTab === 3 && (
          <section className="dash-section">
            <h2 className="dash-section__title">Feedbacks de l'encadrant</h2>
            {project.feedbacks?.length === 0 ? (
              <p className="ep-empty-sm">Aucun feedback pour l'instant.</p>
            ) : (
              <div className="ep-feedbacks">
                {project.feedbacks?.map(f => (
                  <div key={f.id} className={`ep-feedback ep-feedback--${f.type}`}>
                    <div className="ep-feedback__hd">
                      <span className={`ep-feedback__type ep-feedback__type--${f.type}`}>
                        {f.type === 'alerte' ? '⚠ Alerte' : f.type === 'avancement' ? '📈 Avancement' : f.type === 'livrable' ? '📁 Livrable' : '💬 Général'}
                      </span>
                      <span className="ep-feedback__date">
                        {new Date(f.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="ep-feedback__contenu">{f.contenu}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
