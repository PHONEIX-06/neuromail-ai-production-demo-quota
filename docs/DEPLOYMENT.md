# Deployment Guide

## Recommended Production Stack

- Frontend: Vercel or AWS Amplify
- API: AWS ECS Fargate, Railway, Render, or Fly.io
- Worker: AWS ECS Fargate worker service
- Database: AWS RDS PostgreSQL with pgvector
- Redis: AWS ElastiCache or Upstash
- Attachments: AWS S3
- CDN: CloudFront
- Logs/errors: Sentry first, then Prometheus/Grafana

## Local Development

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

The current UI runs on Vite/TanStack at `http://localhost:5173`.
The new production API runs at `http://localhost:4000`.

## AWS Setup Checklist

1. Create RDS PostgreSQL.
2. Enable `pgvector` extension.
3. Create ElastiCache Redis or Upstash Redis.
4. Create S3 bucket for attachments.
5. Create IAM user/role with limited S3 permissions.
6. Store secrets in AWS Secrets Manager.
7. Deploy API container to ECS Fargate.
8. Deploy worker container to ECS Fargate.
9. Put API behind Application Load Balancer.
10. Point frontend environment `API_URL` to the API load balancer/domain.

Detailed AWS templates and scripts are in:

```txt
infra/aws/
```

Use this when you want AWS on your resume:

```txt
Frontend: AWS Amplify or S3 + CloudFront
API: ECS Fargate + ALB
Worker: ECS Fargate
Images: ECR
Database: RDS PostgreSQL
Queue/cache: ElastiCache Redis
Files: S3
Secrets: Secrets Manager
Logs: CloudWatch
```

## Gmail Setup

In Google Cloud:

1. Enable Gmail API.
2. Configure OAuth consent screen.
3. Create OAuth client.
4. Add redirect URI:

```txt
http://localhost:3000/api/auth/google/callback
```

For production:

```txt
https://yourdomain.com/api/auth/google/callback
```

Required env:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

## Secrets You Will Provide Later

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
