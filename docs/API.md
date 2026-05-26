# NeuroMail AI API

Base URL for local API service:

```txt
http://localhost:4000
```

## Health

```http
GET /health
```

Returns database/API status and whether an AI key is configured.

## Dev Login

```http
POST /auth/dev-login
```

Returns a JWT for the seeded demo user. This is for local development only.

## Production Auth

```http
POST /auth/register
POST /auth/login
GET /me
```

`register` creates a user, organization, workspace, free trial subscription, and JWT session.

## Usage Quota

```http
GET /usage/quota
Authorization: Bearer <token>
```

Free workspaces are limited by `FREE_DAILY_SEND_LIMIT`, default `5`, for outbound email sends per user per day. Inbox sync/receiving is not blocked by this demo send quota.

## Emails

```http
GET /workspaces/:workspaceId/emails
Authorization: Bearer <token>
```

Lists non-archived emails for a workspace.

```http
PATCH /emails/:emailId
Authorization: Bearer <token>
Content-Type: application/json

{
  "isRead": true,
  "isStarred": false,
  "isArchived": false,
  "labels": ["Sales"]
}
```

Updates read/star/archive/labels and emits a realtime `email.updated` Socket.IO event.

## Gmail OAuth

```http
GET /auth/google/url?workspaceId=<workspace_id>
Authorization: Bearer <token>
```

Redirect the user to the returned URL. Google calls back to:

```http
GET /auth/google/callback
```

After connection:

```http
POST /email-accounts/:accountId/sync
POST /email-accounts/:accountId/send
```

Sending enforces the free daily quota and returns the updated quota.

## Outlook OAuth

```http
GET /auth/microsoft/url?workspaceId=<workspace_id>
GET /auth/microsoft/callback
POST /email-accounts/:accountId/sync
POST /email-accounts/:accountId/send
```

## IMAP/SMTP

```http
POST /imap/sync
POST /smtp/send
```

Uses `IMAP_*` and `SMTP_*` environment variables.

## Attachments

```http
POST /attachments/presign-upload
GET /attachments/:attachmentId/download
```

Uploads/downloads use private S3 objects with short-lived presigned URLs.

## Billing

```http
POST /billing/checkout
POST /stripe/webhook
```

Stripe Checkout creates subscriptions and webhooks update the `Subscription` table.

## AI

```http
POST /ai/draft
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "buyer@example.com",
  "subject": "Follow up",
  "intent": "Follow up after the demo and ask for next steps.",
  "tone": "professional",
  "length": "medium"
}
```

Creates an AI draft with Gemini and stores an `AiGeneration` record.

```http
POST /ai/reply
Authorization: Bearer <token>
Content-Type: application/json

{
  "emailId": "email_id",
  "tone": "friendly"
}
```

Generates a context-aware reply from an existing email.

## Automations

```http
POST /workspaces/:workspaceId/automations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Route invoices",
  "trigger": { "field": "subject", "operator": "contains", "value": "invoice" },
  "actions": [{ "type": "forward", "to": "finance@example.com" }]
}
```

## Jobs

```http
POST /jobs/sync-email
Authorization: Bearer <token>
```

Adds a background queue job. Gmail/Outlook live sync credentials are connected in the next phase.

## GraphQL Starter

```http
POST /graphql
Content-Type: application/json

{ "query": "{ viewer { product status } }" }
```
