import { createExternalApi, getAxiosErrorMessage } from '@/lib/axios'

const DISCORD_API_BASE_URL = 'https://discord.com/api/v10'

function getDiscordBotToken() {
  const botToken = process.env.DISCORD_BOT_TOKEN

  if (!botToken) {
    throw new Error('DISCORD_BOT_TOKEN is not configured.')
  }

  return botToken
}

function getDiscordApplicationId() {
  const applicationId = process.env.DISCORD_APPLICATION_ID

  if (!applicationId) {
    throw new Error('DISCORD_APPLICATION_ID is not configured.')
  }

  return applicationId
}

export type DiscordApplicationCommand = {
  id: string
  application_id: string
  name: string
  description: string
  type: number
}

export type DiscordGuildChannel = {
  id: string
  name: string
  type: number
}

function createDiscordApi() {
  return createExternalApi({
    baseURL: DISCORD_API_BASE_URL,
    headers: {
      Authorization: `Bot ${getDiscordBotToken()}`,
    },
  })
}

const syncHubCommands = [
  {
    name: 'link',
    description: 'Link your Discord account to SyncHub',
    type: 1,
    options: [
      {
        type: 3,
        name: 'code',
        description: 'The one-time SyncHub link code',
        required: true,
      },
    ],
  },
  {
    name: 'whoami',
    description: 'Show the SyncHub user linked to this Discord account',
    type: 1,
  },
  {
    name: 'status',
    description: 'Show your connected SyncHub integrations',
    type: 1,
  },
] as const

export async function registerDiscordCommands() {
  try {
    const response = await createDiscordApi().put<DiscordApplicationCommand[]>(
      `/applications/${getDiscordApplicationId()}/commands`,
      syncHubCommands
    )

    return response.data
  } catch (error) {
    throw new Error(
      getAxiosErrorMessage(error, 'Discord command registration failed')
    )
  }
}

export async function getDiscordCommands() {
  try {
    const response = await createDiscordApi().get<DiscordApplicationCommand[]>(
      `/applications/${getDiscordApplicationId()}/commands`
    )

    return response.data
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, 'Discord get commands failed'))
  }
}

export async function listDiscordGuildTextChannels(guildId: string) {
  try {
    const response = await createDiscordApi().get<DiscordGuildChannel[]>(
      `/guilds/${guildId}/channels`
    )

    return response.data
      .filter((channel) => channel.type === 0 || channel.type === 5)
      .sort((left, right) => left.name.localeCompare(right.name))
  } catch (error) {
    throw new Error(
      getAxiosErrorMessage(error, 'Discord get guild channels failed')
    )
  }
}

export async function sendDiscordMessage({
  channelId,
  content,
  embeds,
}: {
  channelId: string
  content: string
  embeds?: Array<Record<string, unknown>>
}) {
  try {
    const response = await createDiscordApi().post(
      `/channels/${channelId}/messages`,
      {
        content,
        embeds: embeds ?? [],
        allowed_mentions: {
          parse: [],
        },
      }
    )

    return response.data
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, 'Discord send message failed'))
  }
}
