import { nanoid } from 'nanoid'

export function generateWebhookSecret(): string {
  return nanoid(32)
}

export function getWebhookUrl(appUrl: string): string {
  return `${appUrl}/api/webhooks/github`
}