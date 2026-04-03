'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: string
  private: boolean
  default_branch: string
  updated_at: string
  already_connected: boolean
}

export default function ConnectRepoPage() {
  const router = useRouter()
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchRepos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/github/repos')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRepos(data.repos)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load repositories.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRepos()
  }, [fetchRepos])

  async function connectRepo(repo: GitHubRepo) {
    setConnecting(repo.id)
    setError(null)
    try {
      const res = await fetch('/api/github/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_repo_id: repo.id,
          github_repo_name: repo.name,
          github_full_name: repo.full_name,
          github_owner: repo.owner,
          default_branch: repo.default_branch,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect repository.')
    } finally {
      setConnecting(null)
    }
  }

  const filtered = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-1"
          >
            Back
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Connect a repository</h1>
          <p className="mt-1 text-sm text-gray-500">
            Select a GitHub repository to start auto-generating changelogs.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && repos.length > 0 && (
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none"
            />
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">Loading your repositories...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">
                {search ? 'No repositories match your search.' : 'No repositories found.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((repo) => (
                <li
                  key={repo.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {repo.full_name}
                      </span>
                      {repo.private && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                          private
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{repo.default_branch} branch</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {repo.already_connected ? (
                      <span className="text-xs text-green-600 font-medium">Connected</span>
                    ) : (
                      <button
                        onClick={() => connectRepo(repo)}
                        disabled={connecting === repo.id}
                        className="text-sm px-4 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50"
                      >
                        {connecting === repo.id ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
