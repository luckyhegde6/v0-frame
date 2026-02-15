'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home, Shield, Image, Upload, ArrowLeft } from 'lucide-react'
import { UserNav } from './user-nav'
import { cn } from '@/lib/utils'

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
  if (pathname === '/admin') return 'Admin'
  return 'FRAME'
}

export function Header() {
  const pathname = usePathname()
  const breadcrumbs = generateBreadcrumbs(pathname)
  const pageTitle = getPageTitle(pathname)
  const isAdminPage = pathname === '/admin'

  return (
    <>
      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo and Nav Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tighter">
                <span className="text-primary">FRAME</span>
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
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
            </nav>
          </div>

          {/* Right Side - User Nav */}
          <div className="flex items-center gap-4">
            <UserNav />
          </div>
        </div>

        {/* Breadcrumbs Bar */}
        {pathname !== '/' && (
          <div className="border-t border-border bg-muted/50">
            <div className="flex items-center justify-between px-6 py-2">
              {/* Breadcrumbs */}
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

              {/* Back Button for non-home pages */}
              {pathname !== '/' && pathname !== '/gallery' && (
                <Link
                  href={pathname === '/admin' ? '/gallery' : '/gallery'}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Gallery
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Page Title Bar */}
        {pathname !== '/' && (
          <div className="border-t border-border px-6 py-3">
            <h1 className="text-xl font-semibold">
              {isAdminPage && <Shield className="w-5 h-5 inline mr-2 text-primary" />}
              {pageTitle}
            </h1>
          </div>
        )}
      </header>
    </>
  )
}
