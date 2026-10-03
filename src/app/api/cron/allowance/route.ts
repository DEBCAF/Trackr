import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase_admin'

export async function GET(request: Request) {
  // Verify authorization header
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const ownerId = process.env.TRACKR_OWNER_ID
  if (!ownerId) {
    return NextResponse.json({ error: 'Missing TRACKR_OWNER_ID' }, { status: 500 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const slot = searchParams.get('slot')
  if (slot !== 'morning') {
    return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
  }

  const amount = 40
  const { error } = await supabaseAdmin.from('transactions').insert({
    title: 'Daily Allowance (Morning)',
    amount,
    category: 'Allowance',
    type: 'allowance',
    user_id: ownerId,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, added: amount, slot })
}
