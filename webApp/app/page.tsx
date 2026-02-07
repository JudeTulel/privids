'use client'

import Header from '@/components/header'
import Hero from '@/components/hero'
import VideoGrid from '@/components/video-grid'
import Footer from '@/components/footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <VideoGrid />
      <Footer />
    </main>
  )
}
