import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const { data: invite, error } = await supabaseAdmin
      .from('customer_invites')
      .select(`
        id,
        email,
        role,
        customer_id,
        accepted_at,
        expires_at,
        customer:customers (
          business_name
        )
      `)
      .eq('token', token)
      .single()

    if (error || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (invite.accepted_at) {
      return NextResponse.json(
        { error: 'Invite already accepted' },
        { status: 400 }
      )
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 400 })
    }

    const customer = Array.isArray(invite.customer)
      ? invite.customer[0]
      : invite.customer

    return NextResponse.json({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      customerId: invite.customer_id,
      businessName: customer?.business_name || 'your team',
    })
  } catch (err) {
    console.error('Invite lookup error:', err)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}