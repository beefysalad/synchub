export function buildTelegramDeepLink(token: string) {
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, '')

  if (!username) {
    throw new Error('TELEGRAM_BOT_USERNAME is not configured.')
  }

  return `https://t.me/${username}?start=${token}`
}

export function getTelegramWebhookUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured.')
  }

  return `${appUrl.replace(/\/$/, '')}/api/telegram/webhook`
}
