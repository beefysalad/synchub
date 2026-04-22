import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

import { GitHubMarkdown } from '@/components/shared/github-markdown'

interface ConversationEntryProps {
  avatarUrl?: string
  body: string
  createdAt: string
  username: string
}
const ConversationEntry = ({
  avatarUrl,
  body,
  createdAt,
  username,
}: ConversationEntryProps) => {
  return (
    <div className="flex gap-4">
      <Image
        src={avatarUrl ?? `https://github.com/${username}.png`}
        alt={username}
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800"
      />
      <div className="min-w-0 flex-1">
        <div className="px-1 py-1 text-sm transition-all duration-300">
          <span className="font-semibold">{username}</span> commented{' '}
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </div>
        <div className="px-1 py-4">
          <GitHubMarkdown>{body || '*No description provided.*'}</GitHubMarkdown>
        </div>
      </div>
    </div>
  )
}

export default ConversationEntry
