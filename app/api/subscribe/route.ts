import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const subscribeSchema = z.object({
  email: z.string().email(),
  page_id: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = await createServiceClient()

  const body = await request.json()
  const parsed = subscribeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  const { email, page_id } = parsed.data

  const { data: page } = await supabase
    .from('changelog_pages')
    .select('id, is_public')
    .eq('id', page_id)
    .eq('is_public', true)
    .single()

  if (!page) {
    return NextResponse.json({ error: 'Changelog not found.' }, { status: 404 })
  }

  const { error } = await supabase
    .from('subscribers')
    .upsert(
      { page_id, email, unsubscribed_at: null },
      { onConflict: 'page_id,email' }
    )

  if (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Failed to subscribe.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}