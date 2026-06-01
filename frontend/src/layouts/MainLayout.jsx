import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MainLayout.css';

const ROLE_LABEL = {
  etudiant: 'Étudiant',
  team_leader: "Chef d'équipe",
  encadrant: 'Encadrant',
  jury: 'Jury',
};

// Navigation étudiants / team_leader
const NAV_ETUDIANT = [
  {
    to: '/dashboard',
    label: 'Tableau de bord',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M2 10a8 8 0 1016 0A8 8 0 002 10zm5-1h2v5H7V9zm4-3h2v8h-2V6z" /></svg>,
  },
  {
    to: '/projects',
    label: 'Projets',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>,
  },
  {
    to: '/tasks',
    label: 'Tâches',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>,
  },
  {
    to: '/deliverables',
    label: 'Livrables',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>,
  },
  {
    to: '/evaluation',
    label: 'Évaluation',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  },
];

// Navigation encadrant
const NAV_ENCADRANT_FULL = [
  {
    to: '/encadrant/dashboard',
    label: 'Tableau de bord',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M2 10a8 8 0 1016 0A8 8 0 002 10zm5-1h2v5H7V9zm4-3h2v8h-2V6z" /></svg>,
  },
  {
    to: '/projects',
    label: 'Projets étudiants',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>,
  },
  {
    to: '/deliverables',
    label: 'Livrables',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>,
  },
  {
    to: '/evaluation',
    label: 'Évaluations',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  },
];

// Ancien NAV garde le même nom pour ne pas casser le reste
const NAV = NAV_ETUDIANT;

const NAV_ENCADRANT = [
  {
    to: '/encadrant/dashboard',
    label: 'Vue encadrant',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path d="M2 10a8 8 0 1016 0A8 8 0 002 10zm5-1h2v5H7V9zm4-3h2v8h-2V6z" />
      </svg>
    ),
  },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="ml">
      {/* Sidebar */}
      <aside className={`ml__sidebar${mobileOpen ? ' ml__sidebar--open' : ''}`}>
        <div className="ml__sidebar-top">
          <Link to="/" className="ml__logo">PFA3</Link>
          <button className="ml__mobile-close" onClick={() => setMobileOpen(false)}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <nav className="ml__nav">
          {(user?.role === 'encadrant' ? NAV_ENCADRANT_FULL : NAV).map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `ml__nav-link${isActive ? ' ml__nav-link--active' : ''}`
              }
            >
              <span className="ml__nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml__user">
          <div className="ml__user-avatar">
            {user?.nom?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="ml__user-info">
            <span className="ml__user-name">{user?.nom}</span>
            <span className="ml__user-role">{ROLE_LABEL[user?.role] ?? user?.role}</span>
          </div>
          <button className="ml__logout" onClick={handleLogout} title="Se déconnecter">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="ml__overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="ml__main">
        <header className="ml__topbar">
          <button
            className="ml__burger"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="ml__topbar-brand">PFA3</span>
          <div className="ml__topbar-user">
            <span className="ml__topbar-name">{user?.nom}</span>
            <div className="ml__topbar-avatar">{user?.nom?.[0]?.toUpperCase() ?? '?'}</div>
          </div>
        </header>

        <main className="ml__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
