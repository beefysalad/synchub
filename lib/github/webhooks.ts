import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'

type WebhookProvisionParams = {
  userId: string
  owner: string
  repo: string
  webhookUrl: string
  secret: string
}

export const githubWebhookService = {
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

    // First, verify if we already have a webhook for this URL to avoid duplicates
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingHooks = await githubRequest<any[]>(
      `/repos/${owner}/${repo}/hooks`,
      { method: 'GET' },
      accessToken
    )

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
            events: ['push', 'pull_request', 'issues', 'issue_comment'],
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
          events: ['push', 'pull_request', 'issues', 'issue_comment'],
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
