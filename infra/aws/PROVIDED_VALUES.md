# Provided AWS Deployment Values

These are non-secret project values already provided for the NeuroMail AI AWS deployment. Do not put access keys, API keys, client secrets, database passwords, or Redis tokens in this file.

```txt
AWS_ACCOUNT_ID=591859078325
AWS_REGION=ap-south-1
AWS_S3_BUCKET=neuromail-ai-storage
RDS_POSTGRESQL_ENDPOINT=neuromail-db.cbw40wg8csqs.ap-south-1.rds.amazonaws.com
UPSTASH_REDIS_REST_URL=https://sacred-jennet-84185.upstash.io
GOOGLE_CLIENT_ID=904904794215-oh47sm9qrbnsh19ppcd4kmjavad83884.apps.googleusercontent.com
```

## Still Needed

```txt
RDS_POSTGRESQL_USERNAME=
RDS_POSTGRESQL_PASSWORD=
UPSTASH_REDIS_TCP_URL=rediss://default:...@...:6379
JWT_SECRET=
PUBLIC_API_DOMAIN_OR_ALB_URL=
FRONTEND_DOMAIN_OR_AMPLIFY_URL=
```

## Why UPSTASH_REDIS_TCP_URL Is Needed

The worker uses BullMQ, and BullMQ requires a Redis protocol connection string such as:

```txt
rediss://default:PASSWORD@HOST:6379
```

The REST URL/token is useful for REST-based cache calls, but it cannot run BullMQ queues by itself.

