import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MainLayout.css';

const navLinks = [
  { to: '/dashboard', label: 'Tableau de bord' },
  { to: '/projects', label: 'Projets' },
  { to: '/tasks', label: 'Tâches' },
  { to: '/deliverables', label: 'Livrables' },
  { to: '/evaluation', label: 'Évaluation' },
];

export default function MainLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <header className="layout__header">
        <span className="layout__logo">Projets CIR</span>
        <div className="layout__user">
          <span>{user?.nom}</span>
          <button onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <div className="layout__body">
        <nav className="layout__sidebar">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link--active' : 'nav-link'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
