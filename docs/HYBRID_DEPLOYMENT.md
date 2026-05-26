# Hybrid Production Deployment

This is the selected deployment plan for NeuroMail AI:

```txt
Frontend  -> Vercel
Backend   -> Render web service
Worker    -> Render background worker
Database  -> AWS RDS PostgreSQL
Redis     -> Upstash Redis
Storage   -> AWS S3
AI        -> Gemini
OAuth     -> Google Gmail OAuth
```

## Values Already Chosen

These are safe non-secret deployment values:

```txt
AWS_ACCOUNT_ID=591859078325
AWS_REGION=ap-south-1
AWS_S3_BUCKET=neuromail-ai-storage
RDS_HOST=neuromail-db.cbw40wg8csqs.ap-south-1.rds.amazonaws.com
RDS_USERNAME=postgres
UPSTASH_REDIS_REST_URL=https://sacred-jennet-84185.upstash.io
GOOGLE_CLIENT_ID=904904794215-oh47sm9qrbnsh19ppcd4kmjavad83884.apps.googleusercontent.com
```

Do not commit actual passwords, API keys, OAuth secrets, or Redis tokens to GitHub.

## 1. Database URL

In Render, set `DATABASE_URL` as:

```txt
postgresql://postgres:YOUR_RDS_PASSWORD@neuromail-db.cbw40wg8csqs.ap-south-1.rds.amazonaws.com:5432/neuromail_ai?schema=public
```

Make sure your RDS security group allows inbound PostgreSQL traffic from Render. For testing you can temporarily allow your IP, but production should be locked down as tightly as possible.

## 2. Upstash Redis

BullMQ needs a Redis protocol URL:

```txt
REDIS_URL=rediss://default:YOUR_UPSTASH_PASSWORD@sacred-jennet-84185.upstash.io:6379
```

The REST values can also be set:

```txt
UPSTASH_REDIS_REST_URL=https://sacred-jennet-84185.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_UPSTASH_REST_TOKEN
```

## 3. Render Backend

Create two Render services from `render.yaml`:

- `neuromail-api`
- `neuromail-worker`

Set these environment variables in Render:

```txt
DATABASE_URL
REDIS_URL
JWT_SECRET
GEMINI_API_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
MICROSOFT_REDIRECT_URI
ENCRYPTION_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PRO
STRIPE_PRICE_TEAM
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION=ap-south-1
AWS_S3_BUCKET=neuromail-ai-storage
FREE_DAILY_SEND_LIMIT=5
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
SMTP_FROM
IMAP_HOST
IMAP_PORT
IMAP_USER
IMAP_PASSWORD
WEB_URL=https://YOUR_VERCEL_APP.vercel.app
```

After Render gives you the backend URL, set:

```txt
GOOGLE_REDIRECT_URI=https://YOUR_RENDER_API.onrender.com/api/auth/google/callback
```

Then add the same redirect URI in Google Cloud Console.

For Microsoft Outlook, set:

```txt
MICROSOFT_REDIRECT_URI=https://YOUR_RENDER_API.onrender.com/api/auth/microsoft/callback
```

Then add that redirect URI in Azure App Registration.

## 4. Vercel Frontend

Import the GitHub repo into Vercel.

Use:

```txt
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist/client
Install Command: npm install
```

Set Vercel env:

```txt
VITE_API_URL=https://YOUR_RENDER_API.onrender.com
```

The frontend API client uses `VITE_API_URL`, creates a JWT dev session for the seeded user, and maps the current dashboard calls to the production API. Replace dev login with the full login UI before public launch.

## 5. S3 Bucket

Bucket:

```txt
neuromail-ai-storage
```

Recommended settings:

- Block all public access
- Enable default encryption
- Use presigned URLs for upload/download later
- Add lifecycle cleanup rules for old temporary attachments

## 6. First Production Database Setup

Run this once from your local machine after setting `.env` to the AWS RDS `DATABASE_URL`:

```bash
npm run db:push
npm run db:seed
```

For a stricter production flow later, create migrations locally and use:

```bash
npm run db:deploy
```

## 7. Security Reminder

The keys and passwords shared in chat should be rotated after setup:

- AWS access key
- RDS password
- Gemini API key
- Google client secret
- Upstash token/password
- Stripe webhook/secret keys

Also rotate `ENCRYPTION_KEY` only before real users connect mailboxes. Once live mailbox tokens are encrypted with a key, changing it requires re-connecting accounts.

This is normal. Use the current values only for setup, then rotate before making the app public.

## 8. Demo Send Limit

Free users can send up to `FREE_DAILY_SEND_LIMIT` emails per day. The default is:

```txt
FREE_DAILY_SEND_LIMIT=5
```

This is useful for demos because receiving/syncing still works while outbound sending stays controlled.
