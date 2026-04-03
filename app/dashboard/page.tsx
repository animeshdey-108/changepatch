import { getProfile } from "@/lib/auth/actions"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/auth/actions"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Nav, EmptyState } from "@/app/components/ui"

export default async function DashboardPage() {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile) redirect("/login")

  const { data: repos } = await supabase
    .from("repos")
    .select("id, github_full_name, default_branch, is_active, created_at")
    .eq("user_id", profile.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const repoIds = repos?.map((r) => r.id) ?? []

  const { data: pages } = await supabase
    .from("changelog_pages")
    .select("repo_id, slug")
    .in("repo_id", repoIds.length > 0 ? repoIds : ["none"])

  const { data: draftCounts } = await supabase
    .from("generated_entries")
    .select("repo_id")
    .in("repo_id", repoIds.length > 0 ? repoIds : ["none"])
    .eq("status", "draft")

  const pageByRepoId = Object.fromEntries(pages?.map((p) => [p.repo_id, p.slug]) ?? [])
  const draftsByRepoId = (draftCounts ?? []).reduce<Record<string, number>>((acc, d) => {
    acc[d.repo_id] = (acc[d.repo_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-surface">
      <Nav
        right={
          <>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-text-ghost">{profile.email}</span>
              <span className="cp-badge bg-white/[0.06] text-text-dim capitalize">{profile.plan}</span>
            </div>
            <form action={signOut}>
              <button type="submit" className="text-[11px] font-mono text-text-ghost hover:text-text-primary transition-colors">
                sign out
              </button>
            </form>
          </>
        }
      />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="text-lg font-semibold text-text-primary tracking-tight">Repositories</h1>
            <p className="text-[12px] font-mono text-text-ghost mt-0.5">
              {repos?.length ?? 0} connected
            </p>
          </div>
          <Link href="/dashboard/connect" className="cp-btn-secondary text-xs gap-1.5">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Connect repo
          </Link>
        </div>

        {!repos || repos.length === 0 ? (
          <div className="cp-card animate-fade-up">
            <EmptyState
              title="No repositories connected"
              description="Connect a GitHub repository to start auto-generating changelogs from your commits."
              action={
                <Link href="/dashboard/connect" className="cp-btn-secondary text-xs">
                  Connect your first repo
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-2 animate-fade-up">
            {repos.map((repo) => {
              const slug = pageByRepoId[repo.id]
              const drafts = draftsByRepoId[repo.id] ?? 0
              return (
                <div
                  key={repo.id}
                  className="cp-card-hover px-5 py-4 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="#52525b">
                        <path d="M8 1.333C4.318 1.333 1.333 4.318 1.333 8c0 2.946 1.91 5.44 4.559 6.326.333.061.455-.144.455-.32 0-.158-.006-.576-.009-1.132-1.855.403-2.246-.894-2.246-.894-.303-.77-.74-.976-.74-.976-.605-.413.046-.405.046-.405.669.047 1.021.687 1.021.687.594 1.018 1.559.724 1.939.554.06-.431.233-.724.423-.89-1.48-.168-3.036-.74-3.036-3.294 0-.727.26-1.322.685-1.788-.069-.168-.297-1.002.065-2.09 0 0 .559-.178 1.833.683A6.376 6.376 0 0 1 8 5.811c.566.003 1.136.077 1.668.225 1.273-.861 1.83-.683 1.83-.683.364 1.088.135 1.922.067 2.09.426.466.684 1.061.684 1.788 0 2.56-1.558 3.124-3.042 3.289.239.206.452.612.452 1.234 0 .891-.008 1.61-.008 1.829 0 .178.12.385.457.32C12.758 13.438 14.667 10.944 14.667 8c0-3.682-2.985-6.667-6.667-6.667z"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{repo.github_full_name}</p>
                      <p className="text-[11px] font-mono text-text-ghost mt-0.5">{repo.default_branch}</p>
                    </div>
                    {drafts > 0 && (
                      <span className="cp-badge-draft ml-2">
                        {drafts} {drafts === 1 ? "draft" : "drafts"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {slug && (
                      <Link
                        href={`/changelog/${slug}`}
                        target="_blank"
                        className="cp-btn-ghost text-[11px]"
                      >
                        view changelog
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/repos/${repo.id}`}
                      className="cp-btn-secondary text-[11px] px-3 py-1.5"
                    >
                      {drafts > 0 ? "review drafts" : "manage"}
                    </Link>
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
