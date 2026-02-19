import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { logUserLogin } from '@/lib/audit'

type Role = 'USER' | 'PRO' | 'CLIENT' | 'ADMIN' | 'SUPERADMIN'

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

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@frame.app'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

const DEMO_CREDENTIALS: Record<string, { password: string; role: Role; name: string }> = {
  'admin@frame.app': { password: 'admin123', role: 'ADMIN', name: 'Admin User' },
  'user@frame.app': { password: 'user123', role: 'USER', name: 'Regular User' },
  'pro@frame.app': { password: 'pro123', role: 'PRO', name: 'Pro User' },
  'client@frame.app': { password: 'client123', role: 'CLIENT', name: 'Client User' },
}

if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  DEMO_CREDENTIALS[ADMIN_EMAIL] = {
    password: ADMIN_PASSWORD,
    role: 'SUPERADMIN',
    name: 'Super Admin',
  }
}

// This is used by API routes (Node.js runtime with database access)
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
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

        try {
          // Find or create the user in the database
          let user = await prisma.user.findUnique({
            where: { email }
          })

          if (!user) {
            // Create demo user in database
            const hashedPassword = await bcrypt.hash(password, 10)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user = await prisma.user.create({
              data: {
                email,
                name: demoAccount.name,
                password: hashedPassword,
                role: demoAccount.role as any,
              }
            })
            console.log(`[Auth] Created demo user: ${email}`)
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            role: (user as any).role,
          }
        } catch (error) {
          console.error('[Auth] Database error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
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
    async signIn({ user }) {
      if (user?.id && user?.email) {
        try {
          await logUserLogin(user.id)
        } catch (error) {
          console.error('[Auth] Audit logging failed:', error)
        }
      }
      return true
    },
  },
})
