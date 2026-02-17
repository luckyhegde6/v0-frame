'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Image, Upload, Shield, ArrowRight, LogOut, User, FolderOpen, Crown, Layers, Star } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const userRole = session?.user?.role

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'
  const isClientOrAbove = userRole && ['CLIENT', 'PRO', 'ADMIN', 'SUPERADMIN'].includes(userRole)
  const isPro = userRole === 'PRO'
  const isUserOnly = userRole === 'USER' || !userRole

  const getHomeLink = () => {
    if (isAdmin) return '/admin'
    if (isClientOrAbove) return '/projects'
    return '/gallery'
  }

  const getHomeLabel = () => {
    if (isAdmin) return 'Dashboard'
    if (isClientOrAbove) return 'Projects'
    return 'Gallery'
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="text-2xl font-bold tracking-tighter">
          <span className="text-primary">FRAME</span>
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                href={getHomeLink()}
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {isAdmin ? <Shield className="w-4 h-4" /> : isClientOrAbove ? <FolderOpen className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                {getHomeLabel()}
              </Link>
              {isUserOnly && (
                <Link
                  href="/upload"
                  className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Link>
              )}
              <div className="flex items-center gap-3 pl-4 border-l border-border">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="hidden sm:inline text-muted-foreground">
                    {session?.user?.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/gallery"
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Image className="w-4 h-4" />
                Gallery
              </Link>
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-24 max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Your visual story,
          <br />
          <span className="text-primary">perfectly framed</span>
        </h1>
        <p className="text-xl text-foreground/70 mb-12 max-w-2xl mx-auto">
          Upload, organize, and share your images with the world. 
          A modern gallery platform built for creators.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <Link
              href={getHomeLink()}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Go to {getHomeLabel()}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          {isUserOnly && (
            <Link
              href="/gallery"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border rounded-lg font-semibold hover:bg-muted transition-colors"
            >
              View Gallery
            </Link>
          )}
        </div>
      </section>

      {/* Profile Card Section - Only show when authenticated */}
      {isAuthenticated && session?.user && (
        <section className="px-6 py-12 border-t border-border bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Your Account</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  {session.user.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{session.user.name || 'User'}</h3>
                    {session.user.role === 'SUPERADMIN' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-xs font-medium rounded-full">
                        <Crown className="w-3 h-3" />
                        SUPERADMIN
                      </span>
                    )}
                    {session.user.role === 'ADMIN' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 text-xs font-medium rounded-full">
                        <Shield className="w-3 h-3" />
                        ADMIN
                      </span>
                    )}
                    {session.user.role === 'PRO' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-500 text-xs font-medium rounded-full">
                        PRO
                      </span>
                    )}
                    {session.user.role === 'CLIENT' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
                        CLIENT
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4">{session.user.email}</p>
                  
                  <div className="flex flex-wrap gap-3">
                    {/* USER: Gallery and Upload */}
                    {isUserOnly && (
                      <>
                        <Link
                          href="/gallery"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          <Image className="w-4 h-4" />
                          My Gallery
                        </Link>
                        <Link
                          href="/upload"
                          className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Photos
                        </Link>
                      </>
                    )}

                    {/* CLIENT and PRO: Projects, Albums, Favorites */}
                    {isClientOrAbove && !isAdmin && (
                      <>
                        <Link
                          href="/projects"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors"
                        >
                          <FolderOpen className="w-4 h-4" />
                          Projects
                        </Link>
                        <Link
                          href="/albums"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500/20 transition-colors"
                        >
                          <Layers className="w-4 h-4" />
                          Albums
                        </Link>
                        <Link
                          href="/favorites"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-500 rounded-lg hover:bg-yellow-500/20 transition-colors"
                        >
                          <Star className="w-4 h-4" />
                          Favorites
                        </Link>
                        {isPro && (
                          <Link
                            href="/upload"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            Upload
                          </Link>
                        )}
                      </>
                    )}

                    {/* ADMIN and SUPERADMIN: Admin Panel */}
                    {isAdmin && (
                      <>
                        <Link
                          href="/admin"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500/20 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                        <Link
                          href="/projects"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors"
                        >
                          <FolderOpen className="w-4 h-4" />
                          Projects
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="px-6 py-16 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to manage your photos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-card border border-border rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Upload</h3>
              <p className="text-muted-foreground">
                Drag and drop your images for instant upload with automatic processing
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Image className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Gallery</h3>
              <p className="text-muted-foreground">
                Organize your photos with collections, search, and advanced filtering
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Role-based access control ensures your photos stay secure
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-2xl font-bold tracking-tighter">
            <span className="text-primary">FRAME</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 FRAME. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
