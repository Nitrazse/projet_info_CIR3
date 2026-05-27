import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Tasks.css';

const COLUMNS = [
  { id: 'a_faire',  label: 'À faire',  color: 'grey'  },
  { id: 'en_cours', label: 'En cours', color: 'blue'  },
  { id: 'termine',  label: 'Terminé',  color: 'green' },
  { id: 'bloque',   label: 'Bloqué',   color: 'red'   },
];

function initTask() {
  return { titre: '', description: '', assignee_id: '', date_echeance: '', statut: 'a_faire' };
}

export default function Tasks() {
  const { hasRole } = useAuth();
  const canCreate = hasRole('encadrant', 'team_leader');
  const canDelete = hasRole('encadrant');

  const [searchParams] = useSearchParams();
  const initialProject = searchParams.get('project') ?? '';

  const [projects, setProjects]   = useState([]);
  const [projectId, setProjectId] = useState(initialProject);
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const [modal, setModal]     = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(initTask());
  const [fErr, setFErr]       = useState('');
  const [saving, setSaving]   = useState(false);

  const [dragging, setDragging] = useState(null);

  const [refresh, setRefresh] = useState(0);
  function reload() { setRefresh(r => r + 1); }

  useEffect(() => {
    api.get('/projects?limit=100').then(r => {
      const ps = r.data.projects ?? [];
      setProjects(ps);
      if (!initialProject && ps.length > 0) setProjectId(String(ps[0].id));
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount — initialProject is the stable URL param at mount time

  useEffect(() => {
    if (!projectId) return;
    let alive = true;
    setLoading(true);
    setError('');
    api.get(`/tasks?project_id=${projectId}&limit=200`)
      .then(({ data }) => { if (alive) setTasks(data.tasks ?? []); })
      .catch(() => { if (alive) setError('Impossible de charger les tâches.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [projectId, refresh]);

  async function moveTask(taskId, newStatus) {
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, statut: newStatus } : t));
    try {
      await api.patch(`/tasks/${taskId}/status`, { statut: newStatus });
    } catch {
      reload();
    }
  }

  function onDragStart(e, task) {
    setDragging(task);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function onDrop(e, colId) {
    e.preventDefault();
    if (dragging && dragging.statut !== colId) moveTask(dragging.id, colId);
    setDragging(null);
  }

  function openCreate() {
    setForm(initTask());
    setFErr('');
    setEditing(null);
    setModal('create');
  }

  function openEdit(task) {
    setForm({
      titre:         task.titre,
      description:   task.description ?? '',
      assignee_id:   task.assignee_id ?? '',
      date_echeance: task.date_echeance ? task.date_echeance.substring(0, 10) : '',
      statut:        task.statut,
    });
    setFErr('');
    setEditing(task);
    setModal('edit');
  }

  function closeModal() { setModal(null); setEditing(null); }
  function setF(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })); }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.titre.trim()) { setFErr('Le titre est requis.'); return; }
    setSaving(true);
    setFErr('');
    try {
      if (modal === 'create') {
        await api.post('/tasks', {
          project_id:    projectId,
          titre:         form.titre.trim(),
          description:   form.description.trim() || undefined,
          assignee_id:   form.assignee_id.trim() || undefined,
          date_echeance: form.date_echeance || undefined,
        });
      } else {
        await api.patch(`/tasks/${editing.id}`, {
          titre:         form.titre.trim(),
          description:   form.description.trim() || undefined,
          assignee_id:   form.assignee_id.trim() || undefined,
          date_echeance: form.date_echeance || undefined,
          statut:        form.statut,
        });
      }
      closeModal();
      reload();
    } catch (err) {
      setFErr(err.response?.data?.error ?? 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Supprimer la tâche "${task.titre}" ?`)) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      reload();
    } catch {
      alert('Impossible de supprimer cette tâche.');
    }
  }

  const tasksByCol = Object.fromEntries(
    COLUMNS.map(c => [c.id, tasks.filter(t => t.statut === c.id)])
  );

  return (
    <div className="tasks-page">
      <div className="page-hd">
        <div>
          <h1 className="page-hd__title">Tâches</h1>
          <p className="page-hd__sub">Glissez les cartes entre les colonnes pour changer le statut</p>
        </div>
        {canCreate && projectId && (
          <button className="btn btn--primary" onClick={openCreate}>Nouvelle tâche</button>
        )}
      </div>

      <div className="tasks-selector">
        <label className="fld__label" htmlFor="t-project">Projet</label>
        <select
          id="t-project"
          className="fld__input tasks-select"
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
        >
          <option value="">-- Sélectionner un projet --</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
      </div>

      {error && <p className="page-error">{error}</p>}

      {!projectId ? (
        <div className="page-empty"><p>Sélectionnez un projet pour voir ses tâches.</p></div>
      ) : loading ? (
        <div className="page-loading">Chargement…</div>
      ) : (
        <div className="kanban">
          {COLUMNS.map(col => (
            <div
              key={col.id}
              className={`kanban-col kanban-col--${col.color}`}
              onDragOver={onDragOver}
              onDrop={e => onDrop(e, col.id)}
            >
              <div className="kanban-col__hd">
                <span className="kanban-col__label">{col.label}</span>
                <span className="kanban-col__count">{tasksByCol[col.id].length}</span>
              </div>

              <div className="kanban-col__body">
                {tasksByCol[col.id].length === 0 && (
                  <div className="kanban-empty">Aucune tâche</div>
                )}
                {tasksByCol[col.id].map(task => (
                  <div
                    key={task.id}
                    className={`kanban-card${dragging?.id === task.id ? ' kanban-card--dragging' : ''}`}
                    draggable
                    onDragStart={e => onDragStart(e, task)}
                    onDragEnd={() => setDragging(null)}
                  >
                    <div className="kanban-card__hd">
                      <span className="kanban-card__titre">{task.titre}</span>
                      <div className="kanban-card__actions">
                        {canCreate && (
                          <button className="kbtn" onClick={() => openEdit(task)} title="Modifier">
                            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                        )}
                        {canDelete && (
                          <button className="kbtn kbtn--danger" onClick={() => handleDelete(task)} title="Supprimer">
                            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {task.description && (
                      <p className="kanban-card__desc">{task.description}</p>
                    )}

                    <div className="kanban-card__ft">
                      {task.date_echeance && (
                        <span className="kanban-card__date">
                          {new Date(task.date_echeance).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      <select
                        className="kanban-card__move"
                        value={task.statut}
                        onChange={e => moveTask(task.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                      >
                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__hd">
              <h2 className="modal__title">
                {modal === 'create' ? 'Nouvelle tâche' : 'Modifier la tâche'}
              </h2>
              <button className="modal__close" onClick={closeModal}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {fErr && <p className="modal__error">{fErr}</p>}

            <form onSubmit={handleSave} className="modal__form" noValidate>
              <div className="fld">
                <label className="fld__label" htmlFor="tm-titre">Titre *</label>
                <input id="tm-titre" className="fld__input" value={form.titre} onChange={setF('titre')} placeholder="Titre de la tâche" required />
              </div>
              <div className="fld">
                <label className="fld__label" htmlFor="tm-desc">Description</label>
                <textarea id="tm-desc" className="fld__input fld__textarea" value={form.description} onChange={setF('description')} rows={3} placeholder="Description optionnelle" />
              </div>
              <div className="fld-row">
                <div className="fld">
                  <label className="fld__label" htmlFor="tm-assignee">Assigné (UUID)</label>
                  <input id="tm-assignee" className="fld__input" value={form.assignee_id} onChange={setF('assignee_id')} placeholder="ID utilisateur" />
                </div>
                <div className="fld">
                  <label className="fld__label" htmlFor="tm-date">Échéance</label>
                  <input id="tm-date" className="fld__input" type="date" value={form.date_echeance} onChange={setF('date_echeance')} />
                </div>
              </div>
              {modal === 'edit' && (
                <div className="fld">
                  <label className="fld__label" htmlFor="tm-statut">Statut</label>
                  <select id="tm-statut" className="fld__input" value={form.statut} onChange={setF('statut')}>
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              )}
              <div className="modal__ft">
                <button type="button" className="btn btn--ghost" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : modal === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
