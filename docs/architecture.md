# SyncHub Architecture

## System Overview

SyncHub is a chat-first GitHub issue management tool built on top of a single Next.js application. The web app, API routes, and integration handlers live in the same deployment unit so the operational model stays simple for a solo developer.

Primary system responsibilities:

- Authenticate users with Clerk
- Mirror Clerk users into Prisma using `clerkUserId`
- Link Telegram and Discord identities to the same internal user record
- Centralize GitHub issue operations behind a reusable service layer
- Expose a lightweight dashboard for configuration and monitoring

## Product Overview

The product focuses on one high-value workflow: letting authenticated developers manage GitHub issues from chat without maintaining separate credentials for every platform. Clerk handles browser authentication, Prisma stores normalized integration data, and platform-specific handlers translate chat actions into shared issue-management services.

## Architecture Diagram

```mermaid
flowchart LR
    User["Developer"] --> Web["Next.js Dashboard"]
    User --> Telegram["Telegram Bot"]
    User --> Discord["Discord Slash Commands"]
    Web --> Clerk["Clerk Auth"]
    Clerk --> Webhook["Clerk Webhook Route"]
    Webhook --> Prisma["PostgreSQL via Prisma"]
    Telegram --> TGRoute["/api/telegram/webhook"]
    Discord --> DiscordRoute["/api/discord/interactions"]
    Web --> StartRoutes["Integration Start Routes"]
    StartRoutes --> Prisma
    TGRoute --> Prisma
    DiscordRoute --> Prisma
    TGRoute --> GitHubService["GitHub Service Layer"]
    DiscordRoute --> GitHubService
    Web --> GitHubRoute["/api/github/issues"]
    GitHubRoute --> GitHubService
    GitHubService --> GitHub["GitHub REST API"]
```

## Data Model

### User

- Internal application identity
- Uses `clerkUserId` as the durable external reference
- Owns `LinkedAccount`, `PendingLink`, and `Reminder` records

### LinkedAccount

- Stores provider-specific identity and optional tokens
- Supports `GITHUB`, `TELEGRAM`, and `DISCORD`
- Keeps provider data out of the core user table

### PendingLink

- Stores single-use, expiring tokens for Telegram and Discord linking
- Prevents direct trust in chat-provided identifiers
- Enables a web-initiated, bot-confirmed connection flow

### Reminder

- Persists follow-up notifications by repository, issue number, and schedule
- Tracks lifecycle state with `ReminderStatus`

## Integration Flows

### Clerk and GitHub Authentication

1. User signs in with Clerk.
2. GitHub is enabled as a Clerk social provider.
3. Clerk sends `user.created` and `user.updated` webhooks.
4. SyncHub upserts the internal `User`.
5. GitHub external account metadata is mirrored into `LinkedAccount`.

Trade-off:
This keeps authentication simple, but GitHub API access may need a dedicated OAuth or GitHub App token flow later if Clerk does not provide the scopes or token lifecycle needed for advanced issue operations.

### Telegram Linking Flow

1. Signed-in user clicks `Connect Telegram`.
2. SyncHub creates a single-use `PendingLink` token.
3. The user is redirected to `https://t.me/<BOT_USERNAME>?start=<TOKEN>`.
4. Telegram sends `/start <TOKEN>` to the webhook route.
5. SyncHub validates and consumes the token.
6. SyncHub upserts a `LinkedAccount` for `TELEGRAM`.

### Discord Linking Flow

1. Signed-in user clicks `Connect Discord`.
2. SyncHub creates a single-use `PendingLink` token.
3. The dashboard returns instructions to run `/link <CODE>`.
4. Discord sends the slash-command interaction to SyncHub.
5. SyncHub validates and consumes the code.
6. SyncHub upserts a `LinkedAccount` for `DISCORD`.

Future enhancement:
Add Discord OAuth2 `identify` support for friendlier user onboarding and better token management.

## Data Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Clerk
    participant SyncHub
    participant Prisma
    participant Telegram

    Browser->>Clerk: Sign in with GitHub
    Clerk-->>Browser: Session established
    Clerk->>SyncHub: user.created / user.updated webhook
    SyncHub->>Prisma: Upsert User and GitHub LinkedAccount
    Browser->>SyncHub: GET /api/integrations/telegram/start
    SyncHub->>Prisma: Create PendingLink
    SyncHub-->>Browser: Redirect to Telegram deep link
    Telegram->>SyncHub: POST /api/telegram/webhook with /start token
    SyncHub->>Prisma: Consume PendingLink and create LinkedAccount
    SyncHub-->>Telegram: Link success response
