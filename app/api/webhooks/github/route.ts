import { createServiceClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/github/webhook'
import { NextResponse } from 'next/server'

const MAX_COMMITS = 20

interface GitHubCommit {
  id: string
  message: string
  timestamp: string
  author: {
    name: string
    email: string
  }
}

interface GitHubPushPayload {
  ref: string
  repository: {
    id: number
    full_name: string
  }
  commits: GitHubCommit[]
  head_commit: GitHubCommit | null
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-hub-signature-256')
  const event = request.headers.get('x-github-event')

  // only process push events
  if (event !== 'push') {
    return NextResponse.json({ message: 'Event ignored' }, { status: 200 })
  }

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  let payload: GitHubPushPayload
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ignore branch deletions (commits array is empty)
  if (!payload.commits || payload.commits.length === 0) {
    return NextResponse.json({ message: 'No commits' }, { status: 200 })
  }

  const supabase = await createServiceClient()

  // find the repo by github_repo_id
  const { data: repo, error: repoError } = await supabase
    .from('repos')
    .select('id, user_id, webhook_secret, default_branch, is_active')
    .eq('github_repo_id', payload.repository.id)
    .eq('is_active', true)
    .single()

  if (repoError || !repo) {
    console.error('Repo not found for webhook:', payload.repository.full_name)
    return NextResponse.json({ error: 'Repo not found' }, { status: 404 })
  }

  // verify webhook signature using repo-specific secret
  const isValid = await verifyWebhookSignature(body, signature, repo.webhook_secret)
  if (!isValid) {
    console.error('Invalid webhook signature for repo:', payload.repository.full_name)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // extract branch name from ref (refs/heads/main -> main)
  const branch = payload.ref.replace('refs/heads/', '')

  // only process pushes to the default branch
  if (branch !== repo.default_branch) {
    return NextResponse.json(
      { message: `Branch ${branch} ignored, only processing ${repo.default_branch}` },
      { status: 200 }
    )
  }

  // check user plan and generation limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, generations_used_this_month, generations_reset_at')
    .eq('id', repo.user_id)
    .single()

  if (profile) {
    const planLimits: Record<string, number> = {
      free: 5,
      starter: 999999,
      growth: 999999,
      agency: 999999,
    }

    // reset monthly counter if needed
    const resetAt = new Date(profile.generations_reset_at)
    const now = new Date()
    if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
      await supabase
        .from('profiles')
        .update({
          generations_used_this_month: 0,
          generations_reset_at: new Date().toISOString(),
        })
        .eq('id', repo.user_id)
    } else {
      const limit = planLimits[profile.plan] ?? 5
      if (profile.generations_used_this_month >= limit) {
        console.log(`Generation limit reached for user ${repo.user_id} on plan ${profile.plan}`)
        return NextResponse.json(
          { message: 'Generation limit reached' },
          { status: 200 }
        )
      }
    }
  }

  // strip PII — never store author emails
  // cap at MAX_COMMITS most recent commits
  const commits = payload.commits
    .slice(0, MAX_COMMITS)
    .map((commit) => ({
      sha: commit.id,
      message: commit.message.split('\n')[0].trim(),
      timestamp: commit.timestamp,
      author_name: commit.author.name,
      // intentionally omitting commit.author.email — GDPR
    }))

  // store commit set
  const { data: commitSet, error: commitSetError } = await supabase
    .from('commit_sets')
    .insert({
      repo_id: repo.id,
      commits,
      branch,
      commit_count: commits.length,
      pushed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (commitSetError || !commitSet) {
    console.error('Failed to store commit set:', commitSetError)
    return NextResponse.json({ error: 'Failed to store commits' }, { status: 500 })
  }

  // queue AI generation
  const { error: queueError } = await supabase
    .from('pending_generations')
    .insert({
      commit_set_id: commitSet.id,
      repo_id: repo.id,
      status: 'queued',
      provider: 'openai',
      next_retry_at: new Date().toISOString(),
    })

  if (queueError) {
    console.error('Failed to queue generation:', queueError)
    return NextResponse.json({ error: 'Failed to queue generation' }, { status: 500 })
  }

  // increment generation counter
  await supabase
    .from('profiles')
    .update({
      generations_used_this_month: (profile?.generations_used_this_month ?? 0) + 1,
    })
    .eq('id', repo.user_id)

  console.log(
    `Webhook processed: ${payload.repository.full_name} — ${commits.length} commits queued for generation`
  )

  return NextResponse.json({
    message: 'Webhook processed successfully',
    commit_set_id: commitSet.id,
    commits_queued: commits.length,
  })
}