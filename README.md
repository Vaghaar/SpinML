# SpinMyLunch

> La roulette qui décide pour toi.

Webapp collaborative de choix de repas : roulette interactive + vote en temps réel + gamification.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS 4, Framer Motion |
| Backend | Spring Boot 3.4, Java 21, Spring Security + JWT |
| BDD | PostgreSQL 16 (12 tables, Flyway migrations) |
| Cache | Redis 7 |
| Temps réel | WebSocket STOMP |
| CI/CD | GitHub Actions → GHCR Docker |

## Démarrage rapide

### Prérequis
- Docker Desktop 24+
- Java 21 (pour dev local backend)
- Node.js 22 (pour dev local frontend)

### 1. Variables d'environnement

```bash
cp .env.example .env
# Éditer .env avec vos clés Google OAuth et vos secrets
```

### 2. Lancer avec Docker Compose

```bash
# Tous les services (prod-like)
docker-compose up -d

# Dev (hot reload) — uniquement PostgreSQL + Redis
docker-compose -f docker-compose.dev.yml up postgres redis
```

### 3. Développement local

**Backend :**
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
# API disponible sur http://localhost:8080
```

**Frontend :**
```bash
cd frontend
npm install
npm run dev
# App disponible sur http://localhost:3000
```

## Structure du projet

```
spinmylunch/
├── .github/workflows/ci.yml     # GitHub Actions CI/CD
├── backend/                     # Spring Boot 3.4 + Java 21
│   ├── src/main/java/com/spinmylunch/
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/        # Flyway SQL migrations
│   └── pom.xml
├── frontend/                    # Next.js 15 + TypeScript
│   ├── src/app/                 # App Router
│   ├── src/components/
│   └── tailwind.config.ts
├── docker-compose.yml
├── docker-compose.dev.yml
└── .env.example
```

## API

- Backend : `http://localhost:8080/api/v1/`
- Santé : `http://localhost:8080/actuator/health`
- Métriques : `http://localhost:8080/actuator/prometheus`

## Ordre de développement

1. [x] Docker Compose + BDD PostgreSQL + Redis
2. [ ] Backend : auth Google OAuth + JWT
3. [ ] Backend : API roulettes + spin serveur
4. [ ] Backend : WebSocket STOMP + votes live
5. [ ] Frontend : Landing + connexion Google
6. [ ] Frontend : Canvas roulette + animation 5 phases
7. [ ] Frontend : Dashboard + votes temps réel
8. [ ] Frontend : Gamification (XP, badges, streaks)
9. [ ] Tests + CI/CD GitHub Actions
10. [ ] Sécurité (rate limiting, RGPD, CSP)
