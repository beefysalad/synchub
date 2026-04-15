'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

type IntegrationActionLinkProps = {
  href: string
  label: string
  loadingLabel?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  className?: string
}

export function IntegrationActionLink({
  href,
  label,
  loadingLabel,
  variant = 'default',
  className,
}: IntegrationActionLinkProps) {
  const [isPending, setIsPending] = useState(false)

  return (
    <Button
      type="button"
      variant={variant}
      disabled={isPending}
      className={className}
      onClick={() => {
        setIsPending(true)
        window.location.assign(href)
      }}
    >
      {isPending ? <Spinner className="size-4" /> : null}
      {isPending ? loadingLabel ?? 'Loading...' : label}
    </Button>
  )
}
