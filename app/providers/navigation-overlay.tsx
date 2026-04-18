'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Spinner } from '@/components/ui/spinner'

const OVERLAY_MIN_DURATION_MS = 220

function isSameRoute(url: URL) {
  return (
    url.pathname === window.location.pathname &&
    url.search === window.location.search &&
    url.hash === window.location.hash
  )
}

export function NavigationOverlay() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isVisible, setIsVisible] = useState(false)
  const visibleAtRef = useRef<number | null>(null)
  const showTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    function showOverlay() {
      visibleAtRef.current = Date.now()
      if (showTimeoutRef.current !== null) {
        window.clearTimeout(showTimeoutRef.current)
      }

      showTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(true)
        showTimeoutRef.current = null
      }, 0)
    }

    function handleDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      const anchor = target.closest('a')
      if (!(anchor instanceof HTMLAnchorElement)) {
        return
      }

      if (
        !anchor.href ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        anchor.getAttribute('rel') === 'external'
      ) {
        return
      }

      const nextUrl = new URL(anchor.href, window.location.href)

      if (nextUrl.origin !== window.location.origin || isSameRoute(nextUrl)) {
        return
      }

      showOverlay()
    }

    const originalPushState = window.history.pushState.bind(window.history)
    const originalReplaceState = window.history.replaceState.bind(window.history)

    window.history.pushState = function patchedPushState(...args) {
      const nextUrl = args[2]
      if (typeof nextUrl === 'string') {
        const resolvedUrl = new URL(nextUrl, window.location.href)
        if (resolvedUrl.origin === window.location.origin && !isSameRoute(resolvedUrl)) {
          showOverlay()
        }
      }

      return originalPushState(...args)
    }

    window.history.replaceState = function patchedReplaceState(...args) {
      const nextUrl = args[2]
      if (typeof nextUrl === 'string') {
        const resolvedUrl = new URL(nextUrl, window.location.href)
        if (resolvedUrl.origin === window.location.origin && !isSameRoute(resolvedUrl)) {
          showOverlay()
        }
      }

      return originalReplaceState(...args)
    }

    document.addEventListener('click', handleDocumentClick, true)

    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      if (showTimeoutRef.current !== null) {
        window.clearTimeout(showTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isVisible) {
      return
    }

    const elapsed =
      visibleAtRef.current === null ? OVERLAY_MIN_DURATION_MS : Date.now() - visibleAtRef.current
    const remaining = Math.max(0, OVERLAY_MIN_DURATION_MS - elapsed)
    const timeout = window.setTimeout(() => {
      setIsVisible(false)
      visibleAtRef.current = null
    }, remaining)

    return () => window.clearTimeout(timeout)
  }, [pathname, searchParams, isVisible])

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/72 backdrop-blur-xl">
      <div className="flex min-w-[220px] flex-col items-center gap-4 px-8 py-7 text-center">
        <Spinner className="text-primary size-8" />
        <div className="space-y-1">
          <p className="text-foreground text-base font-semibold tracking-tight">
            Redirecting
          </p>
          <p className="text-muted-foreground text-sm">
            Loading your next workspace view...
          </p>
        </div>
      </div>
    </div>
  )
}
