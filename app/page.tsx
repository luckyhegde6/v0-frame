'use client'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="text-2xl font-bold">
          <span className="text-primary">FRAME</span>
        </div>
      </nav>

      <section className="px-6 py-24 max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">
          Your visual story, perfectly framed
        </h1>
        <p className="text-xl text-foreground/70 mb-12">
          Upload, organize, and share your images with the world.
        </p>
        <a href="/upload" className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90">
          Get Started
        </a>
      </section>
    </div>
  )
}
