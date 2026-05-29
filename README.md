# NeuroMail AI

NeuroMail AI is a production-grade AI SaaS email platform foundation for teams and professionals. It combines an enterprise dashboard, AI email assistance, workflow automation, realtime updates, PostgreSQL persistence, Redis queues, and a deployment-ready service architecture.

## What Is Built

- Premium dashboard UI for inbox, compose, analytics, automations, and settings
- Gemini-backed AI draft and smart reply endpoints
- Gmail OAuth connect, inbox sync, and send-mail endpoints
- Outlook OAuth connect, inbox sync, and send-mail endpoints
- IMAP/SMTP fallback sync/send endpoints
- Private S3 attachment upload/download presigned URL endpoints
- Stripe Checkout subscription and webhook endpoints
- Production register/login JWT flow
- Free-plan daily send quota, defaulting to 5 outbound emails per user per day
- REST API service with Express, JWT auth, RBAC hooks, validation, rate limiting, Helmet, and CORS
- Starter GraphQL gateway endpoint
- Socket.IO realtime event channel
- BullMQ worker service for background email/AI jobs
- PostgreSQL schema with Prisma ORM
- Redis queue/cache foundation
- Multi-tenant SaaS data model
- Docker Compose for local PostgreSQL + Redis
- Seed data for a demo organization, workspace, user, mailbox, email, notification, and automation
- CI workflow, Dockerfiles, API docs, deployment guide, and env examples
- AWS deployment templates for ECS Fargate, ECR, RDS, ElastiCache, S3, Secrets Manager, and CloudWatch

## Architecture

```txt
NeuroMail AI
  src/                    Current dashboard UI
  apps/api/               Express API, auth, AI, realtime, REST + GraphQL starter
  apps/worker/            BullMQ background workers
  packages/shared/        Zod schemas and shared config
  prisma/                 Database schema and seed data
  docs/                   API and deployment docs
  infra/aws/              AWS task definitions, deploy scripts, IAM policy, architecture notes
```

## Local Setup

```bash
npm install
cp .env.example .env
npm run infra:up
npm run db:migrate
npm run db:seed
npm run api:dev
npm run worker:dev
npm run dev
```

Local URLs:

- Dashboard: `http://localhost:5173`
- API: `http://localhost:4000`
- API health: `http://localhost:4000/health`

## Important Secrets

Do not commit real secrets. Add them to `.env` locally or your deployment provider:

```env
GEMINI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
```

## Next Build Phases

1. Replace local demo auth with full email/password + OAuth session flow.
2. Connect Gmail OAuth and Microsoft Graph OAuth.
3. Store encrypted OAuth tokens.
4. Build real sync jobs for Gmail/Outlook/IMAP.
5. Add S3 attachment upload and preview.
6. Add Stripe checkout, billing portal, and webhook handling.
7. Add pgvector embeddings and semantic search.
8. Add Next.js 15 App Router frontend migration when you are ready to move from the current TanStack UI.

## AWS Resume Deployment

AWS deployment assets live in [infra/aws](./infra/aws). The target architecture uses ECS Fargate for API and worker containers, ECR for images, RDS PostgreSQL, ElastiCache Redis, S3 attachments, Secrets Manager, CloudWatch, and Amplify or CloudFront for the frontend.

## Selected Live Deployment

The current chosen deployment plan is documented in [docs/HYBRID_DEPLOYMENT.md](./docs/HYBRID_DEPLOYMENT.md):

- Frontend: Vercel
- Backend API: Render
- Worker: Render background worker
- Database: AWS RDS PostgreSQL
- Redis: Upstash
- Storage: AWS S3

## Verification

```bash
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run build
```
