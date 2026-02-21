'use client'

import { useState } from 'react'
import { Key, Copy, Loader2, Check } from 'lucide-react'

interface TokenData {
  token: string
  expiresAt: string
  expiresIn: string
  user: {
    id: string
    email: string
    role: string
  }
}

export function TokenButton() {
  const [loading, setLoading] = useState(false)
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchToken = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/token')
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to get token')
      }
      const data = await response.json()
      setTokenData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get token')
    } finally {
      setLoading(false)
    }
  }

  const copyToken = () => {
    if (tokenData?.token) {
      navigator.clipboard.writeText(tokenData.token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={fetchToken}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
        Get Bearer Token
      </button>

      {tokenData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTokenData(null)} />
          <div className="relative bg-card border border-border rounded-lg w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Key className="w-5 h-5" />
                Bearer Token
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Token</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono break-all">{tokenData.token}</code>
                  <button
                    onClick={copyToken}
                    className="p-1 hover:bg-muted rounded"
                    title="Copy token"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Expires</p>
                  <p>{new Date(tokenData.expiresAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p>{tokenData.user.email}</p>
                </div>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Usage</p>
                <code className="text-sm">
                  Authorization: Bearer {tokenData.token}
                </code>
              </div>

              <button
                onClick={() => setTokenData(null)}
                className="w-full px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setError(null)} />
          <div className="relative bg-card border border-red-500/20 rounded-lg w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-red-500 mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => setError(null)}
              className="w-full px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
