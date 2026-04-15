import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import {
  DEFAULT_LOGIN_REDIRECT,
  authRoutes,
  publicRoutes,
} from '@/lib/routes'

const isPublicRoute = createRouteMatcher(publicRoutes)
const isAuthRoute = createRouteMatcher(authRoutes)

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth()

  if (isAuthRoute(req)) {
    if (userId) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url))
    }

    return NextResponse.next()
  }

  if (
    !userId &&
    !isPublicRoute(req) &&
    !req.nextUrl.pathname.startsWith('/api/')
  ) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }

  return NextResponse.next()
})

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
