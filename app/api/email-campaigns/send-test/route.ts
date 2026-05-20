import { Resend } from 'resend'
import WeeklySpecialsEmail from '@/components/emails/WeeklySpecialsEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const body = await req.json()

  const { to, title, headline, deliveryCutoff, products } = body

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Local Connect <onboarding@resend.dev>',
    to,
    subject: title || 'This Week’s Specials',
    react: WeeklySpecialsEmail({
      headline,
      deliveryCutoff,
      products,
    }),
  })

  if (error) {
    console.error('RESEND ERROR:', error)
    return Response.json({ error }, { status: 500 })
  }

  console.log('RESEND SENT:', data)
  return Response.json({ data })
}