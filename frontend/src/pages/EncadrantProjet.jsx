import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './EncadrantProjet.css';

// ── Constantes ──────────────────────────────────────────────────────────────
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
const JALON_STATUT_COLOR    = { a_faire: 'grey', en_cours: 'blue', termine: 'green' };

const TABS = ['Vue d\'ensemble', 'Tâches', 'Livrables', 'Communication', 'Évaluation'];

// ── Composant commentaire contextuel ────────────────────────────────────────
function CommentBox({ projectId, onSent }) {
  const [text, setText]     = useState('');
  const [type, setType]     = useState('general');
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true); setErr('');
    try {
      await api.post(`/projects/${projectId}/feedbacks`, { contenu: text.trim(), type });
      setText('');
      onSent?.();
    } catch {
      setErr('Impossible d\'envoyer le feedback.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="ep-comment-box" onSubmit={handleSend}>
      <div className="ep-comment-box__top">
        <select
          className="ep-comment-box__type"
          value={type}
          onChange={e => setType(e.target.value)}
        >
          <option value="general">Général</option>
          <option value="avancement">Avancement</option>
          <option value="livrable">Livrable</option>
          <option value="alerte">⚠ Alerte</option>
        </select>
      </div>
      <textarea
        className="ep-comment-box__input"
        placeholder="Laisser un feedback à l'équipe…"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
      />
      {err && <p className="ep-comment-box__err">{err}</p>}
      <div className="ep-comment-box__ft">
        <button className="ep-comment-box__btn" disabled={saving || !text.trim()}>
          {saving ? 'Envoi…' : 'Envoyer le feedback'}
        </button>
      </div>
    </form>
  );
}

