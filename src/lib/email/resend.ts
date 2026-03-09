import { Resend } from 'resend'

let resendClient: Resend | null = null

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const client = getClient()

  if (!client) {
    // Dev fallback: log to console
    console.log(`[EMAIL DEV] Verification code for ${to}: ${code}`)
    return { success: true }
  }

  try {
    const { error } = await client.emails.send({
      from: 'GigMole <noreply@gigmole.cc>',
      to,
      subject: 'Your GigMole verification code',
      text: `Your GigMole verification code is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, please ignore this email.`,
    })

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send email',
    }
  }
}

export async function sendApiKeyResetEmail(
  to: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const client = getClient()

  if (!client) {
    console.log(`[EMAIL DEV] API Key reset code for ${to}: ${code}`)
    return { success: true }
  }

  try {
    const { error } = await client.emails.send({
      from: 'GigMole <noreply@gigmole.cc>',
      to,
      subject: 'GigMole API Key Reset',
      text: `Your GigMole API key reset code is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, please ignore this email.`,
    })

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send email',
    }
  }
}
