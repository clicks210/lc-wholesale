import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, customer_id, status')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 })
  }

  return NextResponse.json({ success: true, orders: data })
}