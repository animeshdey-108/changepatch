import { nanoid } from 'nanoid'

export function generateWebhookSecret(): string {
  return nanoid(32)
}

export function getWebhookUrl(appUrl: string): string {
  return `${appUrl}/api/webhooks/github`
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    const hashArray = Array.from(new Uint8Array(sig))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    const expectedSignature = `sha256=${hashHex}`

    // timing-safe comparison
    if (signature.length !== expectedSignature.length) return false

    let result = 0
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i)
    }
    return result === 0
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}