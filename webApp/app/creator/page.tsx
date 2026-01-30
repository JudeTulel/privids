'use client'

import Header from '@/components/header'
import Footer from '@/components/footer'
import CreatorDashboard from '@/components/creator-dashboard'
import { WalletProvider } from '@/components/wallet-provider'

export default function CreatorPage() {
  return (
    <WalletProvider>
      <main className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <div className="flex-1">
          <CreatorDashboard />
        </div>
        <Footer />
      </main>
    </WalletProvider>
  )
}
