import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: repoId } = await params

  const { data: repo } = await supabase
    .from('repos')
    .select('id')
    .eq('id', repoId)
    .eq('user_id', user.id)
    .single()

  if (!repo) {
    return NextResponse.json({ error: 'Repo not found' }, { status: 404 })
  }

  const { data: drafts, error } = await supabase
  .from('generated_entries')
  .select('id, ai_draft, status, created_at, reasoning')
  .eq('repo_id', repoId)
  .eq('status', 'draft')
  .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 })
  }

  return NextResponse.json({ drafts: drafts ?? [] })
}