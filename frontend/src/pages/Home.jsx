import { Link } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import './Home.css';

const FEATURES = [
  {
    title: 'Suivi en temps réel',
    desc: 'Visualisez l\'avancement de chaque projet, tâche et livrable en un coup d\'œil.',
  },
  {
    title: 'Collaboration d\'équipe',
    desc: 'Organisez vos équipes, assignez des rôles et travaillez ensemble efficacement.',
  },
  {
    title: 'Tableau de bord encadrant',
    desc: 'Les encadrants accèdent à une vue globale de tous les groupes qu\'ils suivent.',
  },
  {
    title: 'Notifications intelligentes',
    desc: 'Soyez alerté des jalons importants, retards et mises à jour de votre projet.',
  },
  {
    title: 'Intégration GitHub',
    desc: 'Liez vos dépôts pour synchroniser commits et pull requests avec vos tâches.',
  },
  {
    title: 'Gestion des livrables',
    desc: 'Déposez, versionnez et validez vos livrables depuis une interface centralisée.',
  },
];

export default function Home() {
  return (
    <div className="home">
      <Navbar />

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero__inner">
          <p className="hero__overtitle">Plateforme PFA · ISEN CIR3</p>
          <h1 className="hero__title">
            Gérez vos projets étudiants<br />
            <span className="hero__title-accent">en toute simplicité</span>
          </h1>
          <p className="hero__subtitle">
            La plateforme conçue par des étudiants ISEN pour faciliter la collaboration,
            le suivi pédagogique et l'évaluation des projets de fin d'année.
          </p>
          <div className="hero__actions">
            <Link to="/register" className="promo__cta-btn hero__cta-btn">
              Commencer gratuitement
            </Link>
            <Link to="/login" className="hero__link">
              Se connecter →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Promo Étudiants ── */}
      <section className="promo promo--students">
        <div className="promo__cta-zone">
          <span className="promo__profile-badge">Pour les étudiants</span>
          <Link to="/register?role=etudiant" className="promo__cta-btn">
            Je crée mon compte
          </Link>
          <a href="#features" className="promo__cta-ghost">
            Découvrir les fonctionnalités ↓
          </a>
        </div>

        <div className="promo__text-zone promo__text-zone--right">
          <p className="promo__tags">Collaboration · Tâches · GitHub</p>
          <h1 className="promo__title">
            Pilote tes projets,<br />libère ton équipe
          </h1>
          <p className="promo__desc">
            Finis les fils de mails et les tableurs partagés chaotiques.
            Organise ton équipe, suis tes livrables et livre sereinement —
            le tout depuis une seule plateforme.
          </p>
          <div className="promo__benefits">
            <span className="promo__benefit">Collaboration en temps réel</span>
            <span className="promo__benefit">Tâches & livrables centralisés</span>
            <span className="promo__benefit">Intégration GitHub</span>
          </div>
        </div>
      </section>

      {/* ── Promo Enseignants ── */}
      <section className="promo promo--teachers">
        <div className="promo__text-zone promo__text-zone--left">
          <p className="promo__tags">Dashboard · Statistiques · Alertes</p>
          <h2 className="promo__title">
            Supervisez sans vous<br />noyer dans les mails
          </h2>
          <p className="promo__desc">
            Votre tour de contrôle pédagogique. Suivez l'avancement de chaque groupe,
            repérez les retards au premier coup d'œil et évaluez efficacement.
          </p>
          <div className="promo__benefits">
            <span className="promo__benefit">Dashboard multi-groupes</span>
            <span className="promo__benefit">Statistiques d'avancement</span>
            <span className="promo__benefit">Alertes de retard automatiques</span>
          </div>
        </div>

        <div className="promo__cta-zone">
          <span className="promo__profile-badge">Pour les enseignants</span>
          <Link to="/register?role=encadrant" className="promo__cta-btn">
            Espace enseignant
          </Link>
          <Link to="/login" className="promo__cta-ghost">
            Déjà un compte ? Se connecter →
          </Link>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section className="section section--alt" id="features">
        <div className="home__container">
          <div className="section__header">
            <span className="section__badge">Fonctionnalités</span>
            <h2 className="section__title">Pourquoi choisir notre plateforme ?</h2>
            <p className="section__subtitle">
              Tout ce dont vous avez besoin pour mener à bien vos projets d'étude, rassemblé en un seul endroit.
            </p>
          </div>
          <div className="features__grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="cta-section">
        <div className="home__container">
          <div className="cta-section__inner">
            <h2 className="cta-section__title">Prêt à mieux gérer vos projets ?</h2>
            <p className="cta-section__sub">
              Rejoignez la plateforme et commencez à collaborer dès aujourd'hui.
            </p>
            <Link to="/register" className="btn btn--white btn--lg">
              Créer un compte gratuit
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
