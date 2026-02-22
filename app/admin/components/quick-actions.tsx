'use client'

import { TokenButton } from './token-button'
import Link from 'next/link'

interface QuickActionsProps {
  unreadNotifications?: number
}

export function QuickActions({ unreadNotifications = 0 }: QuickActionsProps) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="flex flex-wrap gap-4">
        <a
          href="/api/health"
          className="px-4 py-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors"
        >
          Health Check
        </a>
        <a
          href="/api/health/detailed"
          className="px-4 py-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors"
        >
          Detailed Health
        </a>
        <a
          href="/api/docs/swagger"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-colors"
        >
          Open Swagger
        </a>
        <Link
          href="/admin/jobs?status=FAILED"
          className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
        >
          View Failed Jobs
        </Link>
        <Link
          href="/admin/requests"
          className="px-4 py-2 bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500/20 transition-colors"
        >
          View Requests
        </Link>
        {unreadNotifications > 0 && (
          <Link
            href="/admin/notifications"
            className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-colors"
          >
            {unreadNotifications} Unread Notifications
          </Link>
        )}
        <TokenButton />
        <a
          href="/gallery"
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
        >
          Back to Gallery
        </a>
      </div>
    </div>
  )
}
