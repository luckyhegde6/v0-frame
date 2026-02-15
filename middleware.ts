import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { Role } from '@prisma/client'
import { NextResponse } from 'next/server'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession['user']
  }

  interface User {
    role: Role
  }
}

import { DefaultSession } from 'next-auth'

// Demo user credentials (passwords are plain text for demo)
const DEMO_CREDENTIALS: Record<string, { password: string; role: Role; name: string }> = {
  'admin@frame.app': { password: 'admin123', role: 'ADMIN', name: 'Admin User' },
  'user@frame.app': { password: 'user123', role: 'USER', name: 'Regular User' },
  'pro@frame.app': { password: 'pro123', role: 'PRO', name: 'Pro User' },
  'client@frame.app': { password: 'client123', role: 'CLIENT', name: 'Client User' },
}

// Edge runtime compatible auth config (no Node.js modules)
const { auth } = NextAuth({
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        // Check if it's a demo account
        const demoAccount = DEMO_CREDENTIALS[email]
        if (!demoAccount || demoAccount.password !== password) {
          return null
        }

        // Generate consistent ID using Web Crypto API (edge runtime compatible)
        const encoder = new TextEncoder()
        const data = encoder.encode(email)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const userId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 20)

        return {
          id: userId,
          email,
          name: demoAccount.name,
          role: demoAccount.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
      }
      return session
    },
  },
})

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  const isAuthRoute = nextUrl.pathname.startsWith('/auth')
  const isProtectedRoute = 
    nextUrl.pathname.startsWith('/gallery') ||
    nextUrl.pathname.startsWith('/upload') ||
    nextUrl.pathname.startsWith('/admin')

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/gallery', nextUrl))
  }

  // Protect private routes
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', nextUrl))
  }

  // Admin route protection
  if (nextUrl.pathname.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/gallery', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
