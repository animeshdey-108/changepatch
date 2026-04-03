import { getProfile } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const { data: repos } = await supabase
    .from('repos')
    .select('id, github_full_name, default_branch, is_active, created_at')
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const repoIds = repos?.map((r) => r.id) ?? []

  const { data: pages } = await supabase
    .from('changelog_pages')
    .select('repo_id, slug')
    .in('repo_id', repoIds.length > 0 ? repoIds : ['none'])

  const pageByRepoId = Object.fromEntries(
    pages?.map((p) => [p.repo_id, p.slug]) ?? []
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-semibold text-gray-900">ChangePatch</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{profile.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Repositories</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {repos?.length ?? 0} connected
            </p>
          </div>
          <Link
            href="/dashboard/connect"
            className="text-sm px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            Connect repository
          </Link>
        </div>

        {!repos || repos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                  fill="#9CA3AF"
                />
              </svg>
            </div>
            <h2 className="text-base font-medium text-gray-900 mb-1">
              No repositories connected
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Connect a GitHub repository to start auto-generating changelogs.
            </p>
            <Link
              href="/dashboard/connect"
              className="inline-flex text-sm px-5 py-2.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              Connect your first repository
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {repos.map((repo) => {
              const slug = pageByRepoId[repo.id]
              return (
                <div
                  key={repo.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {repo.github_full_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {repo.default_branch} branch
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {slug && (
                      <Link
                        href={`/changelog/${slug}`}
                        className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        View changelog
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/repos/${repo.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}