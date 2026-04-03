"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Nav, Spinner } from "@/app/components/ui"

interface Entry {
  type: "feature" | "fix" | "improvement"
  title: string
  description: string
}

interface GeneratedEntry {
  id: string
  ai_draft: Entry[]
  status: string
  created_at: string
  reasoning?: string
}

interface RepoPageProps {
  params: Promise<{ id: string }>
}

const TYPE_BADGE: Record<string, string> = {
  feature: "cp-badge-feat",
  fix: "cp-badge-fix",
  improvement: "cp-badge-improve",
}

const TYPE_LABEL: Record<string, string> = {
  feature: "feat",
  fix: "fix",
  improvement: "improve",
}

export default function RepoPage({ params }: RepoPageProps) {
  const router = useRouter()
  const [drafts, setDrafts] = useState<GeneratedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [discarding, setDiscarding] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const reviewStartTimes = useRef<Record<string, number>>({})
  const repoIdRef = useRef<string>("")

  useEffect(() => {
    params.then((p) => {
      repoIdRef.current = p.id
      fetchDrafts(p.id)
    })
  }, [params])

  async function fetchDrafts(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/repos/${id}/drafts`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDrafts(data.drafts)
      data.drafts.forEach((d: GeneratedEntry) => { reviewStartTimes.current[d.id] = Date.now() })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load drafts.")
    } finally {
      setLoading(false)
    }
  }

  function updateEntry(draftId: string, idx: number, field: keyof Entry, value: string) {
    setDrafts((prev) => prev.map((d) => {
      if (d.id !== draftId) return d
      const entries = [...d.ai_draft]
      entries[idx] = { ...entries[idx], [field]: value }
      return { ...d, ai_draft: entries }
    }))
  }

  function removeEntry(draftId: string, idx: number) {
    setDrafts((prev) => prev.map((d) => {
      if (d.id !== draftId) return d
      return { ...d, ai_draft: d.ai_draft.filter((_, i) => i !== idx) }
    }))
  }

  async function publishDraft(draft: GeneratedEntry, original: Entry[]) {
    if (draft.ai_draft.length === 0) { setError("No entries to publish. Discard instead."); return }
    const ms = reviewStartTimes.current[draft.id] ? Date.now() - reviewStartTimes.current[draft.id] : undefined
    setPublishing(draft.id)
    setError(null)
    try {
      const res = await fetch("/api/entries/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generated_entry_id: draft.id, entries: draft.ai_draft, original_draft: original, review_duration_ms: ms }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(`published ${data.published_count} ${data.published_count === 1 ? "entry" : "entries"}`)
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id))
      setTimeout(() => setSuccess(null), 4000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to publish.")
    } finally { setPublishing(null) }
  }

  async function discardDraft(id: string) {
    setDiscarding(id)
    try {
      await fetch("/api/entries/discard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ generated_entry_id: id }) })
      setDrafts((prev) => prev.filter((d) => d.id !== id))
    } catch { setError("Failed to discard.") }
    finally { setDiscarding(null) }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Nav
        right={
          <button onClick={() => router.push("/dashboard")} className="text-[11px] font-mono text-text-ghost hover:text-text-primary transition-colors">
            dashboard
          </button>
        }
      />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-lg font-semibold text-text-primary tracking-tight mb-1">Review drafts</h1>
          <p className="text-[12px] font-mono text-text-ghost">ai-generated entries waiting for your review</p>
        </div>

        <div className="mb-5 px-4 py-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/[0.15] flex items-start gap-2.5 animate-fade-up">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="mt-0.5 flex-shrink-0"><path d="M7 1.5L12.5 11H1.5L7 1.5Z" stroke="#fbbf24" strokeWidth="1.2" strokeLinejoin="round"/><path d="M7 5.5v2.5M7 9.5v.5" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round"/></svg>
          <p className="text-[11px] font-mono text-amber-400/80 leading-relaxed">
            review before publishing -- you are responsible for all published content
          </p>
        </div>

        {success && (<div className="mb-4 px-4 py-3 rounded-xl bg-green-500/[0.08] border border-green-500/[0.2]"><p className="text-[11px] font-mono text-green-400">{success}</p></div>)}
        {error && (<div className="mb-4 px-4 py-3 rounded-xl bg-red-500/[0.08] border border-red-500/[0.2]"><p className="text-[11px] font-mono text-red-400">{error}</p></div>)}

        {loading ? (
          <div className="cp-card p-12 flex flex-col items-center gap-3">
            <Spinner size={20} />
            <p className="text-[11px] font-mono text-text-ghost">loading drafts...</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="cp-card p-12 text-center">
            <p className="text-sm font-medium text-text-primary mb-1">no drafts to review</p>
            <p className="text-[11px] font-mono text-text-ghost">push code to your repo to generate a draft</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-up">
            {drafts.map((draft) => {
              const original = JSON.parse(JSON.stringify(draft.ai_draft)) as Entry[]
              return (
                <div key={draft.id} className="cp-card overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-text-ghost">ai draft</span>
                      <span className="text-[10px] font-mono text-text-ghost opacity-50">
                        {new Date(draft.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <span className="cp-badge-draft">not reviewed</span>
                  </div>

                  {draft.reasoning && (
                    <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.04]">
                      <p className="text-[10px] font-mono text-text-ghost leading-relaxed">
                        <span className="text-text-dim">reasoning: </span>{draft.reasoning}
                      </p>
                    </div>
                  )}

                  {draft.ai_draft.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-[11px] font-mono text-text-ghost">no user-facing changes found in these commits</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {draft.ai_draft.map((entry, idx) => (
                        <div key={idx} className="px-5 py-4">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <select
                              value={entry.type}
                              onChange={(e) => updateEntry(draft.id, idx, "type", e.target.value)}
                              className={`cp-badge cursor-pointer border-0 focus:outline-none focus:ring-1 focus:ring-white/10 bg-transparent ${TYPE_BADGE[entry.type] ?? "text-text-muted"}`}
                            >
                              <option value="feature">feat</option>
                              <option value="fix">fix</option>
                              <option value="improvement">improve</option>
                            </select>
                            <button onClick={() => removeEntry(draft.id, idx)} className="text-[10px] font-mono text-text-ghost hover:text-red-400 transition-colors">remove</button>
                          </div>
                          <input
                            type="text"
                            value={entry.title}
                            onChange={(e) => updateEntry(draft.id, idx, "title", e.target.value)}
                            placeholder="entry title"
                            className="w-full text-sm font-medium text-text-primary bg-transparent border-0 border-b border-white/[0.06] focus:border-white/20 focus:outline-none pb-2 mb-2 transition-colors placeholder:text-text-ghost font-sans"
                          />
                          <textarea
                            value={entry.description}
                            onChange={(e) => updateEntry(draft.id, idx, "description", e.target.value)}
                            placeholder="entry description"
                            rows={2}
                            className="w-full text-[13px] text-text-dim bg-transparent border-0 focus:outline-none resize-none leading-relaxed placeholder:text-text-ghost font-sans"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
                    <button onClick={() => discardDraft(draft.id)} disabled={discarding === draft.id} className="text-[10px] font-mono text-text-ghost hover:text-red-400 disabled:opacity-40 transition-colors">
                      {discarding === draft.id ? "discarding..." : "discard"}
                    </button>
                    <PublishButton draftId={draft.id} publishing={publishing} count={draft.ai_draft.length} onPublish={() => publishDraft(draft, original)} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function PublishButton({ draftId, publishing, count, onPublish }: { draftId: string; publishing: string | null; count: number; onPublish: () => void }) {
  const [reviewed, setReviewed] = useState(false)
  return (
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="w-3.5 h-3.5 rounded border-white/20 bg-transparent cursor-pointer accent-white" />
        <span className="text-[10px] font-mono text-text-ghost">{"i have reviewed this"}</span>
      </label>
      <button
        onClick={onPublish}
        disabled={!reviewed || publishing === draftId || count === 0}
        className="cp-btn-primary text-xs px-4 py-1.5 gap-1.5"
      >
        {publishing === draftId ? <><Spinner size={12} />publishing...</> : `publish ${count === 1 ? "1 entry" : `${count} entries`}`}
      </button>
    </div>
  )
}