// ── Mini-Gantt jalons ────────────────────────────────────────────────────────
function MiniGantt({ jalons, dateDebut, dateFin }) {
  if (!jalons?.length) return <p className="ep-empty-sm">Aucun jalon défini.</p>;

  const start = new Date(dateDebut || jalons[0]?.date_echeance);
  const end   = new Date(dateFin   || jalons[jalons.length - 1]?.date_echeance);
  const total = Math.max(end - start, 1);
  const today = new Date();

  return (
    <div className="ep-gantt">
      {jalons.map(j => {
        const jDate  = new Date(j.date_echeance);
        const offset = Math.max(0, Math.min(100, ((jDate - start) / total) * 100));
        const isPast = jDate < today && j.statut !== 'termine';
        return (
          <div key={j.id} className="ep-gantt__row">
            <span className="ep-gantt__label">{j.titre}</span>
            <div className="ep-gantt__track">
              <div
                className={`ep-gantt__marker ep-gantt__marker--${JALON_STATUT_COLOR[j.statut]}${isPast ? ' ep-gantt__marker--late' : ''}`}
                style={{ left: `${offset}%` }}
                title={new Date(j.date_echeance).toLocaleDateString('fr-FR')}
              />
            </div>
            <span className="ep-gantt__date">
              {new Date(j.date_echeance).toLocaleDateString('fr-FR')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Kanban lecture seule ─────────────────────────────────────────────────────
function KanbanReadOnly({ taches }) {
  const cols = ['a_faire', 'en_cours', 'termine', 'bloque'];
  return (
    <div className="ep-kanban">
      {cols.map(col => {
        const items = taches.filter(t => t.statut === col);
        return (
          <div key={col} className={`ep-kanban__col ep-kanban__col--${TASK_STATUT_COLOR[col]}`}>
            <div className="ep-kanban__col-hd">
              <span className="ep-kanban__col-title">{TASK_STATUT_LABEL[col]}</span>
              <span className="ep-kanban__col-count">{items.length}</span>
            </div>
            <div className="ep-kanban__cards">
              {items.length === 0 ? (
                <p className="ep-kanban__empty">—</p>
              ) : items.map(t => (
                <div key={t.id} className="ep-kanban__card">
                  <p className="ep-kanban__card-title">{t.titre}</p>
                  {t.date_echeance && (
                    <span className={`ep-kanban__card-date${new Date(t.date_echeance) < new Date() && t.statut !== 'termine' ? ' ep-kanban__card-date--late' : ''}`}>
                      {new Date(t.date_echeance).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function EncadrantProjet() {
  const { id } = useParams();
  const [project, setProject]     = useState(null);
  const [jalons, setJalons]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [refresh, setRefresh]     = useState(0);

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
  }, [id, refresh]);

  function reload() { setRefresh(r => r + 1); }

  if (loading) return <div className="dash-loading">Chargement…</div>;
  if (error)   return <p className="dash-error">{error}</p>;
  if (!project) return null;

  const avancement = project.stats?.total_taches > 0
    ? Math.round((project.stats.taches_terminees / project.stats.total_taches) * 100)
    : 0;

  return (
    <div className="ep">

      {/* ── Fil d'Ariane ── */}
      <div className="ep-breadcrumb">
        <Link to="/encadrant/dashboard" className="ep-breadcrumb__link">Tableau de bord</Link>
        <span className="ep-breadcrumb__sep">›</span>
        <Link to="/projects" className="ep-breadcrumb__link">Projets</Link>
        <span className="ep-breadcrumb__sep">›</span>
        <span className="ep-breadcrumb__current">{project.nom}</span>
      </div>

      {/* ── Bandeau identité projet ── */}
      <div className="ep-banner">
        <div className="ep-banner__left">
          <div className="ep-banner__hd">
            <h1 className="ep-banner__title">{project.nom}</h1>
            <span className={`dash-badge dash-badge--${STATUT_COLOR[project.statut] ?? 'grey'}`}>
              {STATUT_LABEL[project.statut] ?? project.statut}
            </span>
          </div>
          {project.description && (
            <p className="ep-banner__desc">{project.description}</p>
          )}
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
            {project.stats?.note_moyenne !== null && project.stats?.note_moyenne !== undefined && (
              <span className="ep-banner__meta-item">
                ⭐ Note moyenne : {project.stats.note_moyenne}/20
              </span>
            )}
          </div>
        </div>

        {/* Indicateur avancement */}
        <div className="ep-banner__progress">
          <div className="ep-banner__progress-circle">
            <svg viewBox="0 0 36 36" width="80" height="80">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={avancement >= 75 ? '#16a34a' : avancement >= 40 ? '#2563eb' : '#d97706'}
                strokeWidth="3"
                strokeDasharray={`${avancement} ${100 - avancement}`}
                strokeDashoffset="25"
                strokeLinecap="round"
              />
            </svg>
            <span className="ep-banner__progress-pct">{avancement}%</span>
          </div>
          <span className="ep-banner__progress-label">Avancement</span>
        </div>
      </div>

      {/* ── Stats rapides ── */}
      <div className="ep-stats">
        <div className="ep-stat">
          <span className="ep-stat__value">{project.stats?.total_taches ?? 0}</span>
          <span className="ep-stat__label">Tâches</span>
        </div>
        <div className="ep-stat ep-stat--red">
          <span className="ep-stat__value">{project.stats?.taches_en_retard ?? 0}</span>
          <span className="ep-stat__label">En retard</span>
        </div>
        <div className="ep-stat ep-stat--amber">
          <span className="ep-stat__value">{project.stats?.livrables_en_attente ?? 0}</span>
          <span className="ep-stat__label">Livrables à valider</span>
        </div>
        <div className="ep-stat ep-stat--green">
          <span className="ep-stat__value">{project.stats?.livrables_valides ?? 0}</span>
          <span className="ep-stat__label">Livrables validés</span>
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className="ep-tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`ep-tabs__btn${activeTab === i ? ' ep-tabs__btn--active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
            {tab === 'Livrables' && (project.stats?.livrables_en_attente ?? 0) > 0 && (
              <span className="enc-badge-count">{project.stats.livrables_en_attente}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Contenu onglets ── */}
      <div className="ep-tab-content">

        {/* VUE D'ENSEMBLE */}
        {activeTab === 0 && (
          <div className="ep-overview">
            {/* Mini-Gantt */}
            <section className="dash-section">
              <h2 className="dash-section__title">Jalons</h2>
              <MiniGantt jalons={jalons} dateDebut={project.date_debut} dateFin={project.date_fin} />
            </section>

            {/* Équipe */}
            <section className="dash-section">
              <h2 className="dash-section__title">Équipe</h2>
              {project.membres?.length === 0 ? (
                <p className="ep-empty-sm">Aucun membre.</p>
              ) : (
                <div className="ep-team">
                  {project.membres?.map(m => (
                    <div key={m.user_id} className="ep-team__member">
                      <div className="ep-team__avatar">
                        {m.user_id?.slice(0, 1).toUpperCase()}
                      </div>
                      <span className={`dash-badge dash-badge--${m.role === 'team_leader' ? 'blue' : 'grey'}`}>
                        {m.role === 'team_leader' ? 'Chef d\'équipe' : 'Étudiant'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TÂCHES — Kanban lecture seule */}
        {activeTab === 1 && (
          <section className="dash-section">
            <h2 className="dash-section__title">Tâches de l'équipe</h2>
            <KanbanReadOnly taches={project.taches ?? []} />
          </section>
        )}

        {/* LIVRABLES */}
        {activeTab === 2 && (
          <section className="dash-section">
            <h2 className="dash-section__title">Livrables</h2>
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
                      {l.statut === 'soumis' && (
                        <Link to={`/deliverables`} className="ep-livrable-row__action">
                          Valider →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* COMMUNICATION */}
        {activeTab === 3 && (
          <div className="ep-communication">
            <section className="dash-section">
              <h2 className="dash-section__title">Envoyer un feedback</h2>
              <CommentBox projectId={id} onSent={reload} />
            </section>

            <section className="dash-section">
              <h2 className="dash-section__title">Historique des feedbacks</h2>
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
          </div>
        )}

        {/* ÉVALUATION */}
        {activeTab === 4 && (
          <section className="dash-section">
            <h2 className="dash-section__title">Évaluations</h2>
            {project.evaluations?.length === 0 ? (
              <div className="ep-empty-sm">
                <p>Aucune évaluation soumise.</p>
                <Link to="/evaluation" className="dash-empty__link">Créer une évaluation →</Link>
              </div>
            ) : (
              <div className="ep-evaluations">
                {project.evaluations?.map(e => (
                  <div key={e.id} className="ep-eval-row">
                    <div className="ep-eval-row__note">{e.note ?? '—'}/20</div>
                    <div className="ep-eval-row__info">
                      <span className={`dash-badge dash-badge--${e.statut === 'soumise' ? 'green' : 'grey'}`}>
                        {e.statut === 'soumise' ? 'Soumise' : 'Brouillon'}
                      </span>
                      <span className="ep-eval-row__date">
                        {new Date(e.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
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
