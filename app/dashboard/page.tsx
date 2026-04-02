import { getProfile } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'

export default async function DashboardPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-gray-900">
            ChangePatch
          </h1>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Signed in as</p>
          <p className="font-medium text-gray-900">{profile.email}</p>
          <p className="text-sm text-gray-500 mt-1">
            Plan: <span className="capitalize">{profile.plan}</span>
          </p>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-900 mb-2">
            Next step
          </p>
          <p className="text-sm text-gray-500">
            Connect your first GitHub repository to get started.
          </p>
        </div>
      </div>
    </main>
  )
}