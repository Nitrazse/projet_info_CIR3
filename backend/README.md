# Plateforme de gestion de projets étudiants — Back-end

API REST Express + Supabase pour la gestion de projets étudiants.

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier d'environnement et remplir les clés
cp .env.example .env

# 3. Renseigner les variables dans .env :
#    - SUPABASE_URL         → Settings > API > Project URL
#    - SUPABASE_ANON_KEY    → Settings > API > anon public
#    - SUPABASE_SERVICE_ROLE_KEY → Settings > API > service_role (⚠ secret)

# 4. Lancer en mode développement (rechargement auto)
npm run dev

# 5. Vérifier que le serveur répond
curl http://localhost:3000/api/health
# → { "status": "ok" }
```

---

## Structure des dossiers

```
backend/
├── server.js              # Point d'entrée : charge dotenv, monte les routes, démarre Express
├── .env.example           # Template des variables d'environnement (à copier en .env)
├── .gitignore
└── src/
    ├── config/
    │   └── supabase.js    # Exporte supabaseAdmin et createUserClient(token)
    ├── routes/            # Un fichier par module — définit les endpoints et les middlewares associés
    ├── controllers/       # Un fichier par module — contient la logique de chaque endpoint
    ├── middlewares/
    │   ├── auth.js        # Vérifie le JWT Supabase, attache req.user
    │   └── roles.js       # requireRole(...roles) — renvoie 403 si rôle insuffisant
    ├── services/          # Logique métier réutilisable entre plusieurs contrôleurs
    └── utils/             # Helpers purs : sendError(), getPagination()
```

---

## Répartition de l'équipe

| Dev    | Modules                                             |
|--------|-----------------------------------------------------|
| Blaise | `projects`, `comments`, `evaluations`               |
| Racine | `auth`, `deliverables`, bonus : realtime / exports  |
| Josué  | `tasks`, `progress`                                 |

---

## Conventions

### Endpoints
- Tous les endpoints sont préfixés `/api` (ex : `/api/projects`, `/api/tasks`).
- Méthodes HTTP standard : `GET` liste/détail, `POST` création, `PATCH` modification partielle, `DELETE` suppression.

### Format des réponses
```jsonc
// Succès
{ "data": { ... } }          // ou tableau directement pour les listes

// Erreur
{ "error": "message lisible" }
```

### Codes HTTP utilisés
| Code | Signification                          |
|------|----------------------------------------|
| 200  | Succès                                 |
| 201  | Ressource créée                        |
| 400  | Données invalides (validation)         |
| 401  | Non authentifié (token absent/expiré)  |
| 403  | Authentifié mais rôle insuffisant      |
| 404  | Ressource introuvable                  |
| 500  | Erreur interne serveur                 |

### Authentification
Chaque requête protégée doit inclure le header :
```
Authorization: Bearer <jwt_supabase>
```
Le middleware `authenticate` vérifie le token et injecte `req.user` :
```js
req.user = { id, email, role, token }
```

### Rôles
```js
import { requireRole, ROLES } from '../middlewares/roles.js';

router.post('/', authenticate, requireRole(ROLES.ENCADRANT), controller.create);
```

### Supabase : quel client utiliser ?
| Cas d'usage                          | Client à utiliser          |
|--------------------------------------|---------------------------|
| Opérations admin (bypass RLS)        | `supabaseAdmin`            |
| Requêtes au nom de l'utilisateur     | `createUserClient(req.user.token)` |

---

## Dépendances principales

| Package                | Usage                            |
|------------------------|----------------------------------|
| `express`              | Framework HTTP                   |
| `cors`                 | En-têtes CORS pour le front React |
| `dotenv`               | Chargement du fichier `.env`     |
| `@supabase/supabase-js`| Client Supabase (DB, auth, storage) |
| `nodemon` (dev)        | Rechargement auto du serveur     |
