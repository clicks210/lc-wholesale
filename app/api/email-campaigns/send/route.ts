import { Resend } from 'resend'
import WeeklySpecialsEmail from '@/components/emails/WeeklySpecialsEmail'

export async function POST(req: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return Response.json(
        { error: 'Missing RESEND_API_KEY' },
        { status: 500 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const body = await req.json()

    const {
      recipients,
      title,
      headline,
      deliveryCutoff,
      products,
    } = body

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

      const result = await resend.emails.send({
        from,
        to: recipient.email,
        subject: title || "This Week's Specials",
        react: WeeklySpecialsEmail({
          headline,
          deliveryCutoff,
          products,
        }),
      })

      console.log('RESEND RESULT:', result)

      results.push({
        recipient: recipient.email,
        data: result.data,
        error: result.error,
      })
    }

    const failed = results.filter((item) => item.error)

    if (failed.length) {
      return Response.json(
        {
          success: false,
          sent: results.length - failed.length,
          failed: failed.length,
          results,
        },
        { status: 207 }
      )
    }

    return Response.json({
      success: true,
      sent: results.length,
      failed: 0,
      results,
    })
  } catch (error) {
    console.error('SEND CAMPAIGN ERROR:', error)

    return Response.json(
      {
        error: 'Failed to send campaign',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}