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
    <main className="min-h-screen bg-white flex">
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-6">
          <Logo />
        </header>

        <div className="flex-1 flex items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight mb-2">
                Welcome back
              </h1>
              <p className="text-sm text-zinc-500">
                Sign in to start generating changelogs automatically.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 px-4 py-3 rounded-lg bg-rose-50 border border-rose-100">
                <p className="text-sm text-rose-600">{errorMessage}</p>
              </div>
            )}

            <form action={signInWithGitHub} className="space-y-3">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium transition-all duration-150 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>
            </form>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Read-only access" },
                { label: "No code access" },
                { label: "Revoke anytime" },
              ].map((item) => (
                <div key={item.label} className="px-2 py-2 rounded-lg bg-zinc-50 border border-zinc-100">
                  <p className="text-[11px] text-zinc-500 font-medium leading-tight">{item.label}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-xs text-zinc-400">
              By signing in, you agree to our{" "}
              <a href="/terms" className="underline underline-offset-2 hover:text-zinc-600">Terms</a>
              {" "}and{" "}
              <a href="/privacy" className="underline underline-offset-2 hover:text-zinc-600">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-zinc-950 items-center justify-center p-16">
        <div className="max-w-sm">
          <div className="space-y-4">
            {[
              { type: "feature", title: "CSV export for reports", desc: "You can now download any report as a CSV file directly from the reports page.", time: "2 hours ago" },
              { type: "fix", title: "Fixed profile page crash", desc: "Resolved an issue that caused the app to crash when loading certain user profiles.", time: "Yesterday" },
              { type: "improvement", title: "Faster dashboard load", desc: "Dashboard now loads up to 3x faster thanks to improved data fetching.", time: "3 days ago" },
            ].map((entry, i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                style={{ opacity: 1 - i * 0.15, transform: `scale(${1 - i * 0.02})` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                    entry.type === "feature" ? "bg-blue-900/50 text-blue-400" :
                    entry.type === "fix" ? "bg-rose-900/50 text-rose-400" :
                    "bg-emerald-900/50 text-emerald-400"
                  }`}>
                    {entry.type === "feature" ? "New feature" : entry.type === "fix" ? "Bug fix" : "Improvement"}
                  </span>
                  <span className="text-[10px] text-zinc-600 ml-auto">{entry.time}</span>
                </div>
                <p className="text-sm font-medium text-zinc-100 mb-1">{entry.title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{entry.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-zinc-600 text-center">
            Auto-generated from your GitHub commits
          </p>
        </div>
      </div>
    </main>
  )
}
