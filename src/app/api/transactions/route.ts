import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase_admin'

export async function GET() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const amount = Number(body.amount)
  const category = typeof body.category === 'string' ? body.category : ''
  const type = body.type

  if (!title || !category || Number.isNaN(amount)) {
    return NextResponse.json({ error: 'Invalid transaction' }, { status: 400 })
  }

  if (type !== 'expense' && type !== 'manual') {
    return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('transactions')
    .insert({ title, amount, category, type })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
