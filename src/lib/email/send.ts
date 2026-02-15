import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface InvitationEmailParams {
  to: string
  inviterName: string
  boatName: string
  token: string
  role: 'admin' | 'crew'
}

export async function sendInvitationEmail({
  to,
  inviterName,
  boatName,
  token,
  role,
}: InvitationEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${token}`

  // If no API key, log instead of sending
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] Invitation to ${to} for boat "${boatName}": ${inviteUrl}`)
    return
  }

  await resend.emails.send({
    from: 'Crew <onboarding@resend.dev>',
    to,
    subject: `${inviterName} invited you to join ${boatName}`,
    html: `
      <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #0F1117; color: #E8E9ED;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: rgba(14,165,233,0.1); border-radius: 12px; padding: 12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
              <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
              <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
              <path d="M12 10v4"/>
              <path d="M12 2v3"/>
            </svg>
          </div>
        </div>
        <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 8px; text-align: center;">You're invited!</h1>
        <p style="color: #8B8D97; margin: 0 0 24px; font-size: 14px; line-height: 1.6; text-align: center;">
          <strong style="color: #E8E9ED;">${inviterName}</strong> has invited you to join
          <strong style="color: #E8E9ED;">${boatName}</strong> as ${role === 'admin' ? 'an admin' : 'crew'}.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${inviteUrl}" style="display: inline-block; background: #0EA5E9; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
            Accept Invitation
          </a>
        </div>
        <div style="border-top: 1px solid #22252F; padding-top: 16px;">
          <p style="color: #8B8D97; margin: 0 0 8px; font-size: 12px; text-align: center;">
            This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
          </p>
          <p style="color: #555; margin: 0; font-size: 11px; text-align: center;">
            If the button doesn't work, copy and paste this link:<br/>
            <a href="${inviteUrl}" style="color: #0EA5E9; word-break: break-all;">${inviteUrl}</a>
          </p>
        </div>
      </div>
    `,
  })
}
