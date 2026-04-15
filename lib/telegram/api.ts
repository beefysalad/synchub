const TELEGRAM_API_BASE_URL = 'https://api.telegram.org'

function getTelegramBotToken() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured.')
  }

  return botToken
}

type SendTelegramMessageInput = {
  chatId: string | number
  text: string
}

export async function sendTelegramMessage({
  chatId,
  text,
}: SendTelegramMessageInput) {
  const response = await fetch(
    `${TELEGRAM_API_BASE_URL}/bot${getTelegramBotToken()}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Telegram sendMessage failed: ${errorBody}`)
  }

  return response.json()
}

export async function setTelegramWebhook(webhookUrl: string, secretToken?: string) {
  const response = await fetch(
    `${TELEGRAM_API_BASE_URL}/bot${getTelegramBotToken()}/setWebhook`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secretToken,
      }),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Telegram setWebhook failed: ${errorBody}`)
  }

  return response.json()
}

type TelegramWebhookInfo = {
  ok: boolean
  result: {
    url: string
    has_custom_certificate: boolean
    pending_update_count: number
    last_error_date?: number
    last_error_message?: string
    max_connections?: number
    ip_address?: string
  }
}

export async function getTelegramWebhookInfo() {
  const response = await fetch(
    `${TELEGRAM_API_BASE_URL}/bot${getTelegramBotToken()}/getWebhookInfo`,
    {
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Telegram getWebhookInfo failed: ${errorBody}`)
  }

  return (await response.json()) as TelegramWebhookInfo
}
