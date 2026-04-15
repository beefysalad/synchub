import { Server } from 'lucide-react'
import React from 'react'

const ApiRoutes = () => {
  return (
    <section id="api-routes" className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
          <Server className="size-5" />
        </div>
        <h2 className="text-3xl font-bold">API Routes</h2>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
          <h3 className="mb-4 text-xl font-bold">Creating Routes</h3>
          <p className="mb-4 text-zinc-600 dark:text-neutral-400">
            Define API endpoints in{' '}
            <code className="rounded bg-zinc-200 px-1 dark:bg-neutral-800">
              app/api/
            </code>{' '}
            directories using <code className="font-mono">route.ts</code>.
          </p>
          <div className="overflow-hidden rounded-xl bg-zinc-900 p-4 dark:bg-neutral-950">
            <pre className="overflow-x-auto text-sm text-zinc-300">
              <code>{`import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await prisma.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}`}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
          <h3 className="mb-4 text-xl font-bold">Client-Side API Calls</h3>
          <p className="mb-4 text-zinc-600 dark:text-neutral-400">
            Use <code className="font-mono">@tanstack/react-query</code> with
            the API wrapper:
          </p>
          <div className="overflow-hidden rounded-xl bg-zinc-900 p-4 dark:bg-neutral-950">
            <pre className="overflow-x-auto text-sm text-zinc-300">
              <code>{`import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

function UsersList() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/api/users'),
  });
  
  if (isLoading) return <div>Loading...</div>;
  return <div>{/* Render users */}</div>;
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ApiRoutes
