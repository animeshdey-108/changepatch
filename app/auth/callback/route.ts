import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const next = searchParams.get('next') ?? '/dashboard'

  if (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${origin}/login?error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('Code exchange error:', exchangeError)
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}