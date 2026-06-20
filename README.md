# Plateforme de Gestion de Projets Étudiants — PFA3

Application web fullstack de gestion de projets étudiants avec suivi des tâches, livrables, évaluations et communication encadrant/étudiant.

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express 5 |
| Base de données | Supabase (PostgreSQL) |
| Authentification | Supabase Auth (JWT) |
| Temps réel | Socket.io |

---

## Prérequis

- Node.js v18+
- Un projet Supabase avec les tables créées (voir `/database`)
- npm

---

## Installation & Lancement

### 1. Cloner le projet

```bash
git clone https://github.com/Nitrazse/projet_info_CIR3.git
cd projet_info_CIR3
```

### 2. Configurer le Backend

```bash
cd backend
npm install
```

Créer un fichier `.env` dans `/backend` :

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

Lancer le backend :

```bash
npm run dev
```

Le serveur démarre sur **http://localhost:3000**

### 3. Configurer le Frontend

```bash
cd ../frontend
npm install
```

Créer un fichier `.env` dans `/frontend` :

```env
VITE_API_URL=http://localhost:3000/api
```

Lancer le frontend :

```bash
npm run dev
```

L'application est accessible sur **http://localhost:5173**

---

## Rôles utilisateurs

| Rôle | Description |
|------|-------------|
| `encadrant` | Crée et gère les projets, groupes, évaluations et feedbacks |
| `team_leader` | Chef de groupe, peut gérer les tâches |
| `etudiant` | Voit uniquement les infos de son groupe (tâches, note, moyenne promo) |
| `jury` | Peut soumettre des évaluations |

---

## Fonctionnalités principales

- **Gestion de projets** : création, suivi statut, jalons, Gantt
- **Groupes d'étudiants** : affectation par projet, vue filtrée par groupe
- **Tâches** : kanban, assignation, suivi statut
- **Livrables** : dépôt et validation
- **Évaluations** : notation par groupe, moyenne de la promo
- **Feedbacks** : communication encadrant → équipe
- **Notifications** : temps réel via Socket.io
- **Export** : CSV des évaluations

---

## Structure du projet

```
projet_info_CIR3/
├── backend/
│   ├── src/
│   │   ├── config/        # Supabase client
│   │   ├── controllers/   # Logique métier
│   │   ├── middlewares/   # Auth, rôles
│   │   ├── routes/        # Routes API
│   │   └── services/      # Socket.io
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── context/       # AuthContext
│   │   ├── pages/         # Pages (Dashboard, Projets, Évaluation…)
│   │   └── services/      # API client
│   └── index.html
└── database/              # Scripts SQL
```

---

## Variables d'environnement

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_ANON_KEY` | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin Supabase (bypass RLS) |
| `PORT` | Port du serveur (défaut: 3000) |
| `CORS_ORIGIN` | Origine autorisée (défaut: http://localhost:5173) |

### Frontend (`.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL de l'API backend |
