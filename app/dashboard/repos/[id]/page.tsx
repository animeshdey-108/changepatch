"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Logo, NavBar, PageShell } from "@/app/components/ui"

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

const TYPE_COLORS: Record<string, string> = {
  feature: "bg-blue-50 text-blue-600",
  fix: "bg-rose-50 text-rose-600",
  improvement: "bg-emerald-50 text-emerald-600",
}

export default function RepoPage({ params }: RepoPageProps) {
  const router = useRouter()
  const [repoId, setRepoId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<GeneratedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [discarding, setDiscarding] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const reviewStartTimes = useRef<Record<string, number>>({})

  useEffect(() => {
    params.then((p) => {
      setRepoId(p.id)
      fetchDrafts(p.id)
    })
  }, [params])

  async function fetchDrafts(id: string) {
    setLoading(true)
    setError(null)
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

  function updateEntry(draftId: string, entryIndex: number, field: keyof Entry, value: string) {
    setDrafts((prev) => prev.map((draft) => {
      if (draft.id !== draftId) return draft
      const newEntries = [...draft.ai_draft]
      newEntries[entryIndex] = { ...newEntries[entryIndex], [field]: value }
      return { ...draft, ai_draft: newEntries }
    }))
  }

  function removeEntry(draftId: string, entryIndex: number) {
    setDrafts((prev) => prev.map((draft) => {
      if (draft.id !== draftId) return draft
      return { ...draft, ai_draft: draft.ai_draft.filter((_, i) => i !== entryIndex) }
    }))
  }

  async function publishDraft(draft: GeneratedEntry, originalDraft: Entry[]) {
    if (draft.ai_draft.length === 0) { setError("Cannot publish with no entries. Discard instead."); return }
    const reviewDurationMs = reviewStartTimes.current[draft.id] ? Date.now() - reviewStartTimes.current[draft.id] : undefined
    setPublishing(draft.id)
    setError(null)
    try {
      const res = await fetch("/api/entries/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generated_entry_id: draft.id, entries: draft.ai_draft, original_draft: originalDraft, review_duration_ms: reviewDurationMs }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccessMessage(`Published ${data.published_count} ${data.published_count === 1 ? "entry" : "entries"} successfully.`)
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id))
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to publish.")
    } finally {
      setPublishing(null)
    }
  }

  async function discardDraft(draftId: string) {
    setDiscarding(draftId)
    try {
      const res = await fetch("/api/entries/discard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ generated_entry_id: draftId }) })
      if (!res.ok) throw new Error("Failed")
      setDrafts((prev) => prev.filter((d) => d.id !== draftId))
    } catch { setError("Failed to discard.") }
    finally { setDiscarding(null) }
  }

  return (
    <PageShell>
      <NavBar>
        <Logo />
        <button onClick={() => router.push("/dashboard")} className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">Dashboard</button>
      </NavBar>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight mb-1">Review drafts</h1>
          <p className="text-sm text-zinc-500">AI-generated entries waiting for your review before publishing.</p>
        </div>

        <div className="mb-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 flex-shrink-0"><path d="M7 1.5L12.5 11H1.5L7 1.5Z" stroke="#B45309" strokeWidth="1.2" strokeLinejoin="round"/><path d="M7 5.5v2.5M7 9.5v.5" stroke="#B45309" strokeWidth="1.2" strokeLinecap="round"/></svg>
          <p className="text-xs text-amber-700 leading-relaxed"><strong className="font-medium">Review before publishing.</strong> You are responsible for all content published to your changelog.</p>
        </div>

        {successMessage && (<div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100"><p className="text-sm text-emerald-700">{successMessage}</p></div>)}
        {error && (<div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100"><p className="text-sm text-rose-600">{error}</p></div>)}

        {loading ? (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-12 text-center shadow-sm">
            <div className="inline-block w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-3" />
            <p className="text-sm text-zinc-400">Loading drafts...</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-sm font-medium text-zinc-900 mb-1">No drafts to review</p>
            <p className="text-sm text-zinc-400">Push code to your connected repository to generate a draft.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => {
              const originalDraft = JSON.parse(JSON.stringify(draft.ai_draft)) as Entry[]
              return (
                <div key={draft.id} className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-zinc-500">AI Draft</span>
                      <span className="text-xs text-zinc-400">{new Date(draft.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-600">Not yet reviewed</span>
                  </div>

                  {draft.reasoning && (
                    <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-100">
                      <p className="text-xs text-zinc-500"><span className="font-medium text-zinc-700">AI reasoning: </span>{draft.reasoning}</p>
                    </div>
                  )}

                  {draft.ai_draft.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm text-zinc-400 mb-1">No user-facing changes found in these commits.</p>
                      {draft.reasoning && <p className="text-xs text-zinc-400">{draft.reasoning}</p>}
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100">
                      {draft.ai_draft.map((entry, index) => (
                        <div key={index} className="px-5 py-4">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <select
                              value={entry.type}
                              onChange={(e) => updateEntry(draft.id, index, "type", e.target.value)}
                              className={"text-[11px] font-medium px-2 py-1 rounded-md border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-200 " + (TYPE_COLORS[entry.type] ?? "bg-zinc-100 text-zinc-600")}
                            >
                              <option value="feature">New feature</option>
                              <option value="fix">Bug fix</option>
                              <option value="improvement">Improvement</option>
                            </select>
                            <button onClick={() => removeEntry(draft.id, index)} className="text-xs text-zinc-300 hover:text-rose-400 transition-colors">Remove</button>
                          </div>
                          <input
                            type="text"
                            value={entry.title}
                            onChange={(e) => updateEntry(draft.id, index, "title", e.target.value)}
                            placeholder="Entry title"
                            className="w-full text-sm font-medium text-zinc-900 bg-transparent border-0 border-b border-zinc-100 focus:border-zinc-300 focus:outline-none pb-1.5 mb-2 transition-colors"
                          />
                          <textarea
                            value={entry.description}
                            onChange={(e) => updateEntry(draft.id, index, "description", e.target.value)}
                            placeholder="Entry description"
                            rows={2}
                            className="w-full text-sm text-zinc-500 bg-transparent border-0 focus:outline-none resize-none leading-relaxed"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-5 py-3.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                    <button onClick={() => discardDraft(draft.id)} disabled={discarding === draft.id} className="text-xs text-zinc-400 hover:text-zinc-600 disabled:opacity-40 transition-colors">
                      {discarding === draft.id ? "Discarding..." : "Discard"}
                    </button>
                    <PublishButton draftId={draft.id} publishing={publishing} entryCount={draft.ai_draft.length} onPublish={() => publishDraft(draft, originalDraft)} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageShell>
  )
}

function PublishButton({ draftId, publishing, entryCount, onPublish }: { draftId: string; publishing: string | null; entryCount: number; onPublish: () => void }) {
  const [reviewed, setReviewed] = useState(false)
  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 cursor-pointer" />
        <span className="text-xs text-zinc-500">I've reviewed this</span>
      </label>
      <button
        onClick={onPublish}
        disabled={!reviewed || publishing === draftId || entryCount === 0}
        className="text-xs font-medium px-4 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
      >
        {publishing === draftId ? (<><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Publishing...</>) : `Publish ${entryCount === 1 ? "1 entry" : `${entryCount} entries`}`}
      </button>
    </div>
  )
}