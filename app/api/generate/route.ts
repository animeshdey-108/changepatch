import { createServiceClient } from '@/lib/supabase/server'
import { generateChangelog } from '@/lib/ai/generate'
import type { CommitInput } from '@/lib/ai/prompt'
import { NextResponse } from 'next/server'

// called by Vercel cron every 5 minutes
// also callable manually for testing: POST /api/generate
export async function POST(request: Request) {
  // simple auth check — cron secret or internal call
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()

  // pick one queued item that is ready to process
  const { data: pending, error: fetchError } = await supabase
    .from('pending_generations')
    .select('id, commit_set_id, repo_id, retry_count, provider')
    .eq('status', 'queued')
    .lte('next_retry_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (fetchError || !pending) {
    return NextResponse.json({ message: 'No pending generations' }, { status: 200 })
  }

  // mark as processing immediately to prevent double-processing
  await supabase
    .from('pending_generations')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', pending.id)

  // fetch the commit set
  const { data: commitSet, error: commitSetError } = await supabase
    .from('commit_sets')
    .select('commits, branch, repo_id')
    .eq('id', pending.commit_set_id)
    .single()

  if (commitSetError || !commitSet) {
    await markFailed(supabase, pending.id, 'Commit set not found')
    return NextResponse.json({ error: 'Commit set not found' }, { status: 404 })
  }

  const commits = commitSet.commits as unknown as CommitInput[]

  if (!commits || commits.length === 0) {
    await supabase
      .from('pending_generations')
      .update({ status: 'done', updated_at: new Date().toISOString() })
      .eq('id', pending.id)
    return NextResponse.json({ message: 'No commits to process' }, { status: 200 })
  }

  try {
    const result = await generateChangelog(commits)

    // store the generated draft
const { data: generatedEntry, error: insertError } = await supabase
  .from('generated_entries')
  .insert({
    commit_set_id: pending.commit_set_id,
    repo_id: pending.repo_id,
    ai_draft: result.entries as unknown as import('@/lib/supabase/types').Json,
    status: 'draft',
    provider: pending.provider,
    prompt_version: 'v1',
  })
  .select()
  .single()

    if (insertError || !generatedEntry) {
      await markFailed(supabase, pending.id, `Failed to store entry: ${insertError?.message}`)
      return NextResponse.json({ error: 'Failed to store generated entry' }, { status: 500 })
    }

    // mark queue item as done
    await supabase
      .from('pending_generations')
      .update({ status: 'done', updated_at: new Date().toISOString() })
      .eq('id', pending.id)

    console.log(
      `Generation complete: ${result.entries.length} entries generated for repo ${pending.repo_id}`
    )
    console.log('Reasoning:', result.reasoning)

    return NextResponse.json({
      success: true,
      generated_entry_id: generatedEntry.id,
      entries_count: result.entries.length,
      reasoning: result.reasoning,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Generation failed:', message)

    const retryCount = (pending.retry_count ?? 0) + 1
    const maxRetries = 3

    if (retryCount >= maxRetries) {
      await markFailed(supabase, pending.id, message)

      // notify user their generation failed
      await notifyGenerationFailed(supabase, pending.repo_id)

      return NextResponse.json(
        { error: `Generation failed after ${maxRetries} attempts: ${message}` },
        { status: 500 }
      )
    }

    // exponential backoff: 2min, 8min, 32min
    const backoffMinutes = Math.pow(4, retryCount - 1) * 2
    const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000)

    await supabase
      .from('pending_generations')
      .update({
        status: 'queued',
        retry_count: retryCount,
        last_error: message,
        next_retry_at: nextRetry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pending.id)

    return NextResponse.json(
      { error: `Generation failed, retrying in ${backoffMinutes} minutes` },
      { status: 500 }
    )
  }
}

async function markFailed(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createServiceClient>>,
  pendingId: string,
  error: string
) {
  await supabase
    .from('pending_generations')
    .update({
      status: 'failed',
      last_error: error,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pendingId)
}

async function notifyGenerationFailed(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createServiceClient>>,
  repoId: string
) {
  // placeholder — will wire up Resend email notification in the email module
  console.log(`TODO: notify user for repo ${repoId} that generation failed`)
}