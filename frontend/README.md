# Plateforme de gestion de projets étudiants — Front-end

Application React (Vite) pour le suivi et la gestion de projets étudiants.

## Lancer le projet

```bash
# Installer les dépendances (une seule fois)
npm install

# Lancer le serveur de développement
npm run dev
```

L'app est accessible sur [http://localhost:5173](http://localhost:5173).

## Variables d'environnement

Copie `.env` et adapte l'URL si besoin :

```bash
VITE_API_URL=http://localhost:3000/api
```

---

## Structure du projet

```
frontend/
├── public/             # Fichiers statiques servis directement
├── src/
│   ├── assets/         # Images et icônes statiques
│   ├── components/     # Composants réutilisables (Button, Input, Card…)
│   ├── context/        # Contextes React — AuthContext gère l'utilisateur et son rôle
│   ├── hooks/          # Hooks custom (ex : useFetch, useDebounce)
│   ├── layouts/        # Gabarits de page — MainLayout contient le header et la sidebar
│   ├── pages/          # Une page par module, correspond à une route
│   ├── services/       # Couche API — api.js centralise les appels axios
│   └── utils/          # Fonctions pures utilitaires (formatage, validation…)
├── .env                # Variables d'environnement (non versionné en prod)
└── vite.config.js      # Configuration Vite
```

### Rôles utilisateurs (`context/AuthContext.jsx`)

| Constante       | Valeur          | Description                         |
|-----------------|-----------------|-------------------------------------|
| `ETUDIANT`      | `etudiant`      | Membre d'un groupe projet            |
| `TEAM_LEADER`   | `team_leader`   | Responsable d'un groupe             |
| `ENCADRANT`     | `encadrant`     | Superviseur enseignant              |
| `JURY`          | `jury`          | Évaluateur externe                  |

### Routes disponibles

| Chemin          | Page             | Accès      |
|-----------------|------------------|------------|
| `/login`        | Login            | Public     |
| `/dashboard`    | Dashboard        | Connecté   |
| `/projects`     | Projets          | Connecté   |
| `/tasks`        | Tâches / Kanban  | Connecté   |
| `/deliverables` | Livrables        | Connecté   |
| `/evaluation`   | Évaluation       | Connecté   |

---

## Conventions d'équipe

- **Commentaires en français**, noms de variables/fonctions/composants **en anglais**.
- Pas de Redux — on utilise le **Context API** + `useState`/`useReducer`.
- Pas de bibliothèque UI externe — CSS simple dans des fichiers `.css` colocalisés.
- Tous les appels API passent par `services/api.js` (jamais de `fetch` direct dans les composants).
- Un composant = un fichier dans `components/<NomDuComposant>/`.

## Dépendances principales

| Package            | Usage                          |
|--------------------|-------------------------------|
| `react-router-dom` | Routing côté client            |
| `axios`            | Requêtes HTTP vers l'API       |

## Équipe front-end

- **Junior** — modules : Authentification, Tâches/Kanban, Communication
- **Shalom** — modules : Projets, Livrables, Évaluation, Suivi
