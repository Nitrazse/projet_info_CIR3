import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Dashboard.css';

const ROLE_LABEL = {
  etudiant: 'Étudiant',
  team_leader: "Chef d'équipe",
  encadrant: 'Encadrant',
  jury: 'Jury',
};

const STATUT_LABEL = {
  en_cours: 'En cours', termine: 'Terminé', archive: 'Archivé',
  propose: 'Proposé', valide: 'Validé', en_retard: 'En retard',
  livre: 'Livré', soutenu: 'Soutenu', cloture: 'Clôturé',
};

const STATUT_COLOR = {
  en_cours: 'blue', termine: 'green', archive: 'grey',
  propose: 'grey', valide: 'blue', en_retard: 'red',
  livre: 'green', soutenu: 'green', cloture: 'grey',
};

const NOTIF_ICON = {
  livrable_soumis:   '📁',
  livrable_statue:   '✅',
  feedback_encadrant:'💬',
  evaluation_soumise:'⭐',
  tache_assignee:    '📋',
  statut_tache:      '🔄',
};

export default function Dashboard() {
  const { user } = useAuth();

  const [projects, setProjects]         = useState([]);
  const [tasks, setTasks]               = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [feedbacks, setFeedbacks]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [pRes, tRes, nRes] = await Promise.all([
          api.get('/projects?limit=100'),
          api.get(`/tasks?limit=100&assignee_id=${user.id}`),
          api.get('/notifications?limit=10'),
        ]);
        const projs = pRes.data.projects ?? [];
        setProjects(projs);
        setTasks(tRes.data.tasks ?? []);
        setNotifications(nRes.data.notifications ?? []);

        // Charge les feedbacks du premier projet
        if (projs.length > 0) {
          const fRes = await api.get(`/projects/${projs[0].id}/feedbacks?limit=5`);
          setFeedbacks(fRes.data.feedbacks ?? []);
        }
      } catch {
        setError('Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function markAsRead(id) {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
  }

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
  }

  const tasksByStatus = {
    a_faire:  tasks.filter(t => t.statut === 'a_faire').length,
    en_cours: tasks.filter(t => t.statut === 'en_cours').length,
    termine:  tasks.filter(t => t.statut === 'termine').length,
    bloque:   tasks.filter(t => t.statut === 'bloque').length,
  };

  function projectProgress(pid) {
    const pts = tasks.filter(t => t.project_id === pid);
    if (!pts.length) return 0;
    return Math.round((pts.filter(t => t.statut === 'termine').length / pts.length) * 100);
  }

  const recentProjects  = [...projects].slice(0, 5);
  const unreadCount     = notifications.filter(n => !n.lu).length;

  return (
    <div className="dashboard">
      {/* Welcome */}
      <div className="dash-welcome">
        <div>
          <h1 className="dash-welcome__title">Bonjour, {user?.nom}</h1>
          <p className="dash-welcome__sub">
            <span className={`dash-role-badge dash-role-badge--${user?.role}`}>
              {ROLE_LABEL[user?.role] ?? user?.role}
            </span>
            Voici un aperçu de votre activité.
          </p>
        </div>
        <Link to="/projects" className="dash-welcome__cta">Voir les projets</Link>
      </div>

      {error && <p className="dash-error">{error}</p>}

      {loading ? (
        <div className="dash-loading">Chargement…</div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="dash-kpis">
            <div className="dash-kpi">
              <span className="dash-kpi__value">{projects.length}</span>
              <span className="dash-kpi__label">Projet{projects.length > 1 ? 's' : ''}</span>
              <Link to="/projects" className="dash-kpi__link">Voir tout</Link>
            </div>
            <div className="dash-kpi dash-kpi--blue">
              <span className="dash-kpi__value">{tasksByStatus.en_cours}</span>
              <span className="dash-kpi__label">Tâches en cours</span>
              <Link to="/tasks" className="dash-kpi__link">Voir tout</Link>
            </div>
            <div className="dash-kpi dash-kpi--amber">
              <span className="dash-kpi__value">{tasksByStatus.a_faire}</span>
              <span className="dash-kpi__label">À faire</span>
              <Link to="/tasks" className="dash-kpi__link">Voir tout</Link>
            </div>
            <div className="dash-kpi dash-kpi--green">
              <span className="dash-kpi__value">{tasksByStatus.termine}</span>
              <span className="dash-kpi__label">Terminées</span>
              <Link to="/tasks" className="dash-kpi__link">Voir tout</Link>
            </div>
            {tasksByStatus.bloque > 0 && (
              <div className="dash-kpi dash-kpi--red">
                <span className="dash-kpi__value">{tasksByStatus.bloque}</span>
                <span className="dash-kpi__label">Bloquées</span>
                <Link to="/tasks" className="dash-kpi__link">Voir tout</Link>
              </div>
            )}
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <section className="dash-section">
              <div className="dash-section__hd">
                <h2 className="dash-section__title">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="dash-notif-badge">{unreadCount}</span>
                  )}
                </h2>
                {unreadCount > 0 && (
                  <button className="dash-section__more" onClick={markAllRead}>
                    Tout marquer comme lu
                  </button>
                )}
              </div>
              <div className="dash-notif-list">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`dash-notif${n.lu ? ' dash-notif--read' : ''}`}
                    onClick={() => !n.lu && markAsRead(n.id)}
                  >
                    <span className="dash-notif__icon">
                      {NOTIF_ICON[n.type] ?? '🔔'}
                    </span>
                    <div className="dash-notif__body">
                      <p className="dash-notif__msg">{n.message}</p>
                      <span className="dash-notif__date">
                        {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!n.lu && <span className="dash-notif__dot" />}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Feedbacks encadrant */}
          {feedbacks.length > 0 && (
            <section className="dash-section">
              <h2 className="dash-section__title">Feedbacks de votre encadrant</h2>
              <div className="dash-feedbacks">
                {feedbacks.map(f => (
                  <div key={f.id} className={`dash-feedback dash-feedback--${f.type}`}>
                    <div className="dash-feedback__hd">
                      <span className="dash-feedback__type">
                        {f.type === 'alerte' ? '⚠ Alerte' : f.type === 'avancement' ? '📈 Avancement' : f.type === 'livrable' ? '📁 Livrable' : '💬 Général'}
                      </span>
                      <span className="dash-feedback__date">
                        {new Date(f.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="dash-feedback__contenu">{f.contenu}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent projects */}
          <section className="dash-section">
            <div className="dash-section__hd">
              <h2 className="dash-section__title">Projets récents</h2>
              <Link to="/projects" className="dash-section__more">Tout voir</Link>
            </div>
            {recentProjects.length === 0 ? (
              <div className="dash-empty">
                <p>Aucun projet pour le moment.</p>
              </div>
            ) : (
              <div className="dash-project-list">
                {recentProjects.map(p => {
                  const pct = projectProgress(p.id);
                  return (
                    <div key={p.id} className="dash-project-card">
                      <div className="dash-project-card__hd">
                        <h3 className="dash-project-card__name">{p.nom}</h3>
                        <span className={`dash-badge dash-badge--${STATUT_COLOR[p.statut] ?? 'grey'}`}>
                          {STATUT_LABEL[p.statut] ?? p.statut}
                        </span>
                      </div>
                      {p.description && (
                        <p className="dash-project-card__desc">{p.description}</p>
                      )}
                      <div className="dash-progress">
                        <div className="dash-progress__bar">
                          <div className="dash-progress__fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="dash-progress__label">{pct}% des tâches terminées</span>
                      </div>
                      <div className="dash-project-card__ft">
                        {p.date_debut && (
                          <span className="dash-project-card__date">
                            Du {new Date(p.date_debut).toLocaleDateString('fr-FR')}
                            {p.date_fin ? ` au ${new Date(p.date_fin).toLocaleDateString('fr-FR')}` : ''}
                          </span>
                        )}
                        <Link to={`/tasks?project=${p.id}`} className="dash-project-card__link">
                          Voir les tâches
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick links */}
          <section className="dash-section">
            <h2 className="dash-section__title">Accès rapide</h2>
            <div className="dash-quick-links">
              <Link to="/tasks" className="dash-ql dash-ql--blue">
                <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span>Kanban des tâches</span>
              </Link>
              <Link to="/deliverables" className="dash-ql dash-ql--amber">
                <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Déposer un livrable</span>
              </Link>
              <Link to="/evaluation" className="dash-ql dash-ql--blue">
                <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24">
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
