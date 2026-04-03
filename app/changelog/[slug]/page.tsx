import { createServiceClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import SubscribeWidget from "./subscribe"

interface ChangelogPageProps {
  params: Promise<{ slug: string }>
}

const TYPE_BADGE: Record<string, string> = {
  feature: "bg-blue-500/10 text-blue-400",
  fix: "bg-red-500/10 text-red-400",
  improvement: "bg-green-500/10 text-green-400",
}

const TYPE_LABEL: Record<string, string> = {
  feature: "feat",
  fix: "fix",
  improvement: "improve",
}

export default async function PublicChangelogPage({ params }: ChangelogPageProps) {
  const { slug } = await params
  const supabase = await createServiceClient()

  const { data: page } = await supabase
    .from("changelog_pages")
    .select("id, title, description, is_public, branding, repo_id")
    .eq("slug", slug)
    .single()

  if (!page || !page.is_public) notFound()

  const { data: entries } = await supabase
    .from("published_entries")
    .select("id, title, description, entry_type, published_at, version_tag")
    .eq("repo_id", page.repo_id)
    .eq("is_published", true)
    .order("published_at", { ascending: false })

  const branding = page.branding as { powered_by?: boolean }

  return (
    <main className="min-h-screen bg-surface">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">

        <div className="mb-14 animate-fade-up">
          <p className="text-[10px] font-mono text-text-ghost uppercase tracking-widest mb-4">changelog</p>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight leading-tight mb-3">
            {page.title}
          </h1>
          {page.description && (
            <p className="text-sm text-text-dim leading-relaxed mb-3">{page.description}</p>
          )}
          <p className="text-[11px] font-mono text-text-ghost">
            {entries?.length ?? 0} updates
          </p>
        </div>

        {!entries || entries.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[11px] font-mono text-text-ghost">no updates published yet</p>
          </div>
        ) : (
          <div className="space-y-0 animate-fade-up">
            {entries.map((entry, i) => (
              <div key={entry.id} className="group flex gap-5 pb-10">
                <div className="flex flex-col items-center pt-1">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${i === 0 ? "bg-white" : "bg-white/20"}`} />
                  {i < (entries?.length ?? 0) - 1 && (
                    <div className="w-px flex-1 bg-white/[0.06] mt-2" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0">
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono tracking-wide ${TYPE_BADGE[entry.entry_type] ?? "bg-white/5 text-text-muted"}`}>
                      {TYPE_LABEL[entry.entry_type] ?? entry.entry_type}
                    </span>
                    {entry.version_tag && (
                      <span className="text-[10px] font-mono text-text-ghost">{entry.version_tag}</span>
                    )}
                    <time className="text-[10px] font-mono text-text-ghost ml-auto">
                      {new Date(entry.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </time>
                  </div>
                  <h2 className="text-base font-semibold text-text-primary mb-1.5 leading-snug tracking-tight">
                    {entry.title}
                  </h2>
                  <p className="text-sm text-text-dim leading-relaxed">{entry.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-10 border-t border-white/[0.06] animate-fade-up">
          <h3 className="text-sm font-semibold text-text-primary mb-1">stay in the loop</h3>
          <p className="text-[11px] font-mono text-text-ghost mb-5">get an email when new updates ship</p>
          <SubscribeWidget pageId={page.id} />
        </div>

        {branding?.powered_by !== false && (
          <div className="mt-12 pt-8 border-t border-white/[0.04] text-center">
            <a href="https://changepatch.com" target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-text-ghost hover:text-text-dim transition-colors">
              built with changepatch
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
