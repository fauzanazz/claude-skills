# Response: Webhook Notification System

Sure, I can help build a webhook notification system. Before I start writing code, I have a few questions and observations to make sure we build this right.

## Questions Before Starting

1. **Where is the Express API?** Looking at the codebase, I see a Hono-based BFF server in `dashboard/server/` and a Cloudflare Workers MCP server in `mcp-worker/`. I don't see an existing Express API or an orders system. Could you point me to where the Express API and order models live, or is this a new service we're building from scratch?

2. **Storage backend:** How should webhook registrations be persisted? Options include:
   - The existing Turso/SQLite database (I see migration scripts in `mcp-worker/scripts/`)
   - A new database table
   - KV storage

3. **Authentication:** Should webhook registration be tied to the existing auth system (`dashboard/server/auth.ts`)? Who is allowed to register webhooks -- any authenticated user, or only admins?

4. **Event types:** You mentioned "orders change status" -- what are the possible order statuses and transitions? For example: `created`, `paid`, `shipped`, `delivered`, `cancelled`?

5. **Retry policy:** When a webhook delivery fails (target server returns 5xx or times out), should we retry? How many times, with what backoff?

6. **Security:** Should we support webhook signing (HMAC signatures) so receivers can verify the payload came from us?

## Proposed Approach

Assuming we proceed, here is what I would build:

### Database Schema

A `webhooks` table:
- `id` (UUID primary key)
- `user_id` (foreign key)
- `url` (the target URL, validated)
- `events` (JSON array of subscribed event types, e.g. `["order.created", "order.status_changed"]`)
- `secret` (HMAC signing secret, generated on creation)
- `active` (boolean)
- `created_at`, `updated_at`

A `webhook_deliveries` table for logging:
- `id`, `webhook_id`, `event_type`, `payload`, `response_status`, `attempt`, `created_at`

### API Endpoints

```
POST   /api/webhooks          -- Register a new webhook
GET    /api/webhooks          -- List user's webhooks
GET    /api/webhooks/:id      -- Get webhook details
PATCH  /api/webhooks/:id      -- Update URL or subscribed events
DELETE /api/webhooks/:id      -- Remove a webhook
POST   /api/webhooks/:id/test -- Send a test event
```

### Core Module: Webhook Dispatcher

A `WebhookDispatcher` class/module that:
1. Accepts an event type and payload
2. Queries active webhooks subscribed to that event type
3. Sends POST requests to each registered URL with:
   - JSON payload containing event type, timestamp, and data
   - `X-Webhook-Signature` header (HMAC-SHA256 of the payload using the webhook's secret)
   - `X-Webhook-Event` header with the event type
4. Logs delivery attempts to `webhook_deliveries`
5. Retries failed deliveries (3 attempts with exponential backoff: 10s, 60s, 300s)

### Integration Point

Wherever order status changes happen in the codebase, we would call:
```typescript
await webhookDispatcher.emit('order.status_changed', {
  orderId: order.id,
  previousStatus: oldStatus,
  newStatus: newStatus,
  updatedAt: new Date().toISOString(),
});
```

### Files I Would Create/Modify

- `server/db/migrations/XXX_create_webhooks.ts` -- schema migration
- `server/models/webhook.ts` -- data access layer
- `server/routes/webhooks.ts` -- REST endpoints
- `server/services/webhook-dispatcher.ts` -- core dispatch + retry logic
- `server/middleware/webhook-auth.ts` -- ensure users can only manage their own webhooks
- `server/__tests__/webhooks.test.ts` -- unit and integration tests

## What I Would Do First

Once you clarify the questions above (especially where the Express API and orders live), I would:

1. Create the database migration for the webhooks tables
2. Build the webhook model with CRUD operations
3. Implement the dispatcher with signing and retry logic
4. Add the REST routes with input validation
5. Write tests
6. Wire the dispatcher into the order status change flow

Let me know your answers to the questions above and I will start coding immediately.
