# Response: Webhook Notification System Request

Great -- a webhook notification system for order status changes is a solid feature. Before we jump into building anything, I want to make sure we get this right by following a disciplined process: **Spec first, then Plan, then Build.**

You've described the "what" at a high level, but there's enough ambiguity here that diving straight into code would be risky. Let me surface the questions we need to answer, and then we'll write a spec together.

## Why Spec First

A webhook system touches authentication, security, reliability, and data contracts -- all areas where unclear requirements lead to painful rework. Five minutes of spec writing will save us hours of "oh wait, we also need..." mid-implementation.

## What I Already Understand

- **Feature:** Webhook notification system for the Express API
- **Core capabilities:** (1) Users register webhook URLs, (2) System fires events on order status changes
- **Integration point:** Existing Express API

## What I Need From You Before We Proceed

Here are the open questions that would affect architecture and implementation significantly:

### Registration & Management
1. **Authentication:** How do users register webhooks -- via an authenticated API endpoint? Do they need an API key, OAuth, or session auth?
2. **Multiple URLs:** Can a user register multiple webhook URLs? Can they subscribe to specific order status transitions (e.g., only "shipped") or do they get all events?
3. **Management endpoints:** Do users need CRUD operations (list, update, delete their webhooks), or just register and that's it?

### Event Delivery
4. **Payload shape:** What data should the webhook payload include? Just the order ID and new status, or the full order object?
5. **Retry policy:** If a webhook delivery fails (endpoint down, timeout, 5xx), should we retry? How many times? With what backoff?
6. **Delivery guarantees:** Is at-least-once delivery acceptable (possible duplicates), or do you need exactly-once?

### Security
7. **Signature verification:** Should we sign webhook payloads (e.g., HMAC-SHA256 with a shared secret) so receivers can verify authenticity?
8. **URL validation:** Should we validate webhook URLs before accepting them (e.g., must be HTTPS, must respond to a verification ping)?

### Infrastructure
9. **Storage:** Where do webhook registrations live -- same database as orders? What's the current DB (Postgres, Mongo, etc.)?
10. **Delivery mechanism:** Synchronous (fire during request), async with a job queue (Bull, SQS, etc.), or something simpler?
11. **Scale:** How many webhooks per event are we expecting? Tens? Thousands?

### Scope Boundaries
12. **Event types:** Just order status changes for now, or should we design for extensibility to other event types?
13. **Admin tooling:** Do you need any admin visibility into webhook delivery status, failures, logs?

## Proposed Next Step

Once you answer these questions (even with "I don't know, pick something reasonable" for some of them), I will:

1. **Write a spec** (`SPEC.md`) capturing the full feature definition, success criteria, non-goals, constraints, and edge cases
2. **Get your approval** on the spec
3. **Brainstorm** the implementation approach
4. **Write an implementation plan** with concrete tasks
5. **Build it** with tests alongside the code
6. **Verify** everything works before calling it done

This pipeline keeps us from building the wrong thing or missing critical concerns like retry logic or payload signing. Let me know your answers and we'll get the spec written up.
