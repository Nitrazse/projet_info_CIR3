import { Link } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import './About.css';

const TEAM = [
  {
    name: 'Elysée Shalom',
    initials: 'ES',
    role: 'Développeur Full Stack',
    color: 'blue',
  },
  {
    name: 'Racine Rayane',
    initials: 'RR',
    role: 'Développeur Full Stack',
    color: 'amber',
  },
  {
    name: 'Junior',
    initials: 'JR',
    role: 'Développeur Full Stack',
    color: 'blue',
  },
  {
    name: 'Josué',
    initials: 'JS',
    role: 'Développeur Full Stack',
    color: 'amber',
  },
  {
    name: 'Blaise',
    initials: 'BL',
    role: 'Développeur Full Stack',
    color: 'blue',
  },
];

const VALUES = [
  {
    title: 'Conçu par des étudiants',
    desc: 'Nous avons vécu les mêmes problèmes que vous — mails perdus, livrables oubliés, manque de visibilité. PFA3 est la solution que nous aurions voulu avoir.',
  },
  {
    title: 'Pensé pour l\'ISEN',
    desc: 'La plateforme est calée sur les processus pédagogiques de l\'ISEN : jalons, soutenances, évaluation par jury, suivi encadrant.',
  },
  {
    title: 'Open & évolutif',
    desc: 'Le code est ouvert à la contribution. Chaque promotion peut s\'appuyer sur le travail des précédentes pour faire évoluer la plateforme.',
  },
];

export default function About() {
  return (
    <div className="about-page">
      <Navbar />

      {/* ── Hero ── */}
      <section className="about-hero">
        <div className="about-hero__inner">
          <p className="about-hero__overtitle">ISEN CIR3 · Promotion 2026</p>
          <h1 className="about-hero__title">
            Un projet étudiant,<br />
            <span className="about-hero__accent">pour les étudiants</span>
          </h1>
          <p className="about-hero__sub">
            PFA3 est né d'un constat simple : gérer un projet de fin d'année entre
            étudiants et encadrants est trop souvent chaotique. Nous avons conçu
            la plateforme que nous aurions voulu avoir.
          </p>
        </div>
      </section>

      {/* ── Le projet ── */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-section__header">
            <span className="about-badge">Le projet</span>
            <h2 className="about-section__title">Qu'est-ce que PFA3 ?</h2>
          </div>
          <div className="about-values">
            {VALUES.map((v) => (
              <div key={v.title} className="about-value-card">
                <h3 className="about-value-card__title">{v.title}</h3>
                <p className="about-value-card__desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── L'équipe ── */}
      <section className="about-section about-section--alt">
        <div className="about-container">
          <div className="about-section__header">
            <span className="about-badge">L'équipe</span>
            <h2 className="about-section__title">Les 5 développeurs</h2>
            <p className="about-section__sub">
              Cinq étudiants en CIR3 à l'ISEN, passionnés par le développement
              web et le design de produits.
            </p>
          </div>

          <div className="team-grid">
            {TEAM.map((m) => (
              <div key={m.name} className={`team-card team-card--${m.color}`}>
                <div className="team-card__avatar">{m.initials}</div>
                <div className="team-card__info">
                  <p className="team-card__name">{m.name}</p>
                  <p className="team-card__role">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── L'ISEN ── */}
      <section className="about-section">
        <div className="about-container about-isen">
          <div className="about-section__header">
            <span className="about-badge">L'école</span>
            <h2 className="about-section__title">Institut Supérieur de l'Électronique et du Numérique</h2>
            <p className="about-section__sub">
              L'ISEN est une école d'ingénieurs spécialisée dans le numérique,
              présente dans plusieurs villes de France. PFA3 est développé dans
              le cadre du Projet de Fin d'Année de la filière CIR3.
            </p>
          </div>
          <div className="about-isen__cta">
            <a
              href="https://www.junia.com/fr/junia/programme-grande-ecole-isen/"
              target="_blank"
              rel="noopener noreferrer"
              className="about-cta-btn about-cta-btn--ghost"
            >
              Découvrir l'ISEN
            </a>
            <Link to="/" className="about-cta-btn about-cta-btn--ghost">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
