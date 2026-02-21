'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Camera, Users, Shield, Zap, Mail, ArrowRight, CheckCircle } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tighter mb-4">
            <span className="text-primary">FRAME</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Professional Image Management System
          </p>
        </div>

        <div className="prose max-w-none mb-12">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">About FRAME</h2>
            <p className="text-muted-foreground leading-relaxed">
              FRAME is a professional image management system designed for photographers, 
              creative agencies, and businesses that need to manage, organize, and share 
              large collections of digital images. Built with modern web technologies, 
              it provides a seamless experience for uploading, processing, and delivering 
              images to clients.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Image Management</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload, organize, and manage thousands of images with automatic 
                  thumbnail generation and metadata extraction.
                </p>
              </div>

              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="font-semibold">Client Access</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Grant clients secure access to specific projects and albums 
                  with customizable permission levels.
                </p>
              </div>

              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="font-semibold">PRO Features</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Advanced features including face recognition, watermarking, 
                  batch processing, and export capabilities.
                </p>
              </div>

              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-cyan-500" />
                  </div>
                  <h3 className="font-semibold">Fast Delivery</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  CDN-powered delivery with automatic optimization for fast 
                  loading times across all devices.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">User Roles</h2>
            <div className="space-y-4">
              <div className="p-4 bg-card border border-border rounded-lg">
                <h3 className="font-semibold text-blue-500">User</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Basic access to personal gallery and image management.
                </p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <h3 className="font-semibold text-green-500">Client</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Access to shared projects and albums assigned by PRO users.
                </p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <h3 className="font-semibold text-purple-500">PRO</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Full access to projects, albums, client management, and advanced features.
                </p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <h3 className="font-semibold text-red-500">Admin</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  System administration, user management, and monitoring.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Contact & Support</h2>
            <p className="text-muted-foreground mb-4">
              Have questions or need help? Our support team is here to assist you.
            </p>
            <Link 
              href="/help" 
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="w-4 h-4" />
              Contact Support
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FRAME. All rights reserved.</p>
        </div>
      </main>
    </div>
  )
}
