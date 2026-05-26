# NeuroMail AI AWS Deployment

This folder contains AWS-ready deployment assets for running NeuroMail AI as a resume-grade cloud project.

## Target AWS Architecture

```txt
Users
  |
  v
CloudFront / Amplify Frontend
  |
  v
Application Load Balancer
  |
  v
ECS Fargate Service: neuromail-api
  |
  +--> RDS PostgreSQL
  +--> ElastiCache Redis
  +--> S3 Attachments Bucket
  +--> Secrets Manager
  +--> CloudWatch Logs

ECS Fargate Service: neuromail-worker
  |
  +--> RDS PostgreSQL
  +--> ElastiCache Redis
  +--> S3 Attachments Bucket
  +--> Secrets Manager
  +--> CloudWatch Logs

ECR
  +--> neuromail-api image
  +--> neuromail-worker image
```

## AWS Services Used

- Amazon ECR: Docker image registry
- Amazon ECS Fargate: API and worker containers
- Amazon RDS PostgreSQL: relational SaaS database
- Amazon ElastiCache Redis: queues, cache, realtime job state
- Amazon S3: email attachment storage
- AWS Secrets Manager: API keys and database URLs
- AWS CloudWatch: logs and operational visibility
- Application Load Balancer: public API routing
- AWS Amplify or S3 + CloudFront: frontend hosting
- IAM: least-privilege runtime roles

## Recommended Region

For India:

```txt
ap-south-1
```

## Deployment Order

1. Install AWS CLI and Docker Desktop.
2. Configure AWS CLI:

```bash
aws configure
```

3. Create ECR repositories:

```bash
aws ecr create-repository --repository-name neuromail-api --region ap-south-1
aws ecr create-repository --repository-name neuromail-worker --region ap-south-1
```

4. Create RDS PostgreSQL.
5. Create ElastiCache Redis.
6. Create S3 bucket.
7. Add secrets to Secrets Manager.
8. Build and push images using `scripts/deploy-api.ps1` and `scripts/deploy-worker.ps1`.
9. Register ECS task definitions from `task-definitions/`.
10. Create ECS services for API and worker.
11. Deploy frontend with Amplify or S3 + CloudFront.

## Values Already Chosen

```txt
AWS_ACCOUNT_ID=591859078325
AWS_REGION=ap-south-1
AWS_S3_BUCKET=neuromail-ai-storage
RDS_ENDPOINT=neuromail-db.cbw40wg8csqs.ap-south-1.rds.amazonaws.com
```

## Still Required Before Live Deployment

```txt
RDS username
RDS password
Upstash Redis TCP URL, not only REST URL
JWT secret
Public API domain / ALB URL
Frontend domain / Amplify URL
```

Upstash REST credentials are not enough for BullMQ. In Upstash, open your Redis database, go to connection details, and copy the Redis URL that starts with `rediss://`.

## Secrets Manager Names

Use these secret names:

```txt
/neuromail/DATABASE_URL
/neuromail/REDIS_URL
/neuromail/UPSTASH_REDIS_REST_URL
/neuromail/UPSTASH_REDIS_REST_TOKEN
/neuromail/JWT_SECRET
/neuromail/GEMINI_API_KEY
/neuromail/GOOGLE_CLIENT_ID
/neuromail/GOOGLE_CLIENT_SECRET
/neuromail/MICROSOFT_CLIENT_ID
/neuromail/MICROSOFT_CLIENT_SECRET
/neuromail/STRIPE_SECRET_KEY
/neuromail/STRIPE_WEBHOOK_SECRET
/neuromail/AWS_S3_BUCKET
```

Example:

```bash
aws secretsmanager create-secret \
  --name /neuromail/GEMINI_API_KEY \
  --secret-string "your-key" \
  --region ap-south-1
```

## Resume Bullet Example

Built and deployed NeuroMail AI, a multi-tenant AI email SaaS platform on AWS using ECS Fargate, ECR, RDS PostgreSQL, ElastiCache Redis, S3, Secrets Manager, CloudWatch, Docker, Prisma, BullMQ, WebSockets, and LLM-powered email automation.
