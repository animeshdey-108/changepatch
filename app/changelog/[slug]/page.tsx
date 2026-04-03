import { createServiceClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import SubscribeWidget from "./subscribe"

interface ChangelogPageProps {
  params: Promise<{ slug: string }>
}

const TYPE_LABELS: Record<string, string> = {
  feature: "New feature",
  fix: "Bug fix",
  improvement: "Improvement",
}

const TYPE_STYLES: Record<string, string> = {
  feature: "bg-blue-50 text-blue-600",
  fix: "bg-rose-50 text-rose-600",
  improvement: "bg-emerald-50 text-emerald-600",
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
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-14">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-3">Changelog</p>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight leading-tight">{page.title}</h1>
          {page.description && <p className="mt-2 text-zinc-500 text-sm leading-relaxed">{page.description}</p>}
          <p className="mt-3 text-xs text-zinc-400">{entries?.length ?? 0} updates</p>
        </div>

        {!entries || entries.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-zinc-400">No updates published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {entries.map((entry, i) => (
              <div key={entry.id} className="group relative flex gap-6 pb-10">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-zinc-300 group-first:bg-zinc-900 mt-1.5 flex-shrink-0 transition-colors" />
                  {i < (entries?.length ?? 0) - 1 && <div className="w-px flex-1 bg-zinc-100 mt-2" />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={"text-[11px] font-medium px-2 py-0.5 rounded-md " + (TYPE_STYLES[entry.entry_type] ?? "bg-zinc-100 text-zinc-500")}>
                      {TYPE_LABELS[entry.entry_type] ?? entry.entry_type}
                    </span>
                    {entry.version_tag && <span className="text-xs text-zinc-400 font-mono">{entry.version_tag}</span>}
                    <time className="text-xs text-zinc-400 ml-auto">
                      {new Date(entry.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </time>
                  </div>
                  <h2 className="text-base font-semibold text-zinc-900 mb-1.5 leading-snug">{entry.title}</h2>
                  <p className="text-sm text-zinc-500 leading-relaxed">{entry.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-10 border-t border-zinc-100">
          <h3 className="text-sm font-semibold text-zinc-900 mb-1">Stay in the loop</h3>
          <p className="text-sm text-zinc-400 mb-4">Get an email when new updates are published.</p>
          <SubscribeWidget pageId={page.id} />
        </div>

        {branding?.powered_by !== false && (
          <div className="mt-10 pt-6 border-t border-zinc-100 text-center">
            <a href="https://changepatch.com" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">Powered by ChangePatch</a>
          </div>
        )}

      </div>
    </main>
  )
}