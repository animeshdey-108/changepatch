import { getProfile } from "@/lib/auth/actions"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/auth/actions"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Logo, NavBar, PageShell, EmptyState, Badge } from "@/app/components/ui"

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

  const planLabel: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    growth: "Growth",
    agency: "Agency",
  }

  return (
    <PageShell>
      <NavBar>
        <Logo />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{profile.email}</span>
            <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
              {planLabel[profile.plan] ?? profile.plan}
            </span>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </NavBar>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Repositories</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {repos?.length ?? 0} connected
            </p>
          </div>
          <Link
            href="/dashboard/connect"
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-all duration-150 active:scale-[0.98]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Connect repo
          </Link>
        </div>

        {!repos || repos.length === 0 ? (
          <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
            <EmptyState
              title="No repositories connected"
              description="Connect a GitHub repository to start auto-generating changelogs from your commits."
              action={
                <Link
                  href="/dashboard/connect"
                  className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-all"
                >
                  Connect your first repo
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            {repos.map((repo) => {
              const slug = pageByRepoId[repo.id]
              const drafts = draftsByRepoId[repo.id] ?? 0
              return (
                <div
                  key={repo.id}
                  className="group bg-white border border-zinc-200/80 rounded-xl shadow-sm px-5 py-4 flex items-center justify-between hover:border-zinc-300 transition-all duration-150"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1.333C4.318 1.333 1.333 4.318 1.333 8c0 2.946 1.91 5.44 4.559 6.326.333.061.455-.144.455-.32 0-.158-.006-.576-.009-1.132-1.855.403-2.246-.894-2.246-.894-.303-.77-.74-.976-.74-.976-.605-.413.046-.405.046-.405.669.047 1.021.687 1.021.687.594 1.018 1.559.724 1.939.554.06-.431.233-.724.423-.89-1.48-.168-3.036-.74-3.036-3.294 0-.727.26-1.322.685-1.788-.069-.168-.297-1.002.065-2.09 0 0 .559-.178 1.833.683.531-.148 1.101-.222 1.667-.225.566.003 1.136.077 1.668.225 1.273-.861 1.83-.683 1.83-.683.364 1.088.135 1.922.067 2.09.426.466.684 1.061.684 1.788 0 2.56-1.558 3.124-3.042 3.289.239.206.452.612.452 1.234 0 .891-.008 1.61-.008 1.829 0 .178.12.385.457.32C12.758 13.438 14.667 10.944 14.667 8c0-3.682-2.985-6.667-6.667-6.667z" fill="#3F3F46"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{repo.github_full_name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{repo.default_branch} branch</p>
                    </div>
                    {drafts > 0 && (
                      <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-600">
                        {drafts} draft{drafts > 1 ? "s" : ""} to review
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {slug && (
                      <Link
                        href={`/changelog/${slug}`}
                        className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-50"
                        target="_blank"
                      >
                        View changelog
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/repos/${repo.id}`}
                      className="text-xs font-medium text-zinc-600 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
                    >
                      {drafts > 0 ? "Review drafts" : "Manage"}
                    </Link>
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
