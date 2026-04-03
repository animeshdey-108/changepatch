import { createClient } from '@/lib/supabase/server'
import { getUserRepos } from '@/lib/github/api'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  try {
    const repos = await getUserRepos(accessToken)

    const { data: connectedRepos } = await supabase
      .from('repos')
      .select('github_repo_id')
      .eq('user_id', user.id)

    const connectedIds = new Set(
      connectedRepos?.map((r) => r.github_repo_id) ?? []
    )

    const availableRepos = repos.map((repo) => ({
      ...repo,
      already_connected: connectedIds.has(repo.id),
    }))

    return NextResponse.json({ repos: availableRepos })
  } catch (error) {
    console.error('Failed to fetch repos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories from GitHub.' },
      { status: 500 }
    )
  }
}