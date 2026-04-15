function hexToUint8Array(value: string) {
  if (value.length % 2 !== 0) {
    throw new Error('Invalid hex string length.')
  }

  const bytes = new Uint8Array(value.length / 2)

  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = parseInt(value.slice(index, index + 2), 16)
  }

  return bytes
}

function getDiscordPublicKey() {
  const publicKey = process.env.DISCORD_PUBLIC_KEY

  if (!publicKey) {
    throw new Error('DISCORD_PUBLIC_KEY is not configured.')
  }

  return publicKey
}

export async function verifyDiscordRequest({
  body,
  signature,
  timestamp,
}: {
  body: string
  signature: string
  timestamp: string
}) {
  const subtle = globalThis.crypto?.subtle

  if (!subtle) {
    throw new Error('Web Crypto is not available in this runtime.')
  }

  const publicKey = await subtle.importKey(
    'raw',
    hexToUint8Array(getDiscordPublicKey()),
    { name: 'Ed25519' },
    false,
    ['verify']
  )

  return subtle.verify(
    { name: 'Ed25519' },
    publicKey,
    hexToUint8Array(signature),
    new TextEncoder().encode(timestamp + body)
  )
}
