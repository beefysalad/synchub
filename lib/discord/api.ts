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
  const response = await fetch(
    `${DISCORD_API_BASE_URL}/applications/${getDiscordApplicationId()}/commands`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${getDiscordBotToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncHubCommands),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Discord command registration failed: ${errorBody}`)
  }

  return response.json()
}

export async function getDiscordCommands() {
  const response = await fetch(
    `${DISCORD_API_BASE_URL}/applications/${getDiscordApplicationId()}/commands`,
    {
      headers: {
        Authorization: `Bot ${getDiscordBotToken()}`,
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Discord get commands failed: ${errorBody}`)
  }

  return (await response.json()) as DiscordApplicationCommand[]
}

export async function listDiscordGuildTextChannels(guildId: string) {
  const response = await fetch(
    `${DISCORD_API_BASE_URL}/guilds/${guildId}/channels`,
    {
      headers: {
        Authorization: `Bot ${getDiscordBotToken()}`,
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Discord get guild channels failed: ${errorBody}`)
  }

  const channels = (await response.json()) as DiscordGuildChannel[]

  return channels
    .filter((channel) => channel.type === 0 || channel.type === 5)
    .sort((left, right) => left.name.localeCompare(right.name))
}
