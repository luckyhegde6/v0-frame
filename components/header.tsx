'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ChevronRight, Home, Shield, Image, Upload, ArrowLeft, FolderOpen, Play, BookOpen, Settings, Loader2, Layers, Star, Share2, User, FileText, Users, HardDrive } from 'lucide-react'
import { UserNav } from './user-nav'
import { NotificationBell } from './notification-bell'
import { cn } from '@/lib/utils'

type UserRole = 'USER' | 'CLIENT' | 'PRO' | 'ADMIN' | 'SUPERADMIN'

interface BreadcrumbItem {
  label: string
  href: string
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }]

  let currentPath = ''
  paths.forEach((path) => {
    currentPath += `/${path}`
    const label = path.charAt(0).toUpperCase() + path.slice(1)
    breadcrumbs.push({ label, href: currentPath })
  })

  return breadcrumbs
}

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Home'
  if (pathname === '/gallery') return 'Gallery'
  if (pathname === '/upload') return 'Upload'
  if (pathname === '/profile') return 'Profile'
  if (pathname === '/projects') return 'Projects'
  if (pathname === '/albums') return 'Albums'
  if (pathname === '/favorites') return 'Favorites'
  if (pathname === '/admin/audit') return 'Audit Logs'
  if (pathname.startsWith('/admin')) return 'Admin'
  return 'FRAME'
}

export function Header() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

  const breadcrumbs = generateBreadcrumbs(pathname)
  const pageTitle = getPageTitle(pathname)
  const isAdminPage = pathname.startsWith('/admin')
  const isProjectsPage = pathname.startsWith('/projects')
  const isAlbumsPage = pathname.startsWith('/albums')
  
  const userRole = session?.user?.role as UserRole | undefined
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'
  const isSuperAdmin = userRole === 'SUPERADMIN'
  const isPro = userRole === 'PRO'
  const isClient = userRole === 'CLIENT'
  const isClientOrAbove = userRole && ['CLIENT', 'PRO', 'ADMIN', 'SUPERADMIN'].includes(userRole)
  const isUserOnly = userRole === 'USER' || !userRole

  // Determine default home based on role
  const getDefaultHome = () => {
    if (isAdmin) return '/admin'
    if (isClientOrAbove) return '/projects'
    return '/gallery'
  }

  // Show loading state
  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tighter">
                <span className="text-primary">FRAME</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href={getDefaultHome()} className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tighter">
                <span className="text-primary">FRAME</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {/* USER: Gallery and Upload only */}
              {isUserOnly && (
                <>
                  <Link
                    href="/gallery"
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname === '/gallery' ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <Image className="w-4 h-4" />
                    Gallery
                  </Link>
                  <Link
                    href="/upload"
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname === '/upload' ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </Link>
                </>
              )}

              {/* CLIENT and PRO: Projects, Albums, Favorites */}
              {isClientOrAbove && !isAdmin && (
                <>
                  <Link
                    href="/projects"
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      isProjectsPage ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <FolderOpen className="w-4 h-4" />
                    Projects
                  </Link>
                  <Link
                    href="/albums"
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      isAlbumsPage ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <Layers className="w-4 h-4" />
                    Albums
                  </Link>
                  <Link
                    href="/favorites"
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname === '/favorites' ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <Star className="w-4 h-4" />
                    Favorites
                  </Link>
                  {isPro && (
                    <Link
                      href="/upload"
                      className={cn(
                        "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                        pathname === '/upload' ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </Link>
                  )}
                </>
              )}

              {/* ADMIN and SUPERADMIN: Full access */}
              {isAdmin && (
                <>
                  <Link
                    href="/admin"
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname === '/admin' ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <Shield className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/projects"
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname.startsWith('/admin/projects') ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <FolderOpen className="w-4 h-4" />
                    Projects
                  </Link>
                  <Link
                    href="/projects"
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname === '/projects' ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <FolderOpen className="w-4 h-4" />
                    My Projects
                  </Link>
                  <Link
                    href="/admin/albums"
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname.startsWith('/admin/albums') ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <Layers className="w-4 h-4" />
                    Albums
                  </Link>
                  <Link
                    href="/admin/gallery"
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname.startsWith('/admin/gallery') ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <Image className="w-4 h-4" />
                    Gallery
                  </Link>
                  <Link
                    href="/admin/users"
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname.startsWith('/admin/users') ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <Users className="w-4 h-4" />
                    Users
                  </Link>
                  <Link
                    href="/admin/audit"
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname.startsWith('/admin/audit') ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <FileText className="w-4 h-4" />
                    Audit
                  </Link>
                  <Link
                    href="/admin/storage"
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname.startsWith('/admin/storage') ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <HardDrive className="w-4 h-4" />
                    Storage
                  </Link>
                </>
              )}

              {/* PRO: Show profile link */}
              {isPro && (
                <Link
                  href="/profile"
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                    pathname === '/profile' ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserNav />
          </div>
        </div>

        {pathname !== '/' && (
          <div className="border-t border-border bg-muted/50">
            <div className="flex items-center justify-between px-6 py-2">
              <nav className="flex items-center gap-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center gap-2">
                    {index > 0 && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="font-medium text-foreground">
                        {crumb.label === 'Home' && <Home className="w-4 h-4 inline" />}
                        {crumb.label === 'Admin' && <Shield className="w-4 h-4 inline mr-1" />}
                        {crumb.label === 'Projects' && <FolderOpen className="w-4 h-4 inline mr-1" />}
                        {crumb.label !== 'Home' && crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {crumb.label === 'Home' ? (
                          <Home className="w-4 h-4" />
                        ) : (
                          crumb.label
                        )}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>

              {pathname !== '/gallery' && pathname !== '/projects' && !isAdminPage && (
                <Link
                  href={getDefaultHome()}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to {isAdmin ? 'Dashboard' : isClientOrAbove ? 'Projects' : 'Gallery'}
                </Link>
              )}
            </div>
          </div>
        )}

        {pathname !== '/' && (
          <div className="border-t border-border px-6 py-3">
            <h1 className="text-xl font-semibold">
              {isAdminPage && <Shield className="w-5 h-5 inline mr-2 text-primary" />}
              {isProjectsPage && <FolderOpen className="w-5 h-5 inline mr-2 text-green-500" />}
              {pageTitle}
            </h1>
          </div>
        )}
      </header>
    </>
  )
}
