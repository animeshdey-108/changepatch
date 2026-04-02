import { signInWithGitHub } from '@/lib/auth/actions'
import { getUser } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getUser()
  if (user) redirect('/dashboard')

  const params = await searchParams
  const error = params.error

  const errorMessages: Record<string, string> = {
    oauth_failed: 'Could not connect to GitHub. Please try again.',
    exchange_failed: 'Authentication failed. Please try again.',
    no_code: 'Authentication was cancelled.',
    default: 'Something went wrong. Please try again.',
  }

  const errorMessage = error
    ? (errorMessages[error] ?? errorMessages.default)
    : null

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16M4 10h10M4 14h12M4 18h8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            ChangePatch
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Auto-generate your changelog from GitHub commits
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Sign in card */}
        <div className="border border-gray-200 rounded-2xl p-6">
          <p className="text-sm text-gray-600 mb-5 text-center">
            Sign in to get started — free, no credit card required.
          </p>

          <form action={signInWithGitHub}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-700 active:bg-gray-800 text-white text-sm font-medium transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-400 text-center">
            By signing in, you agree to our{' '}
            <a href="/terms" className="underline hover:text-gray-600">
              Terms
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-gray-600">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        {/* Trust signals */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L7.5 4.5H11L8.5 6.5L9.5 10L6 8L2.5 10L3.5 6.5L1 4.5H4.5L6 1Z" fill="#9CA3AF"/>
            </svg>
            Read-only access
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="5" width="8" height="6" rx="1" stroke="#9CA3AF" strokeWidth="1.2"/>
              <path d="M4 5V3.5a2 2 0 1 1 4 0V5" stroke="#9CA3AF" strokeWidth="1.2"/>
            </svg>
            No code access
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="#9CA3AF" strokeWidth="1.2"/>
              <path d="M4 6l1.5 1.5L8 4" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Revoke anytime
          </span>
        </div>

      </div>
    </main>
  )
}