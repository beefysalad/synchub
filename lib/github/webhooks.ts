import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'

export const SUPPORTED_GITHUB_WEBHOOK_EVENTS = [
  'push',
  'pull_request',
  'issues',
  'issue_comment',
] as const

export type SupportedGitHubWebhookEvent =
  (typeof SUPPORTED_GITHUB_WEBHOOK_EVENTS)[number]

type GitHubRepositoryHook = {
  id: number
  active: boolean
  events: string[]
  config: {
    url?: string
  }
  last_response?: {
    code: number | null
    status: string
    message: string | null
  }
  updated_at?: string
}

type WebhookProvisionParams = {
  userId: string
  owner: string
  repo: string
  webhookUrl: string
  secret: string
}

export const githubWebhookService = {
  async listRepositoryWebhooks({
    userId,
    owner,
    repo,
  }: Omit<WebhookProvisionParams, 'webhookUrl' | 'secret'>) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubRepositoryHook[]>(
      `/repos/${owner}/${repo}/hooks`,
      { method: 'GET' },
      accessToken
    )
  },

  async getRepositoryWebhookStatus({
    userId,
    owner,
    repo,
    webhookUrl,
  }: Omit<WebhookProvisionParams, 'secret'>) {
    const hooks = await this.listRepositoryWebhooks({ userId, owner, repo })
    const hook = hooks.find((candidate) => candidate.config.url === webhookUrl)

    if (!hook) {
      return {
        exists: false,
        active: false,
        events: [] as string[],
        isSyncHubManaged: false,
        lastResponse: null as {
          code: number | null
          status: string
          message: string | null
        } | null,
        updatedAt: null as string | null,
      }
    }

    return {
      exists: true,
      active: hook.active,
      events: hook.events,
      isSyncHubManaged: hook.config.url === webhookUrl,
      lastResponse: hook.last_response
        ? {
            code: hook.last_response.code,
            status: hook.last_response.status,
            message: hook.last_response.message,
          }
        : null,
      updatedAt: hook.updated_at ?? null,
    }
  },

  async provisionRepositoryWebhook({
    userId,
    owner,
    repo,
    webhookUrl,
    secret,
  }: WebhookProvisionParams) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    const existingHooks = await this.listRepositoryWebhooks({
      userId,
      owner,
      repo,
    })

    const hookExists = existingHooks.find(
      (hook) => hook.config.url === webhookUrl
    )

    if (hookExists) {
      // If it exists, update it to ensure our events and secret are cleanly set
      return githubRequest(
        `/repos/${owner}/${repo}/hooks/${hookExists.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            events: [...SUPPORTED_GITHUB_WEBHOOK_EVENTS],
            config: {
              url: webhookUrl,
              content_type: 'json',
              insecure_ssl: '0',
              secret,
            },
          }),
        },
        accessToken
      )
    }

    // Provision a net-new webhook
    return githubRequest(
      `/repos/${owner}/${repo}/hooks`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'web',
          active: true,
          events: [...SUPPORTED_GITHUB_WEBHOOK_EVENTS],
          config: {
            url: webhookUrl,
            content_type: 'json',
            insecure_ssl: '0',
            secret,
          },
        }),
      },
      accessToken
    )
  },
}
