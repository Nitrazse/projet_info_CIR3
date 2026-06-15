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
  const [project, setProject]         = useState(null);
  const [jalons, setJalons]           = useState([]);
  const [groupes, setGroupes]         = useState([]);
  const [selectedGroupe, setSelectedGroupe] = useState(null); // groupe cliqué
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [activeTab, setActiveTab]     = useState(0);
  const [refresh, setRefresh]         = useState(0);
  const [taskModal, setTaskModal]     = useState(false);
  const [taskForm, setTaskForm]       = useState({ titre: '', description: '', date_echeance: '' });
  const [taskErr, setTaskErr]         = useState('');
  const [taskSaving, setTaskSaving]   = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pRes, jRes, gRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/projects/${id}/jalons`),
          api.get(`/projects/${id}/groupes`),
        ]);
        setProject(pRes.data.project);
        setJalons(jRes.data.jalons ?? []);
        setGroupes(gRes.data.groupes ?? []);
      } catch {
        setError('Impossible de charger le projet.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, refresh]);

  function reload() { setRefresh(r => r + 1); }

  async function handleCreateTask(e) {
    e.preventDefault();
    if (!taskForm.titre.trim()) { setTaskErr('Le titre est requis.'); return; }
    setTaskSaving(true); setTaskErr('');
    try {
      await api.post('/tasks', {
        project_id: id,
        titre: taskForm.titre.trim(),
        description: taskForm.description.trim() || undefined,
        date_echeance: taskForm.date_echeance || undefined,
        statut: 'a_faire',
      });
      setTaskModal(false);
      setTaskForm({ titre: '', description: '', date_echeance: '' });
      reload();
    } catch (err) {
      setTaskErr(err.response?.data?.error ?? 'Erreur lors de la création.');
    } finally {
      setTaskSaving(false);
    }
  }

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
            <select
              className="ep-statut-select"
              value={project.statut}
              onChange={async e => {
                await api.patch(`/projects/${id}`, { statut: e.target.value });
                reload();
              }}
            >
              {Object.entries(STATUT_LABEL).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
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

      {/* ── Groupes ── */}
      <section className="dash-section">
        <div className="dash-section__hd">
          <h2 className="dash-section__title">Groupes d'étudiants</h2>
          <span style={{fontSize:'0.8rem',color:'#94a3b8'}}>Cliquez sur un groupe pour voir ses membres</span>
        </div>
        {groupes.length === 0 ? (
          <p style={{fontSize:'0.85rem',color:'#94a3b8'}}>Aucun groupe créé pour ce projet.</p>
        ) : (
          <div className="enc-groupes-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'0.75rem'}}>
            {groupes.map(g => (
              <div
                key={g.id}
                onClick={() => setSelectedGroupe(selectedGroupe?.id === g.id ? null : g)}
                style={{
                  background: selectedGroupe?.id === g.id ? '#eff6ff' : '#fff',
                  border: `1px solid ${selectedGroupe?.id === g.id ? '#2563eb' : '#e2e8f0'}`,
                  borderRadius: '10px', padding: '0.9rem', cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{display:'flex',alignItems:'center',gap:'0.6rem',marginBottom:'0.6rem'}}>
                  <div style={{
                    width:34,height:34,borderRadius:9,background:'#2563eb',color:'#fff',
                    display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0
                  }}>
                    {g.nom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:'0.9rem',color:'#1e293b'}}>{g.nom}</div>
                    <div style={{fontSize:'0.72rem',color:'#94a3b8'}}>{g.membres?.length ?? 0} étudiant{(g.membres?.length ?? 0) > 1 ? 's' : ''}</div>
                  </div>
                </div>
                {/* Membres visibles */}
                {g.membres?.map(m => (
                  <div key={m.user_id} style={{display:'flex',alignItems:'center',gap:'0.5rem',marginTop:'0.4rem'}}>
                    <div style={{
                      width:26,height:26,borderRadius:'50%',background:'#e2e8f0',color:'#475569',
                      fontSize:'0.72rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0
                    }}>
                      {(m.nom ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'0.82rem',fontWeight:600,color:'#1e293b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.nom ?? 'Inconnu'}</div>
                      <div style={{fontSize:'0.7rem',color:'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.email}</div>
                    </div>
                    {m.role === 'team_leader' && (
                      <span style={{fontSize:'0.65rem',fontWeight:700,color:'#2563eb',background:'rgba(37,99,235,0.1)',padding:'1px 6px',borderRadius:999}}>Chef</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Infos groupe sélectionné ── */}
      {!selectedGroupe ? (
        <div style={{background:'#f8fafc',border:'1px dashed #e2e8f0',borderRadius:12,padding:'2rem',textAlign:'center',color:'#94a3b8',fontSize:'0.9rem'}}>
          👆 Cliquez sur un groupe pour voir ses informations détaillées
        </div>
      ) : (
        <>
          {/* Header groupe */}
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem 1rem',background:'#eff6ff',borderRadius:10,border:'1px solid #bfdbfe'}}>
            <div style={{width:36,height:36,borderRadius:9,background:'#2563eb',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'1rem'}}>
              {selectedGroupe.nom.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{fontWeight:700,color:'#1e293b'}}>{selectedGroupe.nom}</div>
              <div style={{fontSize:'0.75rem',color:'#64748b'}}>{selectedGroupe.membres?.length ?? 0} étudiant{(selectedGroupe.membres?.length ?? 0) > 1 ? 's' : ''}</div>
            </div>
            <button onClick={() => setSelectedGroupe(null)} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',fontSize:'1.2rem'}}>✕</button>
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
              <h2 className="dash-section__title">
                {selectedGroupe ? `Membres — ${selectedGroupe.nom}` : 'Équipe'}
              </h2>
              {(selectedGroupe ? selectedGroupe.membres : project.membres)?.length === 0 ? (
                <p className="ep-empty-sm">Aucun membre.</p>
              ) : (
                <div className="ep-team">
                  {(selectedGroupe ? selectedGroupe.membres : project.membres)?.map(m => (
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

        {/* TÂCHES */}
        {activeTab === 1 && (
          <section className="dash-section">
            <div className="dash-section__hd">
              <h2 className="dash-section__title">Tâches de l'équipe</h2>
              {['cloture', 'soutenu'].includes(project.statut) ? (
                <span className="ep-locked-hint">🔒 Projet clôturé</span>
              ) : (
                <button className="ep-add-task-btn" onClick={() => setTaskModal(true)}>
                  + Nouvelle tâche
                </button>
              )}
            </div>
            <KanbanReadOnly taches={
              selectedGroupe
                ? (project.taches ?? []).filter(t =>
                    selectedGroupe.membres?.some(m => m.user_id === t.assignee_id)
                  )
                : (project.taches ?? [])
            } />
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

      {/* Modale nouvelle tâche */}
      {taskModal && (
        <div className="modal-overlay" onClick={() => setTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__hd">
              <h2 className="modal__title">Nouvelle tâche</h2>
              <button className="modal__close" onClick={() => setTaskModal(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {taskErr && <p className="modal__error">{taskErr}</p>}
            <form onSubmit={handleCreateTask} className="modal__form" noValidate>
              <div className="fld">
                <label className="fld__label" htmlFor="t-titre">Titre *</label>
                <input id="t-titre" className="fld__input" value={taskForm.titre}
                  onChange={e => setTaskForm(f => ({ ...f, titre: e.target.value }))}
                  placeholder="Ex: Rédiger le rapport final" />
              </div>
              <div className="fld">
                <label className="fld__label" htmlFor="t-desc">Description</label>
                <textarea id="t-desc" className="fld__input fld__textarea" rows={3}
                  value={taskForm.description}
                  onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Détails de la tâche…" />
              </div>
              <div className="fld">
                <label className="fld__label" htmlFor="t-date">Date d'échéance</label>
                <input id="t-date" className="fld__input" type="date"
                  value={taskForm.date_echeance}
                  onChange={e => setTaskForm(f => ({ ...f, date_echeance: e.target.value }))} />
              </div>
              <div className="modal__ft">
                <button type="button" className="btn btn--ghost" onClick={() => setTaskModal(false)}>Annuler</button>
                <button type="submit" className="btn btn--primary" disabled={taskSaving}>
                  {taskSaving ? 'Création…' : 'Créer la tâche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
