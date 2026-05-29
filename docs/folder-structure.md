# guru-ai-platform Folder Structure

```txt
guru-ai-platform/
|-- frontend/              # Next.js 14 frontend
|-- backend/               # Node.js Express API
|-- ai-service/            # Python FastAPI LLM service
|-- apps/code-sandbox/     # Docker code execution service
|-- mobile/                # Expo/React Native app
|-- packages/shared/       # Shared TS types/constants/utils
|-- packages/database/     # PostgreSQL migrations/seeds
|-- infra/                 # CI/deployment templates
|-- docker-compose.yml
|-- .env.example
`-- package.json
```

## frontend

Purpose: Student/instructor UI.

Key files:
- `app/`: App Router pages/layouts
- `components/`: reusable UI
- `lib/api.ts`: API client
- `tailwind.config.ts`: theme

## backend

Purpose: Main backend API.

Key files:
- `src/server.ts`: Express entry and route mounting
- `src/*.routes.ts`: REST routes
- `src/*.service.ts`: business logic
- `src/db.ts`: DB client

## ai-service

Purpose: AI mentor API.

Key files:
- `main.py`: FastAPI app
- `requirements.txt`: Python dependencies

## apps/code-sandbox

Purpose: Code execution service.

Key files:
- `Dockerfile`: runner image
- `src/runner.ts`: execution API

## packages/database

Purpose: PostgreSQL schema lifecycle.

Key files:
- `migrations/*.sql`: schema changes
- `seeds/*.sql`: sample data

## packages/shared

Purpose: Shared contracts.

Key files:
- `src/types.ts`: DTO/domain types
- `src/constants.ts`: roles, languages, statuses
- `src/utils.ts`: shared helpers
