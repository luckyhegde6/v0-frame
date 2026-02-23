'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, KeyRound, X } from 'lucide-react'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/gallery'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetError, setResetError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else if (result?.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetError('')
    setResetSuccess('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit reset request')
      }

      setResetSuccess('Password reset request submitted. An admin will review and process your request.')
      setResetEmail('')
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to submit reset request')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tighter">
            <span className="text-primary">FRAME</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <KeyRound className="w-3 h-3" />
            Forgot Password?
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Demo Accounts:</p>
          <p className="mt-1">admin2@frame.app / admin123</p>
          <p>user@frame.app / user123</p>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setShowResetModal(false)
            setResetSuccess('')
            setResetError('')
          }} />
          <div className="relative bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-xl">
            <button
              onClick={() => {
                setShowResetModal(false)
                setResetSuccess('')
                setResetError('')
              }}
              className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <KeyRound className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Reset Password</h2>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Enter your email address and we'll submit a password reset request to an administrator.
            </p>

            {resetSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-500 text-sm">
                {resetSuccess}
              </div>
            )}

            {resetError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="text-4xl font-bold tracking-tighter">
            <span className="text-primary">FRAME</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
