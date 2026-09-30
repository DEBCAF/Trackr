import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase_admin'

export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin()

  // Verify authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const slot = searchParams.get('slot') // 'morning', 'noon', or 'evening'

  let amount = 0
  let title = ''

  if (slot === 'morning') {
    amount = 10.00
    title = 'Daily Allowance (Morning)'
  } else if (slot === 'noon') {
    amount = 15.00
    title = 'Daily Allowance (Noon)'
  } else if (slot === 'evening') {
    amount = 15.00
    title = 'Daily Allowance (Evening)'
  } else {
    return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('transactions').insert({
    title,
    amount,
    category: 'Allowance',
    type: 'allowance',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, added: amount, slot })
}
