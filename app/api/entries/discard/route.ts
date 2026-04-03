import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const discardSchema = z.object({
  generated_entry_id: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = discardSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  await supabase
    .from('generated_entries')
    .update({ status: 'discarded', updated_at: new Date().toISOString() })
    .eq('id', parsed.data.generated_entry_id)

  return NextResponse.json({ success: true })
}