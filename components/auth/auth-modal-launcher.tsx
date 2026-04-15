'use client'

import { SignInButton, SignUpButton, useClerk } from '@clerk/nextjs'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

type AuthModalLauncherProps = {
  mode: 'sign-in' | 'sign-up'
}

export function AuthModalLauncher({ mode }: AuthModalLauncherProps) {
  const clerk = useClerk()
  const openedRef = useRef(false)

  useEffect(() => {
    if (openedRef.current) {
      return
    }

    openedRef.current = true

    if (mode === 'sign-in') {
      clerk.openSignIn({
        forceRedirectUrl: '/dashboard',
        signUpForceRedirectUrl: '/dashboard',
      })
      return
    }

    clerk.openSignUp({
      forceRedirectUrl: '/dashboard',
      signInForceRedirectUrl: '/dashboard',
    })
  }, [clerk, mode])

  const title = mode === 'sign-in' ? 'Welcome back' : 'Create account'
  const description =
    mode === 'sign-in'
      ? 'Opening Clerk sign-in modal. Use Google or email to continue.'
      : 'Opening Clerk sign-up modal. Use Google or email to create your account.'

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 selection:bg-zinc-900 selection:text-white dark:bg-neutral-950 dark:selection:bg-neutral-50 dark:selection:text-neutral-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)]" />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 relative w-full max-w-[440px] duration-1000">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-neutral-300"
          >
            <ArrowRight className="size-4 rotate-180 transition-transform group-hover:-translate-x-1" />
            Back to home
          </Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-sm text-zinc-500 dark:text-neutral-400">
            {description}
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 text-center shadow-2xl shadow-zinc-200/50 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/50 dark:shadow-none">
          <p className="mb-6 text-sm text-zinc-600 dark:text-neutral-400">
            If the modal did not open automatically, launch it again below.
          </p>

          {mode === 'sign-in' ? (
            <SignInButton
              mode="modal"
              forceRedirectUrl="/dashboard"
              signUpForceRedirectUrl="/dashboard"
            >
              <Button className="h-12 w-full rounded-full font-bold">
                Open sign in
              </Button>
            </SignInButton>
          ) : (
            <SignUpButton
              mode="modal"
              forceRedirectUrl="/dashboard"
              signInForceRedirectUrl="/dashboard"
            >
              <Button className="h-12 w-full rounded-full font-bold">
                Open sign up
              </Button>
            </SignUpButton>
          )}
        </div>
      </div>
    </div>
  )
}
