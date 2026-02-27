'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Image from 'next/image'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = getSupabase()

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) { setMessage(error.message) }
        else { setMessage('Check your email to confirm your account, then log in.') }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setMessage(error.message) }
        else { window.location.href = '/' }
      }
    } catch (err: any) {
      setMessage('Connection error: ' + (err.message || 'Please check your internet connection.'))
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-cream to-gray-100 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image src="/logo.svg" alt="TriStar PT" width={72} height={72} className="rounded-full" />
          </div>
          <h1 className="text-3xl font-bold text-black">TriStar PT</h1>
          <p className="text-gray-500 mt-1">P&L Analyzer</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent text-base"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent text-base"
              placeholder="••••••••" minLength={6}
            />
          </div>

          {message && (
            <div className={`text-sm p-3 rounded-lg ${message.includes('Check your email') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-brand-orange text-white font-medium rounded-lg hover:bg-brand-orange-hover disabled:opacity-50 transition text-base min-h-[48px]"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setIsSignUp(!isSignUp); setMessage('') }} className="text-sm text-brand-orange hover:underline">
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}
