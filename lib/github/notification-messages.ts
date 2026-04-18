type GithubNotificationMessage = {
  telegramText: string
  telegramDisablePreview?: boolean
  discordContent: string
  discordEmbeds?: Array<Record<string, unknown>>
}

function escapeTelegramHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function summarizeCommitMessage(message: string) {
  const [firstLine] = message.split('\n')
  return firstLine.trim()
}

function createDiscordColor(eventName: string) {
  if (eventName === 'create') return 0xea580c
  if (eventName === 'issues') return 0x2563eb
  if (eventName === 'pull_request') return 0x7c3aed
  if (eventName === 'push') return 0x059669
  return 0x334155
}

export function buildGithubNotificationMessage({
  eventName,
  payload,
  repositoryFullName,
}: {
  eventName: string
  payload: Record<string, unknown>
  repositoryFullName: string
}): GithubNotificationMessage | null {
  const issue = payload.issue as
    | {
        number?: number
        title?: string
        html_url?: string
        user?: { login?: string; avatar_url?: string }
      }
    | undefined
  const issueComment = payload.comment as
    | {
        body?: string
        html_url?: string
        user?: { login?: string; avatar_url?: string }
      }
    | undefined
  const pullRequest = payload.pull_request as
    | {
        number?: number
        title?: string
        html_url?: string
        user?: { login?: string; avatar_url?: string }
      }
    | undefined
  const commits = Array.isArray(payload.commits)
    ? (payload.commits as Array<{
        id?: string
        message?: string
        url?: string
        author?: { name?: string }
      }>)
    : []
  const pusher = payload.pusher as { name?: string } | undefined
  const compareUrl =
    typeof payload.compare === 'string' ? payload.compare : undefined
  const ref = typeof payload.ref === 'string' ? payload.ref : undefined
  const refType = typeof payload.ref_type === 'string' ? payload.ref_type : undefined
  const branchName = ref?.split('/').pop()
  const action =
    typeof payload.action === 'string' ? payload.action : undefined

  if (eventName === 'issues' && action && ['opened', 'edited', 'closed', 'reopened'].includes(action)) {
    const title = issue?.title ?? 'Untitled issue'
    const author = issue?.user?.login ?? 'Unknown user'
    const issueUrl = issue?.html_url ?? `https://github.com/${repositoryFullName}/issues`
    const issueNumber = issue?.number ? `#${issue.number}` : 'Issue'
    const actionLabel =
      action === 'reopened'
        ? 'reopened'
        : action === 'edited'
          ? 'updated'
          : action

    return {
      telegramText: [
        `<b>Issue ${escapeTelegramHtml(actionLabel)}</b>`,
        `<b>Repository:</b> ${escapeTelegramHtml(repositoryFullName)}`,
        `<b>Issue:</b> ${escapeTelegramHtml(issueNumber)} — ${escapeTelegramHtml(title)}`,
        `<b>Author:</b> ${escapeTelegramHtml(author)}`,
        `<a href="${issueUrl}">Open issue on GitHub</a>`,
      ].join('\n'),
      discordContent: [
        `**Issue ${actionLabel}** in \`${repositoryFullName}\``,
        `${issue?.number ? `Issue #${issue.number}` : 'Issue'} by **${author}**`,
      ].join('\n'),
      discordEmbeds: [
        {
          title,
          url: issueUrl,
          color: createDiscordColor(eventName),
          author: {
            name: author,
            ...(issue?.user?.avatar_url ? { icon_url: issue.user.avatar_url } : {}),
          },
          fields: [
            { name: 'Repository', value: repositoryFullName, inline: true },
            { name: 'Number', value: issue?.number ? `#${issue.number}` : '—', inline: true },
            { name: 'Action', value: actionLabel[0].toUpperCase() + actionLabel.slice(1), inline: true },
          ],
        },
      ],
    }
  }

  if (
    eventName === 'pull_request' &&
    action &&
    ['opened', 'edited', 'closed', 'reopened', 'synchronize'].includes(action)
  ) {
    const title = pullRequest?.title ?? 'Untitled pull request'
    const author = pullRequest?.user?.login ?? 'Unknown user'
    const pullUrl =
      pullRequest?.html_url ?? `https://github.com/${repositoryFullName}/pulls`
    const pullNumber = pullRequest?.number ? `#${pullRequest.number}` : 'Pull request'
    const actionLabel =
      action === 'synchronize'
        ? 'updated'
        : action === 'reopened'
          ? 'reopened'
          : action

    return {
      telegramText: [
        `<b>Pull request ${escapeTelegramHtml(actionLabel)}</b>`,
        `<b>Repository:</b> ${escapeTelegramHtml(repositoryFullName)}`,
        `<b>Pull request:</b> ${escapeTelegramHtml(pullNumber)} — ${escapeTelegramHtml(title)}`,
        `<b>Author:</b> ${escapeTelegramHtml(author)}`,
        `<a href="${pullUrl}">Review pull request on GitHub</a>`,
      ].join('\n'),
      discordContent: [
        `**Pull request ${actionLabel}** in \`${repositoryFullName}\``,
        `${pullRequest?.number ? `PR #${pullRequest.number}` : 'Pull request'} by **${author}**`,
      ].join('\n'),
      discordEmbeds: [
        {
          title,
          url: pullUrl,
          color: createDiscordColor(eventName),
          author: {
            name: author,
            ...(pullRequest?.user?.avatar_url
              ? { icon_url: pullRequest.user.avatar_url }
              : {}),
          },
          fields: [
            { name: 'Repository', value: repositoryFullName, inline: true },
            {
              name: 'Number',
              value: pullRequest?.number ? `#${pullRequest.number}` : '—',
              inline: true,
            },
            { name: 'Action', value: actionLabel[0].toUpperCase() + actionLabel.slice(1), inline: true },
          ],
        },
      ],
    }
  }

  if (eventName === 'issue_comment' && action === 'created') {
    const targetTitle = issue?.title ?? pullRequest?.title ?? 'Conversation'
    const targetNumber = issue?.number ?? pullRequest?.number
    const author = issueComment?.user?.login ?? 'Unknown user'
    const commentUrl =
      issueComment?.html_url ??
      issue?.html_url ??
      pullRequest?.html_url ??
      `https://github.com/${repositoryFullName}/issues`
    const preview = issueComment?.body
      ? summarizeCommitMessage(issueComment.body).slice(0, 160)
      : 'New comment posted.'
    const targetLabel = pullRequest ? 'Pull request' : 'Issue'

    return {
      telegramText: [
        `<b>New comment posted</b>`,
        `<b>Repository:</b> ${escapeTelegramHtml(repositoryFullName)}`,
        `<b>${targetLabel}:</b> ${escapeTelegramHtml(
          `${targetNumber ? `#${targetNumber}` : ''} ${targetTitle}`.trim()
        )}`,
        `<b>Author:</b> ${escapeTelegramHtml(author)}`,
        `<b>Preview:</b> ${escapeTelegramHtml(preview)}`,
        `<a href="${commentUrl}">Open discussion on GitHub</a>`,
      ].join('\n'),
      discordContent: [
        `**New comment posted** in \`${repositoryFullName}\``,
        `${targetLabel} ${targetNumber ? `#${targetNumber}` : ''} by **${author}**`,
      ].join('\n'),
      discordEmbeds: [
        {
          title: targetTitle,
          url: commentUrl,
          color: 0x0f766e,
          author: {
            name: author,
            ...(issueComment?.user?.avatar_url
              ? { icon_url: issueComment.user.avatar_url }
              : {}),
          },
          description: preview,
          fields: [
            { name: 'Repository', value: repositoryFullName, inline: true },
            { name: 'Target', value: targetLabel, inline: true },
            {
              name: 'Number',
              value: targetNumber ? `#${targetNumber}` : '—',
              inline: true,
            },
          ],
        },
      ],
    }
  }

  if (eventName === 'push') {
    const commitCount = commits.length
    const pusherName = pusher?.name || 'Someone'
    const topCommit = commits[commits.length - 1]
    const summary = topCommit?.message
      ? summarizeCommitMessage(topCommit.message)
      : commitCount
        ? `${commitCount} new commit${commitCount === 1 ? '' : 's'}`
        : 'New code pushed'

    return {
      telegramText: [
        `<b>New push received</b>`,
        `<b>Repository:</b> ${escapeTelegramHtml(repositoryFullName)}`,
        branchName
          ? `<b>Branch:</b> ${escapeTelegramHtml(branchName)}`
          : null,
        `<b>Pushed by:</b> ${escapeTelegramHtml(pusherName)}`,
        `<b>Commits:</b> ${commitCount}`,
        `<b>Latest update:</b> ${escapeTelegramHtml(summary)}`,
        compareUrl ? `<a href="${compareUrl}">View compare on GitHub</a>` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      discordContent: [
        `**New push received** in \`${repositoryFullName}\``,
        `**${pusherName}** pushed ${commitCount} commit${commitCount === 1 ? '' : 's'}${branchName ? ` to \`${branchName}\`` : ''}`,
      ].join('\n'),
      discordEmbeds: [
        {
          title: summary,
          ...(compareUrl ? { url: compareUrl } : {}),
          color: createDiscordColor(eventName),
          fields: [
            { name: 'Repository', value: repositoryFullName, inline: true },
            { name: 'Pusher', value: pusherName, inline: true },
            { name: 'Commits', value: String(commitCount), inline: true },
            ...(branchName
              ? [{ name: 'Branch', value: branchName, inline: true }]
              : []),
          ],
          description: topCommit?.message
            ? `Latest commit: ${summarizeCommitMessage(topCommit.message)}`
            : undefined,
        },
      ],
    }
  }

  if (eventName === 'create' && refType === 'branch') {
    const sender = payload.sender as
      | { login?: string; avatar_url?: string }
      | undefined
    const createdBranchName =
      typeof payload.ref === 'string' ? payload.ref : branchName ?? 'unknown'
    const compareBranchUrl = `https://github.com/${repositoryFullName}/tree/${createdBranchName}`
    const actor = sender?.login ?? 'Someone'

    return {
      telegramText: [
        `<b>New branch created</b>`,
        `<b>Repository:</b> ${escapeTelegramHtml(repositoryFullName)}`,
        `<b>Branch:</b> ${escapeTelegramHtml(createdBranchName)}`,
        `<b>Author:</b> ${escapeTelegramHtml(actor)}`,
        `<a href="${compareBranchUrl}">Open branch on GitHub</a>`,
      ].join('\n'),
      discordContent: [
        `**New branch created** in \`${repositoryFullName}\``,
        `**${actor}** created \`${createdBranchName}\``,
      ].join('\n'),
      discordEmbeds: [
        {
          title: createdBranchName,
          url: compareBranchUrl,
          color: createDiscordColor(eventName),
          author: {
            name: actor,
            ...(sender?.avatar_url ? { icon_url: sender.avatar_url } : {}),
          },
          fields: [
            { name: 'Repository', value: repositoryFullName, inline: true },
            { name: 'Type', value: 'Branch', inline: true },
          ],
        },
      ],
    }
  }

  return null
}

export function buildReminderDeliveryMessage({
  repository,
  issueNumber,
  note,
}: {
  repository: string
  issueNumber: number
  note: string | null
}) {
  const issueUrl = `https://github.com/${repository}/issues/${issueNumber}`
  const issueLabel = `Issue #${issueNumber}`

  return {
    telegramText: [
      `<b>Issue reminder</b>`,
      `<b>Repository:</b> ${escapeTelegramHtml(repository)}`,
      `<b>Issue:</b> ${escapeTelegramHtml(issueLabel)}`,
      note ? `<b>Note:</b> ${escapeTelegramHtml(note)}` : null,
      `<a href="${issueUrl}">Open issue on GitHub</a>`,
    ]
      .filter(Boolean)
      .join('\n'),
    discordContent: [
      `**Issue reminder** for \`${repository}\``,
      `Follow up on **Issue #${issueNumber}**${note ? `\n> ${note}` : ''}`,
    ].join('\n'),
    discordEmbeds: [
      {
        title: `Issue #${issueNumber}`,
        url: issueUrl,
        color: 0xf59e0b,
        fields: [{ name: 'Repository', value: repository, inline: true }],
        ...(note ? { description: note } : {}),
      },
    ],
  }
}
