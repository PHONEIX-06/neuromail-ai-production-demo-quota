# AWS Architecture

```mermaid
flowchart TB
  User["Users / Teams"] --> CDN["Amplify or CloudFront Frontend"]
  CDN --> ALB["Application Load Balancer"]
  ALB --> API["ECS Fargate: neuromail-api"]
  API --> RDS["RDS PostgreSQL + pgvector"]
  API --> Redis["ElastiCache Redis"]
  API --> S3["S3 Attachments"]
  API --> Secrets["Secrets Manager"]
  API --> Logs["CloudWatch Logs"]
  Worker["ECS Fargate: neuromail-worker"] --> RDS
  Worker --> Redis
  Worker --> S3
  Worker --> Secrets
  Worker --> Logs
  ECR["ECR Docker Images"] --> API
  ECR --> Worker
  GitHub["GitHub Actions CI/CD"] --> ECR
```

## Production Notes

- API runs as a public ECS service behind an ALB.
- Worker runs as a private ECS service with no public load balancer.
- RDS and ElastiCache should live in private subnets.
- API and worker should read secrets from Secrets Manager.
- S3 attachment bucket should block public access by default.
- Use presigned URLs for attachment upload/download.
- CloudWatch log groups should use retention to control costs.
- Start with one small API task and one worker task, then scale later.

