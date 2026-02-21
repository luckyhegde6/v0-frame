'use client'

import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import { ArrowLeft, BookOpen, Loader2, Key, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { showSuccess } from '@/lib/error-handler'

export default function ApiDocsClient() {
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchSpec()
    fetchToken()
  }, [])

  const fetchSpec = async () => {
    try {
      const response = await fetch('/api/docs')
      if (!response.ok) {
        throw new Error('Failed to fetch API spec')
      }
      const data = await response.json()
      setSpec(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchToken = async () => {
    try {
      const response = await fetch('/api/admin/token')
      if (response.ok) {
        const data = await response.json()
        setToken(data.token)
      }
    } catch {
      // Token not available
    }
  }

  const copyToken = async () => {
    if (token) {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      showSuccess('Token copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Link href="/admin" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
          Back to Admin
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Admin
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-semibold">API Documentation</h1>
              </div>
            </div>
            
            {token && (
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-muted-foreground" />
                <code className="px-2 py-1 bg-muted rounded text-xs font-mono max-w-xs truncate">
                  {token.slice(0, 20)}...
                </code>
                <button
                  onClick={copyToken}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  title="Copy API token"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="swagger-wrapper">
        {spec && <SwaggerUI spec={spec} />}
      </div>

      <style jsx global>{`
        .swagger-wrapper {
          background: var(--background);
        }
        .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui .info .title {
          color: var(--foreground);
        }
        .swagger-ui .info p, .swagger-ui .info li {
          color: var(--muted-foreground);
        }
        .swagger-ui .scheme-container {
          background: var(--card);
          border: 1px solid var(--border);
        }
        .swagger-ui .opblock-tag {
          color: var(--foreground);
          border-bottom: 1px solid var(--border);
        }
        .swagger-ui .opblock .opblock-summary-description {
          color: var(--foreground);
        }
        .swagger-ui .opblock-body {
          background: var(--card);
        }
        .swagger-ui .tab li {
          color: var(--muted-foreground);
        }
        .swagger-ui .tab li.active {
          background: var(--primary);
          color: var(--primary-foreground);
        }
        .swagger-ui table thead tr th, .swagger-ui table thead tr td {
          background: var(--muted);
          color: var(--foreground);
        }
        .swagger-ui .parameter__name {
          color: var(--foreground);
        }
        .swagger-ui .parameter__type {
          color: var(--muted-foreground);
        }
        .swagger-ui .response-col_description {
          color: var(--foreground);
        }
        .swagger-ui .model-box {
          background: var(--card);
          border: 1px solid var(--border);
        }
        .swagger-ui .model-title {
          color: var(--foreground);
        }
        .swagger-ui .prop-type {
          color: var(--primary);
        }
        .swagger-ui .model-toggle {
          color: var(--muted-foreground);
        }
      `}</style>
    </div>
  )
}
