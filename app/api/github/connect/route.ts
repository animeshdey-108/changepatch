import { createClient } from '@/lib/supabase/server'
import { registerWebhook } from '@/lib/github/api'
import { generateWebhookSecret, getWebhookUrl } from '@/lib/github/webhook'
import { nanoid } from 'nanoid'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const connectSchema = z.object({
  github_repo_id: z.number(),
  github_repo_name: z.string(),
  github_full_name: z.string(),
  github_owner: z.string(),
  default_branch: z.string(),
})

const PLAN_REPO_LIMITS: Record<string, number> = {
  free: 1,
  starter: 3,
  growth: 10,
  agency: 999,
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { data: existingRepos } = await supabase
    .from('repos')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const repoCount = existingRepos?.length ?? 0
  const limit = PLAN_REPO_LIMITS[profile.plan] ?? 1

  if (repoCount >= limit) {
    return NextResponse.json(
      {
        error: `Your ${profile.plan} plan allows ${limit} repo${limit === 1 ? '' : 's'}. Upgrade to connect more.`,
        upgrade_required: true,
      },
      { status: 403 }
    )
  }

  const body = await request.json()
  const parsed = connectSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const {
    github_repo_id,
    github_repo_name,
    github_full_name,
    github_owner,
    default_branch,
  } = parsed.data

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const accessToken = session?.provider_token

  if (!accessToken) {
    return NextResponse.json(
      { error: 'GitHub access token not found. Please sign in again.' },
      { status: 401 }
    )
  }

  const webhookSecret = generateWebhookSecret()
  const webhookUrl = getWebhookUrl(process.env.NEXT_PUBLIC_APP_URL!)

  try {
    const webhookId = await registerWebhook(
      accessToken,
      github_owner,
      github_repo_name,
      webhookUrl,
      webhookSecret
    )

    const { data: repo, error: repoError } = await supabase
      .from('repos')
      .insert({
        user_id: user.id,
        github_repo_id,
        github_repo_name,
        github_full_name,
        github_owner,
        default_branch,
        webhook_id: webhookId,
        webhook_secret: webhookSecret,
        provider: 'github' as const,
        is_active: true,
      })
      .select()
      .single()

    if (repoError || !repo) {
      console.error('Failed to save repo:', repoError)
      return NextResponse.json(
        { error: 'Failed to save repository.' },
        { status: 500 }
      )
    }

    const slug = `${github_owner}-${github_repo_name}-${nanoid(6)}`.toLowerCase()

    await supabase.from('changelog_pages').insert({
      repo_id: repo.id,
      slug,
      title: `${github_repo_name} changelog`,
      is_public: true,
      branding: {
        powered_by: profile.plan === 'free',
        primary_color: '#000000',
        logo_url: null,
        custom_css: null,
      },
    })

    return NextResponse.json({
      success: true,
      repo_id: repo.id,
      message: `${github_full_name} connected successfully.`,
    })
  } catch (error: unknown) {
    console.error('Failed to connect repo:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to register webhook: ${message}` },
      { status: 500 }
    )
  }
}