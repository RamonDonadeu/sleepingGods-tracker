# Sleeping Gods — Campaign Tracker

Diario de campañas y conocimiento descubierto para **Sleeping Gods**. La aplicación solo conoce lo que el jugador ha registrado durante sus propias partidas.

## Arquitectura

```
SleepingGodsTracker/
├── backend/                 # NestJS + Prisma + SQLite
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
├── frontend/                # React + TypeScript + Vite
│   └── src/
└── docker-compose.yml       # Frontend + API (Dokploy / Docker)
```

### Principio central: dos capas de datos

| Capa | Qué guarda | Ejemplo |
|------|-----------|---------|
| **Campaign State** | Lo ocurrido en la partida actual | Localización #5 visitada en Campaña #2 |
| **Global Knowledge** | Lo aprendido en cualquier partida | En Campaña #1 descubrí que #5 requiere RATON |

El conocimiento global **nunca** modifica automáticamente el estado de una campaña nueva.

## Desarrollo local

```bash
# Backend (SQLite local)
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run start:dev

# Frontend (proxy /api → localhost:3000)
cd frontend
npm install
npm run dev
```

O todo con Docker:

```bash
docker compose up --build
```

La UI queda en `http://localhost` y llama a la API por `/api`.

## Despliegue en Dokploy

1. Crea un servicio **Compose** apuntando a este repositorio.
2. Compose file: `docker-compose.yml`.
3. En **Domains**, asigna el dominio al servicio `frontend` (puerto `80`).
4. Opcional en Environment:

```
DATABASE_URL=file:/data/sleeping-gods.db
PORT=3000
WEB_PORT=80
```

La base SQLite se guarda en el volumen `sleeping_gods_data`. Al arrancar, el backend aplica migraciones y carga el catálogo de tótems.

## API

El frontend usa `VITE_API_URL` (por defecto `/api`). En Docker, nginx reenvía `/api/*` al backend.
