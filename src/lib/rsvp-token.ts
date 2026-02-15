import { createHmac } from 'crypto'

const SECRET = process.env.RSVP_TOKEN_SECRET || 'dev-secret-change-in-production'

export function generateRsvpToken(assignmentId: string, status: string): string {
  const hmac = createHmac('sha256', SECRET)
  hmac.update(`${assignmentId}:${status}`)
  return hmac.digest('hex')
}

export function verifyRsvpToken(assignmentId: string, status: string, token: string): boolean {
  const expected = generateRsvpToken(assignmentId, status)
  return expected === token
}

export function generateRsvpUrl(assignmentId: string, status: string): string {
  const token = generateRsvpToken(assignmentId, status)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${appUrl}/api/rsvp/${assignmentId}?status=${status}&token=${token}`
}
