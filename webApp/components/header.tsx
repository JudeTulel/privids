'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet-button'
import { Lock, Upload } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 text-foreground hover:text-accent transition-colors">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-accent text-accent-foreground font-bold text-lg">
            ◈
          </div>
          <span className="font-bold text-xl hidden sm:inline">Aleo Video</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#browse" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Browse
          </Link>
          <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </Link>
          <Link href="/#privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/creator" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Upload className="w-4 h-4" />
            Creator
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <WalletButton />
          <Button className="gap-2 bg-accent/80 text-accent-foreground hover:bg-accent/70" variant="outline">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Sign In</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
