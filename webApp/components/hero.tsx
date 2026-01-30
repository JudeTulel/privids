'use client'

import { Button } from '@/components/ui/button'
import { Shield, Eye, Lock } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-20 md:py-32">
      <div className="max-w-4xl mx-auto">
        {/* Accent label */}
        <div className="flex items-center justify-center mb-8">
          <div className="px-3 py-1 rounded-full border border-accent/30 bg-accent/5 text-accent text-sm font-medium">
            Powered by Aleo Zero-Knowledge Proofs
          </div>
        </div>

        {/* Main heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight text-balance">
            Privacy-First Video Streaming
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-balance leading-relaxed">
            Watch encrypted video with zero-knowledge proofs. No data collection. Complete privacy. Powered entirely by Aleo blockchain technology.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-8">
            Explore Videos
          </Button>
          <Button size="lg" variant="outline" className="px-8 bg-transparent">
            Learn More
          </Button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 text-accent mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">End-to-End Encrypted</h3>
            <p className="text-sm text-muted-foreground">Videos encrypted client-side. Only you hold the keys.</p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 text-accent mb-4">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Zero-Knowledge Verified</h3>
            <p className="text-sm text-muted-foreground">Prove age without revealing identity. Privacy preserved.</p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 text-accent mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Blockchain Secured</h3>
            <p className="text-sm text-muted-foreground">Built on Aleo. Access records verified on-chain.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
