'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Entry {
  type: 'feature' | 'fix' | 'improvement'
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
      data.drafts.forEach((d: GeneratedEntry) => {
        reviewStartTimes.current[d.id] = Date.now()
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load drafts.')
    } finally {
      setLoading(false)
    }
  }

  function updateEntry(draftId: string, entryIndex: number, field: keyof Entry, value: string) {
    setDrafts((prev) =>
      prev.map((draft) => {
        if (draft.id !== draftId) return draft
        const newEntries = [...draft.ai_draft]
        newEntries[entryIndex] = { ...newEntries[entryIndex], [field]: value }
        return { ...draft, ai_draft: newEntries }
      })
    )
  }

  function removeEntry(draftId: string, entryIndex: number) {
    setDrafts((prev) =>
      prev.map((draft) => {
        if (draft.id !== draftId) return draft
        const newEntries = draft.ai_draft.filter((_, i) => i !== entryIndex)
        return { ...draft, ai_draft: newEntries }
      })
    )
  }

  async function publishDraft(draft: GeneratedEntry, originalDraft: Entry[]) {
    if (draft.ai_draft.length === 0) {
      setError('Cannot publish with no entries. Discard this draft instead.')
      return
    }
    const reviewDurationMs = reviewStartTimes.current[draft.id]
      ? Date.now() - reviewStartTimes.current[draft.id]
      : undefined
    setPublishing(draft.id)
    setError(null)
    try {
      const res = await fetch('/api/entries/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generated_entry_id: draft.id,
          entries: draft.ai_draft,
          original_draft: originalDraft,
          review_duration_ms: reviewDurationMs,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccessMessage(`Published ${data.published_count} ${data.published_count === 1 ? 'entry' : 'entries'} successfully.`)
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id))
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to publish.')
    } finally {
      setPublishing(null)
    }
  }

  async function discardDraft(draftId: string) {
    setDiscarding(draftId)
    setError(null)
    try {
      const res = await fetch('/api/entries/discard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generated_entry_id: draftId }),
      })
      if (!res.ok) throw new Error('Failed to discard')
      setDrafts((prev) => prev.filter((d) => d.id !== draftId))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to discard.')
    } finally {
      setDiscarding(null)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Dashboard
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-900 font-medium">Review drafts</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Review changelog drafts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review each AI-generated draft before publishing. Edit freely.
          </p>
        </div>

        <div className="mb-4 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50">
          <p className="text-xs text-amber-800">
            <strong>Always review before publishing.</strong> AI-generated content may contain errors.
            You are responsible for all published content.
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-100">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-500">Loading drafts...</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <h2 className="text-base font-medium text-gray-900 mb-1">No drafts to review</h2>
            <p className="text-sm text-gray-500">
              Push code to your connected repository to generate a changelog draft.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {drafts.map((draft) => {
              const originalDraft = JSON.parse(JSON.stringify(draft.ai_draft)) as Entry[]
              return (
                <div key={draft.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        AI Draft
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {new Date(draft.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                      Generated by AI — not yet reviewed
                    </span>
                  </div>

                  {draft.reasoning && (
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">Why these entries: </span>
                        {draft.reasoning}
                      </p>
                    </div>
                  )}

                  {draft.ai_draft.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <p className="text-sm text-gray-500 mb-1">
                        The AI found no user-facing changes in these commits.
                      </p>
                      {draft.reasoning && (
                        <p className="text-xs text-gray-400">
                          {draft.reasoning}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {draft.ai_draft.map((entry, index) => (
                        <div key={index} className="px-6 py-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <select
                              value={entry.type}
                              onChange={(e) => updateEntry(draft.id, index, 'type', e.target.value)}
                              className="text-xs font-medium px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-700 focus:outline-none cursor-pointer"
                            >
                              <option value="feature">New feature</option>
                              <option value="fix">Bug fix</option>
                              <option value="improvement">Improvement</option>
                            </select>
                            <button
                              onClick={() => removeEntry(draft.id, index)}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                          <input
                            type="text"
                            value={entry.title}
                            onChange={(e) => updateEntry(draft.id, index, 'title', e.target.value)}
                            placeholder="Entry title"
                            className="w-full text-sm font-medium text-gray-900 border-0 border-b border-gray-100 focus:border-gray-300 focus:outline-none pb-1 mb-2 bg-transparent"
                          />
                          <textarea
                            value={entry.description}
                            onChange={(e) => updateEntry(draft.id, index, 'description', e.target.value)}
                            placeholder="Entry description"
                            rows={2}
                            className="w-full text-sm text-gray-600 border-0 focus:outline-none resize-none bg-transparent leading-relaxed"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                    <button
                      onClick={() => discardDraft(draft.id)}
                      disabled={discarding === draft.id}
                      className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                    >
                      {discarding === draft.id ? 'Discarding...' : 'Discard'}
                    </button>
                    <PublishButton
                      draftId={draft.id}
                      publishing={publishing}
                      entryCount={draft.ai_draft.length}
                      onPublish={() => publishDraft(draft, originalDraft)}
                    />
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

function PublishButton({
  draftId,
  publishing,
  entryCount,
  onPublish,
}: {
  draftId: string
  publishing: string | null
  entryCount: number
  onPublish: () => void
}) {
  const [reviewed, setReviewed] = useState(false)

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={reviewed}
          onChange={(e) => setReviewed(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
        />
        <span className="text-xs text-gray-600">
          {"I've reviewed this"}
        </span>
      </label>
      <button
        onClick={onPublish}
        disabled={!reviewed || publishing === draftId || entryCount === 0}
        className="text-sm px-5 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {publishing === draftId ? (
          <>
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            Publishing...
          </>
        ) : (
          `Publish ${entryCount === 1 ? '1 entry' : `${entryCount} entries`}`
        )}
      </button>
    </div>
  )
}
