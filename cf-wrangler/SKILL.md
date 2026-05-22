---
name: cf-wrangler
description: Use when running Cloudflare wrangler commands in the rekber/amanaja monorepo — D1 migrations, KV/R2 operations, queue management, secrets, deployment, or logs
---

# Cloudflare Wrangler CLI

Quick reference for `bunx wrangler` commands in this Bun monorepo.

## Bindings (from wrangler.toml)

| Binding | Type | Resource |
|---------|------|----------|
| `DB` | D1 | amanaja-db |
| `KV` | KV Namespace | sessions, OTP, rate limits |
| `STORAGE` | R2 | amanaja-storage (KTP uploads) |
| `DISBURSEMENT_QUEUE` | Queue | seller payouts |
| `NOTIFICATION_QUEUE` | Queue | WhatsApp/email |
| `METRICS` | Analytics Engine | amanaja_metrics |

**Environments:** `--env staging` for staging resources.

## Common Commands

All commands run from `packages/api/`.

### D1 Database

```bash
# Apply migrations (local dev)
bunx wrangler d1 migrations apply amanaja-db --local

# Apply migrations (remote - staging)
bunx wrangler d1 migrations apply amanaja-db --remote --env staging

# Apply migrations (remote - production)
bunx wrangler d1 migrations apply amanaja-db --remote

# Execute SQL query (local)
bunx wrangler d1 execute amanaja-db --local --command "SELECT * FROM users LIMIT 5"

# Execute SQL (remote staging)
bunx wrangler d1 execute amanaja-db --remote --env staging --command "SELECT COUNT(*) FROM transactions"

# Interactive SQL shell
bunx wrangler d1 execute amanaja-db --local

# List migrations status
bunx wrangler d1 migrations list amanaja-db --local
```

### KV Namespace

```bash
# List keys (use --env staging for staging)
bunx wrangler kv key list --binding KV --local

# Get value
bunx wrangler kv key get "session:abc123" --binding KV --local

# Put value
bunx wrangler kv key put "key" "value" --binding KV --local

# Delete key
bunx wrangler kv key delete "session:expired" --binding KV --local
```

### R2 Storage

```bash
# List objects
bunx wrangler r2 object list amanaja-storage

# Get object
bunx wrangler r2 object get amanaja-storage/kyc/user123.enc

# Put object
bunx wrangler r2 object put amanaja-storage/path/file.txt --file ./local.txt

# Delete object
bunx wrangler r2 object delete amanaja-storage/path/file.txt
```

### Queues

```bash
# List messages in DLQ
bunx wrangler queues messages amanaja-disbursement-dlq

# Consume from queue (debugging)
bunx wrangler queues messages amanaja-notification-queue --batch-size 5
```

### Secrets

```bash
# Set secret (production)
bunx wrangler secret put WUZAPI_TOKEN

# Set secret (staging)
bunx wrangler secret put RESEND_API_KEY --env staging

# List secrets
bunx wrangler secret list
bunx wrangler secret list --env staging

# Delete secret
bunx wrangler secret delete OLD_KEY
```

### Deployment

```bash
# Deploy to production
bunx wrangler deploy

# Deploy to staging
bunx wrangler deploy --env staging

# Dry run (no actual deploy)
bunx wrangler deploy --dry-run

# Tail logs (production)
bunx wrangler tail

# Tail logs (staging)
bunx wrangler tail --env staging

# Tail with filter
bunx wrangler tail --search "ERROR" --env staging
```

### Dev Server

```bash
# Start local dev (uses .dev.vars for secrets)
bunx wrangler dev

# With specific port
bunx wrangler dev --port 3100

# With remote resources (careful!)
bunx wrangler dev --remote
```

## Quick Tips

- **Local D1**: Always use `--local` for dev, `--remote` for deployed DBs
- **Staging**: Add `--env staging` to target staging resources
- **Secrets**: Never commit to `.dev.vars` — use `wrangler secret put`
- **Migrations**: Test locally first, then `--remote --env staging`, then production
