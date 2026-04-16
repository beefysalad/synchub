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
  const branchName = ref?.split('/').pop()

  if (eventName === 'issues' && payload.action === 'opened') {
    const title = issue?.title ?? 'Untitled issue'
    const author = issue?.user?.login ?? 'Unknown user'
    const issueUrl = issue?.html_url ?? `https://github.com/${repositoryFullName}/issues`
    const issueNumber = issue?.number ? `#${issue.number}` : 'Issue'

    return {
      telegramText: [
        `<b>New issue opened</b>`,
        `<b>Repository:</b> ${escapeTelegramHtml(repositoryFullName)}`,
        `<b>Issue:</b> ${escapeTelegramHtml(issueNumber)} — ${escapeTelegramHtml(title)}`,
        `<b>Opened by:</b> ${escapeTelegramHtml(author)}`,
        `<a href="${issueUrl}">Open issue on GitHub</a>`,
      ].join('\n'),
      discordContent: [
        `**New issue opened** in \`${repositoryFullName}\``,
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
            { name: 'Action', value: 'Opened', inline: true },
          ],
        },
      ],
    }
  }

  if (eventName === 'pull_request' && payload.action === 'opened') {
    const title = pullRequest?.title ?? 'Untitled pull request'
    const author = pullRequest?.user?.login ?? 'Unknown user'
    const pullUrl =
      pullRequest?.html_url ?? `https://github.com/${repositoryFullName}/pulls`
    const pullNumber = pullRequest?.number ? `#${pullRequest.number}` : 'Pull request'

    return {
      telegramText: [
        `<b>New pull request opened</b>`,
        `<b>Repository:</b> ${escapeTelegramHtml(repositoryFullName)}`,
        `<b>Pull request:</b> ${escapeTelegramHtml(pullNumber)} — ${escapeTelegramHtml(title)}`,
        `<b>Opened by:</b> ${escapeTelegramHtml(author)}`,
        `<a href="${pullUrl}">Review pull request on GitHub</a>`,
      ].join('\n'),
      discordContent: [
        `**New pull request opened** in \`${repositoryFullName}\``,
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
            { name: 'Action', value: 'Opened', inline: true },
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
