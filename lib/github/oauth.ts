import { createExternalApi, getAxiosErrorMessage } from '@/lib/axios'

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const DEFAULT_GITHUB_SCOPES = ['repo', 'read:user']

type GithubOAuthTokenResponse = {
  access_token: string
  scope: string
  token_type: string
}

type GithubUserResponse = {
  id: number
  login: string
  avatar_url: string
  html_url: string
  name: string | null
}

function getBaseAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured.')
  }

  return appUrl.replace(/\/$/, '')
}

function getGitHubClientId() {
  const clientId = process.env.GITHUB_CLIENT_ID

  if (!clientId) {
    throw new Error('GITHUB_CLIENT_ID is not configured.')
  }

  return clientId
}

function getGitHubClientSecret() {
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientSecret) {
    throw new Error('GITHUB_CLIENT_SECRET is not configured.')
  }

  return clientSecret
}

export function getGitHubOAuthCallbackUrl() {
  return `${getBaseAppUrl()}/api/integrations/github/callback`
}

export function createGitHubOAuthAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: getGitHubClientId(),
    redirect_uri: getGitHubOAuthCallbackUrl(),
    scope: DEFAULT_GITHUB_SCOPES.join(' '),
    state,
  })

  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`
}

export async function exchangeGitHubCodeForToken(code: string) {
  try {
    const response = await createExternalApi({
      headers: {
        Accept: 'application/json',
      },
    }).post<
      GithubOAuthTokenResponse | { error?: string; error_description?: string }
    >(GITHUB_ACCESS_TOKEN_URL, {
      client_id: getGitHubClientId(),
      client_secret: getGitHubClientSecret(),
      code,
      redirect_uri: getGitHubOAuthCallbackUrl(),
    })

    const body = response.data

    if ('error' in body && body.error) {
      throw new Error(body.error_description ?? body.error)
    }

    if (!('access_token' in body) || !body.access_token) {
      throw new Error('GitHub did not return an access token.')
    }

    return body as GithubOAuthTokenResponse
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, 'Unable to exchange GitHub code'))
  }
}

export async function fetchGitHubOAuthUser(accessToken: string) {
  try {
    const response = await createExternalApi({
      baseURL: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'SyncHub',
      },
    }).get<GithubUserResponse>('/user')

    return response.data
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, 'Unable to fetch GitHub user'))
  }
}
