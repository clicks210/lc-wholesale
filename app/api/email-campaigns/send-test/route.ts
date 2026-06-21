import { Resend } from 'resend'
import WeeklySpecialsEmail from '@/components/emails/WeeklySpecialsEmail'

export async function POST(req: Request) {
  try {
    console.log('EMAIL ROUTE HIT')

    if (!process.env.RESEND_API_KEY) {
      console.error('Missing RESEND_API_KEY')
      return Response.json(
        { error: 'Missing RESEND_API_KEY' },
        { status: 500 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const body = await req.json()

    const {
      to,
      recipients,
      title,
      headline,
      deliveryCutoff,
      products,
    } = body

    const finalRecipients =
      Array.isArray(recipients)
        ? recipients
            .map((r) => typeof r === 'string' ? r : r?.email)
            .filter(Boolean)
        : Array.isArray(to)
          ? to
          : to
            ? [to]
            : []

    if (!finalRecipients.length) {
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

    console.log('FROM EMAIL:', from)
    console.log('RECIPIENTS:', finalRecipients)

    const results = []

    for (const email of finalRecipients) {
      const result = await resend.emails.send({
        from,
        to: email,
        subject: title || "This Week's Specials",
        react: WeeklySpecialsEmail({
          headline,
          deliveryCutoff,
          products,
        }),
      })

      console.log('RESEND RESULT:', result)

      results.push({
        recipient: email,
        data: result.data,
        error: result.error,
      })
    }

    const failed = results.filter((item) => item.error)
    const sent = results.filter((item) => !item.error)

    if (failed.length) {
      return Response.json(
        {
          success: false,
          sent: sent.length,
          failed: failed.length,
          results,
        },
        { status: 207 }
      )
    }

    return Response.json({
      success: true,
      sent: sent.length,
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