# Nexion - Next.js 16 Boilerplate

A modern Next.js 16 boilerplate with Prisma ORM, PostgreSQL, TypeScript, and Tailwind CSS. This project provides a solid foundation for building full-stack web applications with best practices and developer experience in mind.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Authentication**: Clerk (Google OAuth + email/password)
- **Theming**: next-themes (Dark Mode)
- **Language**: TypeScript
- **Package Manager**: npm
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier with Tailwind CSS plugin

## Prerequisites

- Node.js 20+
- PostgreSQL database for local non-Docker development
- Docker + Docker Compose for the containerized workflow
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone https://github.com/beefysalad/nexion.git
cd nexion
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Configure your database URL and Clerk keys in `.env.local`:

```
DATABASE_URL="postgresql://username:password@localhost:5432/your_database"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."
```

5. Set up the database:

```bash
npx prisma migrate dev
npx prisma generate
```

6. Seed the database (optional):

```bash
npm run db:seed
```

## Getting Started

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Docker Quickstart

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Start the app and database:

```bash
docker compose up --build
```

3. Open [http://localhost:3000](http://localhost:3000).

The Docker entrypoint runs Prisma migrations and seeds the database before the Next.js server starts.

## Docker Development

For hot reload while editing files locally, use the development Compose file instead:

```bash
docker compose -f docker-compose.dev.yml up --build
```

This mounts your workspace into the container, runs Next.js in development mode, and watches for file changes.

## Project Structure

```
├── app/                 # Next.js app router pages and layouts
├── components/          # Reusable React components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard components
│   └── ui/              # shadcn/ui primitives
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and configurations
│   ├── api/             # Client-side API wrappers (Axios)
│   ├── repositories/    # Object-style data access layers
│   ├── services/        # Object-style backend service layers
│   └── routes.ts        # Route definitions and protection rules
├── prisma/             # Database schema and migrations
├── public/             # Static assets
├── proxy.ts            # Clerk-powered route protection
└── components.json     # shadcn/ui configuration
```

## Authentication

This project uses **Clerk** for authentication.

- **Providers**: Google OAuth + Clerk email/password
- **Protection**: Clerk middleware in `proxy.ts`
- **Session Management**: `ClerkProvider` in `RootLayout`
- **User Sync**: Clerk users are mirrored into Prisma and merged by email when appropriate

### Route Protection Configuration

Routes are defined in `lib/routes.ts`:

- `publicRoutes`: Accessible without login.
- `authRoutes`: Redirect to dashboard if already logged in.
- `protectedRoutes`: All other routes require authentication.

## Database

This project uses Prisma as the ORM with PostgreSQL. The schema is defined in `prisma/schema.prisma`.

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Create and run migrations
npx prisma migrate dev

# View database in Prisma Studio
npx prisma studio

# Seed the database
npm run db:seed
```

## Styling

The project uses Tailwind CSS for styling with shadcn/ui components. Components are configured in `components.json`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate the Prisma client
- `npm run db:migrate:deploy` - Apply production migrations
- `npm run lint` - Run ESLint
- `npm run format` - Run Prettier to format code
- `npm run format:check` - Check code formatting with Prettier
- `npm run db:seed` - Seed the database

## Deployment

### Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

1. Connect your GitHub repository
2. Configure environment variables
3. Deploy

### Other Platforms

Ensure your environment variables are properly configured and run:

```bash
npm run build
npm run start
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## Contributing

Feel free to submit issues and enhancement requests!

## Credits

Created by **John Patrick Ryan Mandal**

## License

This project is licensed under the [MIT License](LICENSE).
