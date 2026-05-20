import { Resend } from 'resend'
import WeeklySpecialsEmail from '@/components/emails/WeeklySpecialsEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      recipients,
      title,
      headline,
      deliveryCutoff,
      products,
    } = body

    if (!process.env.RESEND_API_KEY) {
      return Response.json(
        { error: 'Missing RESEND_API_KEY' },
        { status: 500 }
      )
    }

    if (!recipients?.length) {
      return Response.json(
        { error: 'No recipients selected' },
        { status: 400 }
      )
    }

    if (!products?.length) {
      return Response.json(
        { error: 'No products selected' },
        { status: 400 }
      )
    }

    const from =
      process.env.RESEND_FROM_EMAIL ||
      'Local Connect <onboarding@resend.dev>'

    const results = []

    for (const recipient of recipients) {
      if (!recipient.email) continue

      const { data, error } = await resend.emails.send({
        from,
        to: recipient.email,
        subject: title || "This Week's Specials",
        react: WeeklySpecialsEmail({
          headline,
          deliveryCutoff,
          products,
        }),
      })

      results.push({
        recipient: recipient.email,
        data,
        error,
      })
    }

    return Response.json({
      success: true,
      sent: results.filter((item) => !item.error).length,
      failed: results.filter((item) => item.error).length,
      results,
    })
  } catch (error) {
    console.error('SEND CAMPAIGN ERROR:', error)

    return Response.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    )
  }
}