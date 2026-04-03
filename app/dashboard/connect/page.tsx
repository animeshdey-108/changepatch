"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Nav, Spinner } from "@/app/components/ui"

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
    <div className="min-h-screen bg-surface">
      <Nav
        right={
          <button onClick={() => router.push("/dashboard")} className="text-[11px] font-mono text-text-ghost hover:text-text-primary transition-colors">
            back to dashboard
          </button>
        }
      />

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-lg font-semibold text-text-primary tracking-tight mb-1">Connect a repository</h1>
          <p className="text-sm text-text-dim">Select a GitHub repository to start auto-generating changelogs.</p>
        </div>

        <div className="mb-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3 animate-fade-up">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="mt-0.5 flex-shrink-0">
            <rect x="1.5" y="6" width="11" height="7" rx="1.5" stroke="#52525b" strokeWidth="1.2"/>
            <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="#52525b" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <p className="text-[11px] font-mono text-text-ghost leading-relaxed">
            read-only access to commit history only -- cannot write code, open PRs, or modify your repo
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-up">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {!loading && repos.length > 0 && (
          <div className="mb-3 animate-fade-up">
            <input
              type="text"
              placeholder="search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cp-input font-mono text-xs"
            />
          </div>
        )}

        <div className="cp-card overflow-hidden animate-fade-up">
          {loading ? (
            <div className="p-12 flex flex-col items-center gap-3">
              <Spinner size={20} />
              <p className="text-[11px] font-mono text-text-ghost">fetching repositories...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-text-dim">{search ? "no repositories match your search" : "no repositories found"}</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {filtered.map((repo) => (
                <li key={repo.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary truncate">{repo.full_name}</span>
                      {repo.private && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-text-ghost">private</span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-text-ghost mt-0.5">{repo.default_branch}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {repo.already_connected ? (
                      <span className="text-[11px] font-mono text-green-400 flex items-center gap-1.5">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        connected
                      </span>
                    ) : (
                      <button
                        onClick={() => connectRepo(repo)}
                        disabled={connecting === repo.id}
                        className="cp-btn-secondary text-xs px-3 py-1.5 gap-1.5"
                      >
                        {connecting === repo.id ? <><Spinner size={12} />connecting...</> : "connect"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-4 text-center text-[10px] font-mono text-text-ghost">
          {"dont see your repo? "}
          <a href="https://github.com/settings/connections/applications" target="_blank" rel="noopener noreferrer" className="text-text-dim hover:text-text-primary underline underline-offset-2 transition-colors">check github permissions</a>
        </p>
      </div>
    </div>
  )
}