```

## Folder Structure

```text
app/
  (dashboard)/
    dashboard/page.tsx
    integrations/page.tsx
    issues/page.tsx
    reminders/page.tsx
    settings/page.tsx
  api/
    discord/interactions/route.ts
    github/issues/route.ts
    integrations/discord/start/route.ts
    integrations/telegram/start/route.ts
    telegram/webhook/route.ts
    webhooks/clerk/route.ts
components/
  dashboard/
  ui/
lib/
  clerk.ts
  discord/
  github/
  services/
  telegram/
  validators/
prisma/
  schema.prisma
```

## Design Decisions

### Next.js as the only backend runtime

Reason:
The user explicitly wanted to avoid introducing Express. Route handlers are enough for Clerk webhooks, Telegram webhooks, Discord interactions, and GitHub API orchestration at this scale.

Trade-off:
Long-running jobs and high-volume webhook processing may eventually justify a worker or queue, but not in the MVP.

### Clerk as the authentication source of truth

Reason:
Clerk removes the need to build custom session, OAuth, and identity-management flows.

Trade-off:
Advanced GitHub API permissions may require a separate token strategy later.

### Normalized external identities

Reason:
`LinkedAccount` allows GitHub, Telegram, and Discord to evolve independently without bloating the core `User` model.

Trade-off:
A little more relational complexity, but much better long-term maintainability.

### Single-use linking tokens

Reason:
Telegram and Discord chat surfaces should never be trusted to self-assert ownership of a web account.

Trade-off:
Users need one extra linking step, but the security model is much stronger.

## Scaling Considerations

- Start with direct route-handler processing for Telegram and Discord webhooks.
- Add idempotency keys or replay protection as webhook volume increases.
- Introduce scheduled jobs for reminders before adding a full queue.
- Add Redis or another queue only when retries, bursts, or latency require it.
- Separate read models for reporting only when the dashboard grows beyond operational monitoring.

## Phase Plan

### Phase 0: Project Setup

- Goals: configure Clerk, Prisma, env vars, and UI baseline
- Tasks: finalize schema, env docs, route shell, dashboard shell
- Deliverables: working project foundation
- Out of scope: production-grade background jobs

### Phase 1: User and GitHub Authentication

- Goals: sign in with Clerk and sync GitHub identity
- Tasks: configure Clerk GitHub social login, handle Clerk webhooks, persist GitHub metadata
- Deliverables: internal user sync and GitHub linked-account persistence
- Out of scope: advanced GitHub App installation flow

### Phase 2: Telegram Integration

- Goals: support secure Telegram account linking
- Tasks: issue tokens, redirect to deep links, validate webhook payloads, link chat IDs
- Deliverables: Telegram linking and bot intake scaffold
- Out of scope: rich bot conversations

### Phase 3: Discord Integration

- Goals: support MVP Discord linking
- Tasks: issue one-time codes, parse `/link` commands, link user identities
- Deliverables: Discord interaction scaffold
- Out of scope: OAuth2 `identify`

### Phase 4: GitHub Issue Management

- Goals: execute issue actions through shared services
- Tasks: list issues, create issues, add comments, labels, and assignees, close/reopen issues
- Deliverables: reusable GitHub issue module
- Out of scope: webhook-driven real-time sync

### Phase 5: Web Dashboard

- Goals: give operators visibility and control
- Tasks: integrations page, issue views, settings, reminders UI
- Deliverables: management dashboard
- Out of scope: full analytics suite

### Phase 6: Reminders and Automation

- Goals: schedule follow-ups
- Tasks: create reminder flows, schedule notifications, track statuses
- Deliverables: reminder delivery foundation
- Out of scope: advanced escalation policies

### Phase 7: GitHub Webhooks

- Goals: sync issue state in real time
- Tasks: receive webhook events, validate signatures, reconcile changes
- Deliverables: GitHub event ingestion
- Out of scope: event streaming architecture

### Phase 8: AI Enhancements

- Goals: improve triage and summarization
- Tasks: add issue summaries, suggested labels, digest generation
- Deliverables: optional AI-assisted workflows
- Out of scope: autonomous issue handling

### Phase 9: Deployment and CI/CD

- Goals: production deployment and release confidence
- Tasks: Docker polish, Vercel deployment, GitHub Actions, secret management
- Deliverables: repeatable deployment pipeline
- Out of scope: multi-region runtime

## Suggested Next Steps

1. Create the first Prisma migration from the new schema.
2. Configure Clerk GitHub social login and webhook delivery.
3. Register the Telegram bot webhook and Discord application commands.
4. Decide whether GitHub issue actions will use Clerk-managed GitHub tokens or a dedicated GitHub OAuth/App flow.
5. Add real dashboard data fetching once environment variables and external services are configured.
