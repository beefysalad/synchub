import React from 'react'

const ContributeStep = ({
  num,
  title,
  desc,
}: {
  num: string
  title: string
  desc: string
}) => {
  return (
    <div className="flex gap-6">
      <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 font-mono text-sm font-bold text-zinc-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        {num}
      </div>
      <div className="flex-1 pt-1">
        <h3 className="mb-2 text-xl font-semibold">{title}</h3>
        <p className="text-zinc-600 dark:text-neutral-400">{desc}</p>
      </div>
    </div>
  )
}

export default ContributeStep
