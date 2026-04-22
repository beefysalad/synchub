'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function normalizeGitHubMarkdown(value: string) {
  return value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(
      /<details>\s*<summary>([\s\S]*?)<\/summary>\s*([\s\S]*?)<\/details>/gi,
      (_, summary: string, content: string) =>
        `\n\n**${summary.trim()}**\n\n${content.trim()}\n\n`
    )
    .replace(/<\/?details>/gi, '')
    .replace(/<summary>([\s\S]*?)<\/summary>/gi, (_, summary: string) =>
      `\n\n**${summary.trim()}**\n\n`
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function GitHubMarkdown({ children }: { children: string }) {
  const normalized = normalizeGitHubMarkdown(
    children || '*No description provided.*'
  )

  return (
    <div className="prose prose-slate prose-sm dark:prose-invert max-w-none break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalized}</ReactMarkdown>
    </div>
  )
}
