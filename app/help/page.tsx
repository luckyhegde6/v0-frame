'use client'

import { useState } from 'react'
import { Mail, MessageSquare, User, Users, Crown, Send, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type FormType = 'query' | 'access'

interface QueryFormData {
  name: string
  email: string
  subject: string
  message: string
}

interface AccessFormData {
  name: string
  email: string
  company: string
  accessType: string
  message: string
}

export default function HelpPage() {
  const [activeForm, setActiveForm] = useState<FormType>('query')
  const [queryData, setQueryData] = useState<QueryFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [accessData, setAccessData] = useState<AccessFormData>({
    name: '',
    email: '',
    company: '',
    accessType: 'USER',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/public/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit query')
      }

      setSuccess('Your query has been submitted. We will get back to you soon.')
      setQueryData({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit query')
    } finally {
      setLoading(false)
    }
  }

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/public/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accessData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit access request')
      }

      const accessLabels: Record<string, string> = {
        USER: 'User',
        CLIENT: 'Client',
        PRO: 'PRO'
      }
      setSuccess(`Your ${accessLabels[accessData.accessType]} access request has been submitted. We will review it and get back to you soon.`)
      setAccessData({ name: '', email: '', company: '', accessType: 'USER', message: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit access request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tighter mb-2">
            <span className="text-primary">Help</span> & Support
          </h1>
          <p className="text-muted-foreground">
            Have questions or need access? We're here to help.
          </p>
        </div>

        {/* Form Type Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveForm('query')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeForm === 'query' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Ask a Question
            </button>
            <button
              onClick={() => setActiveForm('access')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeForm === 'access' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="w-4 h-4" />
              Request Access
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {activeForm === 'query' ? (
          <form onSubmit={handleQuerySubmit} className="max-w-xl mx-auto space-y-6">
            <div>
              <label htmlFor="query-name" className="block text-sm font-medium mb-2">
                Your Name
              </label>
              <input
                id="query-name"
                type="text"
                required
                value={queryData.name}
                onChange={(e) => setQueryData({ ...queryData, name: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="query-email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="query-email"
                type="email"
                required
                value={queryData.email}
                onChange={(e) => setQueryData({ ...queryData, email: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="query-subject" className="block text-sm font-medium mb-2">
                Subject
              </label>
              <input
                id="query-subject"
                type="text"
                required
                value={queryData.subject}
                onChange={(e) => setQueryData({ ...queryData, subject: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="How do I..."
              />
            </div>

            <div>
              <label htmlFor="query-message" className="block text-sm font-medium mb-2">
                Your Message
              </label>
              <textarea
                id="query-message"
                required
                rows={5}
                value={queryData.message}
                onChange={(e) => setQueryData({ ...queryData, message: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Describe your question in detail..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Query
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAccessSubmit} className="max-w-xl mx-auto space-y-6">
            <div>
              <label htmlFor="access-name" className="block text-sm font-medium mb-2">
                Your Name
              </label>
              <input
                id="access-name"
                type="text"
                required
                value={accessData.name}
                onChange={(e) => setAccessData({ ...accessData, name: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="access-email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="access-email"
                type="email"
                required
                value={accessData.email}
                onChange={(e) => setAccessData({ ...accessData, email: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="access-company" className="block text-sm font-medium mb-2">
                Company (Optional)
              </label>
              <input
                id="access-company"
                type="text"
                value={accessData.company}
                onChange={(e) => setAccessData({ ...accessData, company: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Request Access Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  accessData.accessType === 'USER' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}>
                  <input
                    type="radio"
                    name="accessType"
                    value="USER"
                    checked={accessData.accessType === 'USER'}
                    onChange={(e) => setAccessData({ ...accessData, accessType: e.target.value })}
                    className="sr-only"
                  />
                  <User className="w-6 h-6 mb-2 text-blue-500" />
                  <span className="text-sm font-medium">User</span>
                  <span className="text-xs text-muted-foreground mt-1">Basic access</span>
                </label>
                <label className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  accessData.accessType === 'CLIENT' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}>
                  <input
                    type="radio"
                    name="accessType"
                    value="CLIENT"
                    checked={accessData.accessType === 'CLIENT'}
                    onChange={(e) => setAccessData({ ...accessData, accessType: e.target.value })}
                    className="sr-only"
                  />
                  <Users className="w-6 h-6 mb-2 text-green-500" />
                  <span className="text-sm font-medium">Client</span>
                  <span className="text-xs text-muted-foreground mt-1">Project access</span>
                </label>
                <label className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  accessData.accessType === 'PRO' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}>
                  <input
                    type="radio"
                    name="accessType"
                    value="PRO"
                    checked={accessData.accessType === 'PRO'}
                    onChange={(e) => setAccessData({ ...accessData, accessType: e.target.value })}
                    className="sr-only"
                  />
                  <Crown className="w-6 h-6 mb-2 text-purple-500" />
                  <span className="text-sm font-medium">PRO</span>
                  <span className="text-xs text-muted-foreground mt-1">Full access</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="access-message" className="block text-sm font-medium mb-2">
                Additional Information (Optional)
              </label>
              <textarea
                id="access-message"
                rows={4}
                value={accessData.message}
                onChange={(e) => setAccessData({ ...accessData, message: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Tell us a bit about yourself and why you need access..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Request Access
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>You can also reach us at</p>
          <a href="mailto:support@frame.app" className="text-primary hover:underline">
            support@frame.app
          </a>
        </div>
      </main>
    </div>
  )
}
