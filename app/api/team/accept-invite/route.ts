import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { token, userId, fullName } = await req.json()

    if (!token || !userId || !fullName) {
      return NextResponse.json(
        {
          error: 'Missing token, userId, or fullName',
        },
        {
          status: 400,
        }
      )
    }

    const cleanFullName = fullName.trim()

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('customer_invites')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        {
          error: 'Invite not found',
        },
        {
          status: 404,
        }
      )
    }

    if (invite.accepted_at) {
      return NextResponse.json(
        {
          error: 'Invite already accepted',
        },
        {
          status: 400,
        }
      )
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        {
          error: 'Invite expired',
        },
        {
          status: 400,
        }
      )
    }

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError || !authUser?.user) {
      return NextResponse.json(
        {
          error: 'User not found',
        },
        {
          status: 404,
        }
      )
    }

    const cleanEmail = invite.email.toLowerCase()

    if (authUser.user.email?.toLowerCase() !== cleanEmail) {
      return NextResponse.json(
        {
          error: 'User email does not match invite email',
        },
        {
          status: 403,
        }
      )
    }

    // profiles table only contains:
    // id, role, created_at

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        role: 'buyer',
      })

    if (profileError) {
      return NextResponse.json(
        {
          error: profileError.message,
        },
        {
          status: 500,
        }
      )
    }

    // customer_members stores membership metadata

    const { error: memberError } = await supabaseAdmin
      .from('customer_members')
      .insert({
        customer_id: invite.customer_id,
        user_id: userId,
        role: invite.role,
        invited_by: invite.invited_by,
        email: cleanEmail,
        full_name: cleanFullName,
      })

    if (memberError) {
      return NextResponse.json(
        {
          error: memberError.message,
        },
        {
          status: 500,
        }
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from('customer_invites')
      .update({
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id)

    if (updateError) {
      return NextResponse.json(
        {
          error: updateError.message,
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (err) {
    console.error('Accept invite error:', err)

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      {
        status: 500,
      }
    )
  }
}