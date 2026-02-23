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
  'admin2@frame.app': { password: 'admin123', role: 'ADMIN', name: 'Admin User' },
  'user1@frame.app': { password: 'user123', role: 'USER', name: 'Regular User' },
  'pro1@frame.app': { password: 'pro123', role: 'PRO', name: 'Pro User' },
  'client1@frame.app': { password: 'client123', role: 'CLIENT', name: 'Client User' },
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
  const userRole = req.auth?.user?.role as Role | undefined

  const isAuthRoute = nextUrl.pathname.startsWith('/auth')
  const isGalleryRoute = nextUrl.pathname.startsWith('/gallery')
  const isUploadRoute = nextUrl.pathname.startsWith('/upload')
  const isProjectsRoute = nextUrl.pathname.startsWith('/projects')
  const isAlbumsRoute = nextUrl.pathname.startsWith('/albums')
  const isFavoritesRoute = nextUrl.pathname.startsWith('/favorites')
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')

  const isClientOrAbove = userRole && ['CLIENT', 'PRO', 'ADMIN', 'SUPERADMIN'].includes(userRole)
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'
  const isPro = userRole === 'PRO'
  const isUserOnly = userRole === 'USER' || !userRole

  // Redirect authenticated users away from auth pages - based on role
  if (isAuthRoute && isLoggedIn) {
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin', nextUrl))
    }
    if (isClientOrAbove) {
      return NextResponse.redirect(new URL('/projects', nextUrl))
    }
    return NextResponse.redirect(new URL('/gallery', nextUrl))
  }

  // Protect /admin routes - only ADMIN and SUPERADMIN
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/signin', nextUrl))
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/projects', nextUrl))
    }
    return NextResponse.next()
  }

  // Protect /projects, /albums, /favorites - only CLIENT and above
  if (isProjectsRoute || isAlbumsRoute || isFavoritesRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/signin', nextUrl))
    }
    if (!isClientOrAbove) {
      return NextResponse.redirect(new URL('/gallery', nextUrl))
    }
    return NextResponse.next()
  }

  // Protect /gallery and /upload - only USER (not CLIENT/PRO/ADMIN)
  if (isGalleryRoute || isUploadRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/signin', nextUrl))
    }
    // If user is CLIENT, PRO, ADMIN or SUPERADMIN, redirect to projects
    if (isClientOrAbove) {
      return NextResponse.redirect(new URL('/projects', nextUrl))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
