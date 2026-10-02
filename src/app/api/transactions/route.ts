import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase_server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  const { data, error } = await supabase
    .from('transactions')
    .insert({ title, amount, category, type, user_id: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
