import { signInWithGitHub } from "@/lib/auth/actions"
import { getUser } from "@/lib/auth/actions"
import { redirect } from "next/navigation"
import { Logo } from "@/app/components/ui"

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getUser()
  if (user) redirect("/dashboard")

  const params = await searchParams
  const error = params.error

  const errorMessages: Record<string, string> = {
    oauth_failed: "Could not connect to GitHub. Please try again.",
    exchange_failed: "Authentication failed. Please try again.",
    no_code: "Authentication was cancelled.",
    default: "Something went wrong. Please try again.",
  }

  const errorMessage = error ? (errorMessages[error] ?? errorMessages.default) : null

  return (
    <main className="min-h-screen bg-surface flex">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* left panel */}
      <div className="relative z-10 flex-1 flex flex-col px-12 py-8">
        <Logo />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[340px] animate-fade-up">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">Welcome back</h1>
            <p className="text-sm text-text-dim mb-8 leading-relaxed">
              Sign in to start generating changelogs automatically.
            </p>

            {errorMessage && (
              <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400">{errorMessage}</p>
              </div>
            )}

            <form action={signInWithGitHub}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-surface text-sm font-semibold transition-all duration-150 hover:bg-white/90 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#09090b">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                Continue with GitHub
              </button>
            </form>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {["Read-only access", "No code access", "Revoke anytime"].map((item) => (
                <div key={item} className="px-2 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                  <p className="text-[10px] font-mono text-text-ghost leading-tight">{item}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-[11px] text-text-ghost">
              {"By signing in you agree to our "}
              <a href="/terms" className="text-text-dim hover:text-text-primary underline underline-offset-2 transition-colors">terms</a>
              {" and "}
              <a href="/privacy" className="text-text-dim hover:text-text-primary underline underline-offset-2 transition-colors">privacy policy</a>
            </p>
          </div>
        </div>
      </div>

      {/* right panel */}
      <div className="relative z-10 hidden lg:flex flex-1 flex-col justify-center px-12 border-l border-white/[0.06] bg-surface-1">
        <p className="text-[10px] font-mono text-text-ghost uppercase tracking-widest mb-6">generated from your commits</p>
        <div className="space-y-3">
          {[
            { type: "feat", title: "CSV export for reports", desc: "Download any report as a CSV file directly from the reports page.", delay: "" },
            { type: "fix", title: "Fixed profile page crash", desc: "Resolved an issue when loading certain user profiles.", delay: "opacity-70" },
            { type: "improve", title: "3x faster dashboard", desc: "Improved data fetching and caching throughout.", delay: "opacity-40" },
          ].map((entry) => (
            <div key={entry.title} className={`cp-card p-4 ${entry.delay}`}>
              <div className={`cp-badge mb-2.5 ${
                entry.type === "feat" ? "cp-badge-feat" :
                entry.type === "fix" ? "cp-badge-fix" : "cp-badge-improve"
              }`}>{entry.type}</div>
              <p className="text-[13px] font-medium text-text-primary mb-1">{entry.title}</p>
              <p className="text-[11px] text-text-dim leading-relaxed">{entry.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[10px] font-mono text-text-ghost">
          written by AI · reviewed by you · published automatically
        </p>
      </div>
    </main>
  )
}
