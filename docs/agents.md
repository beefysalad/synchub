# AI Context & Project Source of Truth

This file serves as the primary source of truth for AI agents working on this project. It outlines the technology stack, project structure, coding conventions, and key commands.

## Project Overview

**Name**: Next.js Prisma Boilerplate
**Description**: A modern full-stack web application boilerplate built with Next.js 16, Prisma ORM, and Tailwind CSS 4.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **Authentication**: Clerk with Google OAuth, email/password, and Prisma user sync
- **State Management**: TanStack Query (React Query)
- **Form Management**: React Hook Form
- **Validation**: Zod
- **Theming**: next-themes (Dark Mode)

## Project Structure

```
├── .github/              # GitHub Configuration
│   ├── ISSUE_TEMPLATE/   # Issue forms (bug reports, features, questions)
│   ├── workflows/        # GitHub Actions (auto-label, stale, welcome, etc.)
│   ├── AUTOMATION.md     # Automation documentation
│   ├── CODEOWNERS        # Code ownership
│   └── PULL_REQUEST_TEMPLATE.md
├── app/                  # Next.js App Router (pages, layouts, api)
│   ├── api/              # API Routes (including auth)
│   ├── login/            # Login page route
│   ├── layout.tsx        # Root layout with providers
│   └── page.tsx          # Home page
├── components/           # React Components
│   ├── auth/             # Authentication specific components (forms)
│   ├── ui/               # Reusable UI primitives (shadcn/ui)
│   └── theme-toggle.tsx  # Dark mode toggle
├── hooks/                # Custom React Hooks
├── lib/                  # Utilities and Libraries
│   ├── api/              # Client-side API wrappers (Axios)
│   ├── repositories/     # Object-style data access layers
│   ├── services/         # Object-style backend service layers
│   ├── routes.ts         # Route definitions for auth middleware
│   ├── prisma.ts         # Prisma client singleton
│   └── utils.ts          # Helper functions (cn, etc.)
├── prisma/               # Database Schema and Migrations
├── proxy.ts              # Next.js 16 middleware (auth route protection)
└── public/               # Static Assets
```

## Key Conventions

### Naming

- **Files**: `kebab-case.tsx` or `kebab-case.ts`
- **Directories**: `kebab-case`
- **Components**: `PascalCase`
- **Exports**: Named exports preferred for components.

### Component Architecture

- **UI Primitives**: Place reusable, generic UI components in `components/ui`.
- **Feature Components**: Group components by feature (e.g., `components/auth`).
- **Pages**: Keep `app` directory files minimal; import logic/components from `components/`.

### Authentication

- Use **Clerk** for Google OAuth and email/password authentication.
- Prisma stores the local app user, keyed by `clerkId` and merged by email when appropriate.
- Route protection is handled by `proxy.ts` with Clerk middleware.
- Protected routes automatically redirect unauthenticated users to `/login`.
- Auth routes (`/login`, `/register`) automatically redirect authenticated users to `/dashboard`.

### Forms & Validation

- Use **React Hook Form** for form state management.
- Use **Zod** for schema validation.
- Define schemas in `lib/schemas/`.

### Styling

- Use **Tailwind CSS** for styling.
- Use `cn()` utility for class merging.
- Support Dark Mode via `next-themes` and `dark:` variant.

## GitHub Automation

- **Issue Forms**: Interactive YAML-based forms for bug reports, feature requests, and questions.
- **Auto-Labeling**: Issues are automatically labeled based on keywords (auth, database, ui, api, etc.).
- **Auto-Assignment**: Issues are automatically assigned to team members based on labels.
- **Stale Management**: Inactive issues are marked stale after 60 days and closed after 7 more days.
- **Welcome Messages**: First-time contributors receive automated welcome messages.
- **Issue Validation**: Bug reports are validated for required information.
- **Duplicate Detection**: Potential duplicate issues are automatically detected and flagged.
- **Priority Labeling**: Issues are automatically prioritized based on urgency keywords.
- See `.github/AUTOMATION.md` for full documentation.

## Database

- Schema defined in `prisma/schema.prisma`.
- Always run `npx prisma generate` after schema changes.
- Use `npx prisma migrate dev` for migrations.

## Common Commands

- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run lint`: Run ESLint.
- `npm run db:seed`: Seed the database.
- `npx prisma studio`: Open Prisma Studio.
- `npm run clean`: Clears the repository of sample UI pages (docs, landing, dashboard) and sets up a clean Next.js boilerplate.
- `npm run restore`: Reverts the `npm run clean` changes and restores the sample pages back into their original locations.

## Documentation & Tracking

- Keep the `/docs` page updated with any architectural changes.
- **CRITICAL**: Every time a new feature is added or an existing one is modified, the `FEATURES.md` file in the root directory **MUST** be updated to reflect the current state of the boilerplate. This ensures a clear and up-to-date roadmap/feature list for users and collaborators.
