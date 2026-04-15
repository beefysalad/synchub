import { Github } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Contributor = ({
  name,
  github,
  image,
}: {
  name: string
  github: string
  image?: string
}) => {
  return (
    <Link
      href={github}
      target="_blank"
      className="group flex flex-col items-center gap-2"
    >
      <div className="flex size-16 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white text-neutral-50 shadow-lg shadow-zinc-200/50 transition-all group-hover:scale-110 group-hover:border-zinc-900 group-hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none dark:group-hover:border-neutral-50">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <Github className="size-8 text-zinc-400 group-hover:text-zinc-900 dark:text-neutral-500 dark:group-hover:text-neutral-100" />
        )}
      </div>
      <span className="text-sm font-bold text-zinc-600 group-hover:text-zinc-900 dark:text-neutral-400 dark:group-hover:text-neutral-100">
        {name}
      </span>
    </Link>
  )
}

export default Contributor
