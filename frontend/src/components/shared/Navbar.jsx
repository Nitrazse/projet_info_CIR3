import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#features', anchor: true },
  { label: 'À propos', to: '/about', anchor: false },
  { label: 'Contact', href: '#contact', anchor: true },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  function handleNavClick() {
    setOpen(false);
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand" onClick={handleNavClick}>
          <span className="navbar__brand-name">PFA3</span>
        </Link>

        <nav className={`navbar__nav${open ? ' navbar__nav--open' : ''}`}>
          {NAV_LINKS.map((l) =>
            l.anchor
              ? <a key={l.href} href={l.href} className="navbar__link" onClick={handleNavClick}>{l.label}</a>
              : <Link key={l.to} to={l.to} className="navbar__link" onClick={handleNavClick}>{l.label}</Link>
          )}
        </nav>

        <div className="navbar__actions">
          <Link to="/login" className="navbar__btn navbar__btn--ghost">
            Se connecter
          </Link>
          <Link to="/register" className="navbar__btn navbar__btn--primary">
            S'inscrire
          </Link>
        </div>

        <button
          className={`navbar__burger${open ? ' navbar__burger--open' : ''}`}
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {open && (
        <div className="navbar__mobile-menu">
          {NAV_LINKS.map((l) =>
            l.anchor
              ? <a key={l.href} href={l.href} className="navbar__mobile-link" onClick={handleNavClick}>{l.label}</a>
              : <Link key={l.to} to={l.to} className="navbar__mobile-link" onClick={handleNavClick}>{l.label}</Link>
          )}
          <div className="navbar__mobile-actions">
            <Link to="/login" className="navbar__btn navbar__btn--ghost" onClick={handleNavClick}>
              Se connecter
            </Link>
            <Link to="/register" className="navbar__btn navbar__btn--primary" onClick={handleNavClick}>
              S'inscrire
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
