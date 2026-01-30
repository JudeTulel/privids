'use client'

import { Play, Lock, ZapOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

const mockVideos = [
  {
    id: 1,
    title: 'Introduction to Aleo',
    creator: 'Privacy Labs',
    thumbnail: 'bg-gradient-to-br from-accent/20 to-accent/5',
    price: 2.50,
    duration: '14:32',
    isRestricted: false,
  },
  {
    id: 2,
    title: 'Understanding Zero-Knowledge Proofs',
    creator: 'Cryptography Experts',
    thumbnail: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5',
    price: 5.00,
    duration: '28:45',
    isRestricted: true,
  },
  {
    id: 3,
    title: 'Blockchain Privacy Deep Dive',
    creator: 'Web3 Academy',
    thumbnail: 'bg-gradient-to-br from-purple-500/20 to-purple-500/5',
    price: 3.75,
    duration: '21:15',
    isRestricted: false,
  },
  {
    id: 4,
    title: 'Decentralized Content Delivery',
    creator: 'IPFS Masters',
    thumbnail: 'bg-gradient-to-br from-green-500/20 to-green-500/5',
    price: 4.00,
    duration: '19:20',
    isRestricted: false,
  },
  {
    id: 5,
    title: 'Smart Contracts on Aleo',
    creator: 'Development Team',
    thumbnail: 'bg-gradient-to-br from-orange-500/20 to-orange-500/5',
    price: 6.50,
    duration: '35:10',
    isRestricted: true,
  },
  {
    id: 6,
    title: 'Privacy Regulations & Compliance',
    creator: 'Legal Experts',
    thumbnail: 'bg-gradient-to-br from-red-500/20 to-red-500/5',
    price: 2.99,
    duration: '16:45',
    isRestricted: false,
  },
]

export default function VideoGrid() {
  return (
    <section id="browse" className="px-6 py-20 max-w-7xl mx-auto">
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Featured Content</h2>
        <p className="text-muted-foreground max-w-2xl">
          Curated encrypted videos. Buy access with USAD. Watch privately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockVideos.map((video) => (
          <div
            key={video.id}
            className="group rounded-lg overflow-hidden border border-border bg-card hover:border-accent/50 transition-all duration-300"
          >
            {/* Thumbnail */}
            <div className={`relative w-full aspect-video ${video.thumbnail} flex items-center justify-center overflow-hidden`}>
              <Play className="w-12 h-12 text-accent/40 group-hover:text-accent/60 transition-colors" />
              <span className="absolute top-3 right-3 bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                {video.duration}
              </span>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-2">
                {video.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                by {video.creator}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-accent">
                    ${video.price.toFixed(2)}
                  </span>
                  {video.isRestricted && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-accent/10 text-accent text-xs font-medium">
                      <ZapOff className="w-3 h-3" />
                      <span>18+</span>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => console.log(`[v0] Play video: ${video.title}`)}
                >
                  Watch
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
