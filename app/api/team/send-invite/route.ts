import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { inviteId } = await req.json()

    if (!inviteId) {
      return NextResponse.json({ error: 'Missing inviteId' }, { status: 400 })
    }

    const { data: invite, error } = await supabaseAdmin
      .from('customer_invites')
      .select(`
        id,
        email,
        token,
        role,
        accepted_at,
        expires_at,
        customer:customers (
          business_name
        )
      `)
      .eq('id', inviteId)
      .single()

    if (error || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (invite.accepted_at) {
      return NextResponse.json({ error: 'Invite already accepted' }, { status: 400 })
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 400 })
    }

    const customer = Array.isArray(invite.customer)
      ? invite.customer[0]
      : invite.customer

    const businessName = customer?.business_name || 'your team'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${siteUrl}/accept-invite?token=${invite.token}`

    const { error: emailError } = await resend.emails.send({
      from: 'Local Connect <noreply@lcfoodservice.ca>',
      to: invite.email,
      subject: `You've been invited to join ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>You’ve been invited to join Local Connect</h2>

          <p>You’ve been invited to access the business account for:</p>

          <p style="font-weight: bold;">${businessName}</p>

          <p>Click the button below to create your account and join the team.</p>

          <a
            href="${inviteUrl}"
            style="
              display: inline-block;
              margin-top: 16px;
              background: #244f3d;
              color: white;
              padding: 12px 18px;
              text-decoration: none;
              font-weight: bold;
            "
          >
            Accept Invite
          </a>

          <p style="margin-top: 24px; font-size: 14px; color: #666;">
            This invite will expire in 7 days.
          </p>
        </div>
      `,
    })

    if (emailError) {
      return NextResponse.json(
        { error: 'Invite created but email failed to send.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send invite error:', err)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}