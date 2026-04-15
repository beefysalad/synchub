# SyncHub

SyncHub is a GitHub issue management assistant for teams that live in chat. It combines Clerk authentication, GitHub identity sync, Telegram deep-link account linking, Discord slash-command linking, and a lightweight Next.js dashboard for configuration and monitoring.

This repository now contains the production-oriented foundation for the project:

- Product overview and roadmap
- System architecture and data flow documentation
- Prisma schema for users, linked accounts, pending links, and reminders
- Dashboard route scaffolding for overview, integrations, issues, reminders, and settings
- Initial API scaffolding for Clerk webhooks, Telegram webhooks, Discord interactions, integration linking, and GitHub issue access

## Features

- Clerk authentication with GitHub social login
- Prisma user sync keyed by Clerk `userId`
- GitHub linked account persistence for future issue-management scopes
- Telegram account linking via secure, single-use deep links
- Discord account linking via one-time slash-command codes
- GitHub issue service scaffolding for listing and creating issues
- Dashboard pages for integrations, issues, reminders, and settings
- Professional project documentation in `README.md` and `docs/architecture.md`

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Prisma ORM
- PostgreSQL
- Clerk Authentication
- Tailwind CSS 4
- shadcn/ui primitives
- TanStack Query
- React Hook Form
- Lucide React Icons
- Vercel-ready deployment setup

## Project Overview

SyncHub is designed for a solo developer shipping in phases. The application keeps Next.js as the only backend runtime, uses Clerk as the source of truth for web auth, and persists external identities in Prisma so GitHub, Telegram, and Discord workflows can share the same user record.

Core product goals:

- Sign in with Clerk and GitHub
- Link Telegram and Discord to authenticated users
- Manage GitHub issues from chat channels
- Provide a clear web control plane for integrations and reminders
- Keep the code modular enough to grow without introducing unnecessary infrastructure

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env.local
```

3. Fill in the environment variables shown below.

4. Generate the Prisma client and create your first migration:

```bash
npx prisma generate
npx prisma migrate dev --name init-synchub
```

5. Start the development server:

```bash
npm run dev
```

6. Configure the external services:

- Clerk: enable GitHub as a social login provider
- Telegram: set the bot webhook to `/api/telegram/webhook`
- Discord: configure the interactions endpoint at `/api/discord/interactions`
- GitHub: create an OAuth App or GitHub App for future expanded scopes

## Environment Variables

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/synchub"
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."
GITHUB_CLIENT_ID="github-oauth-app-client-id"
GITHUB_CLIENT_SECRET="github-oauth-app-client-secret"
GITHUB_WEBHOOK_SECRET="github-webhook-secret"
TELEGRAM_BOT_TOKEN="123456:telegram-bot-token"
TELEGRAM_BOT_USERNAME="synchub_bot"
TELEGRAM_WEBHOOK_SECRET="telegram-webhook-secret"
DISCORD_CLIENT_ID="discord-client-id"
DISCORD_CLIENT_SECRET="discord-client-secret"
DISCORD_PUBLIC_KEY="discord-public-key"
DISCORD_BOT_TOKEN="discord-bot-token"
DISCORD_APPLICATION_ID="discord-application-id"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Development Workflow

1. Use Clerk for all web authentication.
2. Mirror Clerk users into Prisma via the Clerk webhook.
3. Link chat identities through `PendingLink` records.
4. Centralize GitHub issue operations in `lib/github`.
5. Keep route handlers thin and push logic into `lib/services`.
6. Build features incrementally by phase.

Useful commands:

```bash
npm run dev
npm run lint
npm run build
npm run db:seed
```

## Folder Structure

```text
sync-hub/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── integrations/page.tsx
│   │   ├── issues/page.tsx
│   │   ├── reminders/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── discord/interactions/route.ts
│   │   ├── github/issues/route.ts
│   │   ├── integrations/
│   │   │   ├── discord/start/route.ts
│   │   │   └── telegram/start/route.ts
│   │   ├── telegram/webhook/route.ts
│   │   └── webhooks/clerk/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   ├── dashboard/
│   └── ui/
├── docs/
│   └── architecture.md
├── lib/
│   ├── clerk.ts
│   ├── discord/
│   ├── github/
│   ├── prisma.ts
│   ├── services/
│   ├── telegram/
│   ├── utils/
│   └── validators/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── README.md
```

## Roadmap

### Phase 0: Project Setup

- Goals: finalize environment configuration and baseline project structure
- Deliverables: Clerk, Prisma, Tailwind, and dashboard shell configuration
- Out of scope: production queues, webhook fan-out, advanced observability

### Phase 1: User and GitHub Authentication

- Goals: authenticate with Clerk and sync GitHub identity data
- Deliverables: Clerk webhook sync, Prisma `User`, GitHub linked account persistence
- Out of scope: full GitHub App installation flow

### Phase 2: Telegram Integration

- Goals: deep-link account linking and basic bot command intake
- Deliverables: `PendingLink` issuance, Telegram webhook, `/start <token>` linking
- Out of scope: advanced conversational bot UX

### Phase 3: Discord Integration

- Goals: slash-command account linking and command intake
- Deliverables: one-time link code endpoint, `/link <CODE>` interaction handling
- Out of scope: Discord OAuth2 `identify` flow

### Phase 4: GitHub Issue Management

- Goals: create, list, comment, label, assign, and close issues
- Deliverables: GitHub API client and service layer
- Out of scope: issue synchronization from GitHub webhooks

### Phase 5: Web Dashboard

- Goals: visibility into accounts, issues, reminders, and settings
- Deliverables: dashboard pages and integration controls
- Out of scope: pixel-perfect analytics suite

### Phase 6: Reminders and Automation

- Goals: notification scheduling and reminder lifecycle management
- Deliverables: reminder persistence and job runner integration
- Out of scope: multi-channel scheduling policies

### Phase 7: GitHub Webhooks

- Goals: real-time issue update sync
- Deliverables: webhook ingestion and event reconciliation
- Out of scope: full event-sourcing model

### Phase 8: AI Enhancements

- Goals: summaries and label suggestions
- Deliverables: opt-in AI assistance for issue triage
- Out of scope: autonomous decision-making without user review

### Phase 9: Deployment and CI/CD

- Goals: production deployment and reliable checks
- Deliverables: Vercel deployment, Docker support, GitHub Actions
- Out of scope: Kubernetes orchestration

## Future Improvements

- GitHub webhook backfill and retry queues
- Discord OAuth2 identity linking
- Scheduled digests and reminder batching
- AI issue summaries and suggested labels
- Repository-level permissions and team workspaces

## Documentation

- Architecture and design decisions: [docs/architecture.md](./docs/architecture.md)
- Existing project notes: [docs/FEATURES.md](./docs/FEATURES.md), [docs/TODO.md](./docs/TODO.md)

## License

This project is licensed under the [MIT License](LICENSE).
