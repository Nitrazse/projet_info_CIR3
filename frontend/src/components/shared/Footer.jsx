import { Link } from 'react-router-dom';
import './Footer.css';

const COLUMNS = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalités', href: '#features' },
      { label: 'Gratuit pour l\'ISEN', href: '#about' },
      { label: 'Sécurité', href: '#about' },
      { label: 'Roadmap', href: '#about' },
    ],
  },
  {
    title: 'Équipe',
    links: [
      { label: 'À propos', href: '#about' },
      { label: 'L\'équipe', href: '#about' },
      { label: 'L\'ISEN', href: 'https://www.isen.fr', external: true },
      { label: 'Notre PFA', href: '#about' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact', href: '#contact' },
      { label: 'FAQ', href: '#contact' },
      { label: 'Documentation', href: '#contact' },
      { label: 'Aide', href: '#contact' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer__inner">
        <div className="footer__grid">
          {/* Colonne identité */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              PFA3
            </Link>
            <p className="footer__tagline">
              Plateforme de gestion des projets étudiants développée à l'ISEN.
            </p>
            <div className="footer__socials">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-link"
                aria-label="GitHub"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-link"
                aria-label="LinkedIn"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Colonnes de liens */}
          {COLUMNS.map((col) => (
            <div key={col.title} className="footer__col">
              <h4 className="footer__col-title">{col.title}</h4>
              <ul className="footer__col-links">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="footer__link">
                        {l.label}
                      </a>
                    ) : (
                      <a href={l.href} className="footer__link">{l.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer__bottom">
          <span>© 2026 PFA3 — ISEN. Tous droits réservés.</span>
          <div className="footer__legal">
            <a href="#" className="footer__legal-link">Mentions légales</a>
            <a href="#" className="footer__legal-link">CGU</a>
            <a href="#" className="footer__legal-link">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
