# GuruAI

AI learning platform scaffold with web, API, AI mentor, mobile, database, and code sandbox services.

## Services

- Frontend: `frontend/` on http://localhost:3000
- Backend API: `backend/` on http://localhost:4000
- AI service: `ai-service/` on http://localhost:8000
- Code sandbox: `apps/code-sandbox/` on http://localhost:5000
- Database: PostgreSQL on port `5432`

## Setup

```bash
npm install
npm --prefix frontend install
npm --prefix backend install
npm --prefix mobile install
npm --prefix apps/code-sandbox install
pip install -r ai-service/requirements.txt
```

Copy `.env.example` to `.env` and set real secrets before starting services:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/guru_ai
JWT_SECRET=replace-this
OPENAI_API_KEY=
CORS_ORIGINS=http://localhost:3000
DISABLE_AUTH=true
```

## Run

```bash
npm run dev
npm --prefix backend run dev
npm run dev:ai
```

Note: `npm run dev` starts the frontend and backend together. The AI service must be started separately with `npm run dev:ai` or via Docker Compose.

Or run all infra with Docker:

```bash
docker compose up --build
```

## Database

Docker loads migrations from `packages/database/migrations` on first database startup.

Auth uses `/api/auth/signup` and `/api/auth/login`, returning a JWT for protected routes such as `/api/student/dna`.

AI content generation:

```http
POST /api/ai/generate-explanation
```

```json
{
  "topic": "recursion",
  "userId": "rahul123",
  "strugglingWith": "base case concept",
  "format": "mixed"
}
```

Feedback on generated explanations is now supported via:

```http
POST /api/ai/feedback
```

```json
{
  "explanationId": "<explanation-id>",
  "userId": "rahul123",
  "rating": 4,
  "comment": "Clear explanation, please add more examples."
}
```

The backend builds a student profile from `users` + `student_dna_profiles`, generates a goal-aware explanation, caches similar requests in `ai_generated_explanations.cache_key`, and flags low-score or sampled content as `needs_human_review`.

Manual migration:

```bash
npm run db:migrate
npm run db:seed
```

## Verify

```bash
npm run typecheck:api
npm --prefix backend test
npm --prefix frontend run build
```
