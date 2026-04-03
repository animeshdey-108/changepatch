"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Logo, NavBar, PageShell } from "@/app/components/ui"

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
  const [search, setSearch] = useState("")

  const fetchRepos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/github/repos")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRepos(data.repos)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load repositories.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRepos() }, [fetchRepos])

  async function connectRepo(repo: GitHubRepo) {
    setConnecting(repo.id)
    setError(null)
    try {
      const res = await fetch("/api/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      router.push("/dashboard")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to connect repository.")
    } finally {
      setConnecting(null)
    }
  }

  const filtered = repos.filter((r) => r.full_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <PageShell>
      <NavBar>
        <Logo />
        <button onClick={() => router.push("/dashboard")} className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">
          Back to dashboard
        </button>
      </NavBar>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight mb-1">Connect a repository</h1>
          <p className="text-sm text-zinc-500">Select a GitHub repository to start auto-generating changelogs.</p>
        </div>

        <div className="mb-4 px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-start gap-3">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 flex-shrink-0">
            <rect x="1.5" y="6" width="11" height="7" rx="1.5" stroke="#71717A" strokeWidth="1.2"/>
            <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <p className="text-xs text-zinc-500 leading-relaxed">
            ChangePatch requests read-only access to your commit history only. It cannot write code, open pull requests, or modify your repository in any way.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100">
            <p className="text-sm text-rose-600">{error}</p>
          </div>
        )}

        {!loading && repos.length > 0 && (
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
            />
          </div>
        )}

        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-3" />
              <p className="text-sm text-zinc-400">Loading your repositories...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-zinc-400">{search ? "No repositories match your search." : "No repositories found."}</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {filtered.map((repo) => (
                <li key={repo.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50/80 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900 truncate">{repo.full_name}</span>
                      {repo.private && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500">private</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{repo.default_branch}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {repo.already_connected ? (
                      <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Connected
                      </span>
                    ) : (
                      <button
                        onClick={() => connectRepo(repo)}
                        disabled={connecting === repo.id}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-50 transition-all flex items-center gap-1.5"
                      >
                        {connecting === repo.id ? (
                          <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Connecting...</>
                        ) : "Connect"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-4 text-xs text-zinc-400 text-center">
          Don't see your repo? <a href="https://github.com/settings/connections/applications" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-zinc-600">Check GitHub permissions</a>
        </p>
      </div>
    </PageShell>
  )
}
