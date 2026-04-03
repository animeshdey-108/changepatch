import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Json } from '@/lib/supabase/types'

const publishSchema = z.object({
  generated_entry_id: z.string().uuid(),
  entries: z.array(z.object({
    type: z.enum(['feature', 'fix', 'improvement']),
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
  })),
  original_draft: z.array(z.object({
    type: z.string(),
    title: z.string(),
    description: z.string(),
  })),
  review_duration_ms: z.number().optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = publishSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { generated_entry_id, entries, original_draft, review_duration_ms } = parsed.data

  // verify ownership
  const { data: generatedEntry } = await supabase
    .from('generated_entries')
    .select('id, repo_id, ai_draft, status')
    .eq('id', generated_entry_id)
    .single()

  if (!generatedEntry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }

  if (generatedEntry.status !== 'draft') {
    return NextResponse.json({ error: 'Entry already published or discarded' }, { status: 409 })
  }

  // publish each entry
  const publishedIds: string[] = []

  for (const entry of entries) {
    const { data: published, error } = await supabase
      .from('published_entries')
      .insert({
        repo_id: generatedEntry.repo_id,
        generated_entry_id,
        title: entry.title,
        description: entry.description,
        entry_type: entry.type,
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !published) {
      console.error('Failed to publish entry:', error)
      continue
    }

    publishedIds.push(published.id)
  }

  // calculate diff for data flywheel
  const originalTitles = original_draft.map((e) => e.title).join(' ')
  const publishedTitles = entries.map((e) => e.title).join(' ')
  const originalWords = originalTitles.split(' ').length
  const publishedWords = publishedTitles.split(' ').length
  const approvedUnchanged =
    JSON.stringify(original_draft.map((e) => ({ type: e.type, title: e.title, description: e.description }))) ===
    JSON.stringify(entries.map((e) => ({ type: e.type, title: e.title, description: e.description })))

  // store edit diff — data flywheel
  await serviceSupabase.from('edit_diffs').insert({
    generated_entry_id,
    published_entry_id: publishedIds[0] ?? null,
    original_draft: original_draft as unknown as Json,
    published_version: entries as unknown as Json,
    words_added: Math.max(0, publishedWords - originalWords),
    words_removed: Math.max(0, originalWords - publishedWords),
    entries_removed: Math.max(0, original_draft.length - entries.length),
    approved_unchanged: approvedUnchanged,
    review_duration_ms: review_duration_ms ?? null,
  })

  // mark generated entry as published
  await supabase
    .from('generated_entries')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('id', generated_entry_id)

  return NextResponse.json({
    success: true,
    published_count: publishedIds.length,
    published_ids: publishedIds,
  })
}