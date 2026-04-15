export function buildTelegramDeepLink(token: string) {
  const username = process.env.TELEGRAM_BOT_USERNAME

  if (!username) {
    throw new Error('TELEGRAM_BOT_USERNAME is not configured.')
  }

  return `https://t.me/${username}?start=${token}`
}
