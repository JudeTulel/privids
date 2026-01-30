'use client'

import { useState } from 'react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import AgeVerificationModal from '@/components/age-verification-modal'
import CheckoutModal from '@/components/checkout-modal'
import VideoPlayer from '@/components/video-player'
import StreamingStats from '@/components/streaming-stats'
import { WalletProvider, useWallet } from '@/components/wallet-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, Lock, Share2, Heart, ShoppingCart } from 'lucide-react'
import { useAgeVerification } from '@/hooks/use-age-verification'
import { useAccessControl } from '@/hooks/use-access-control'

const mockVideoData = {
  id: '1',
  title: 'Introduction to Aleo Blockchain',
  description:
    'Learn the fundamentals of Aleo, a blockchain platform focused on privacy and programmability. This comprehensive guide covers the basics of zero-knowledge proofs, encrypted transactions, and how Aleo differs from other blockchain networks.',
  ageRestriction: '13+',
  creator: 'Privacy Academy',
  creatorAddress: '0x1234...5678',
  thumbnail:
    'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=800&h=450&fit=crop',
  duration: '42:15',
  views: 12450,
  likes: 3421,
  uploadDate: '2024-01-15',
  tags: ['Blockchain', 'Privacy', 'ZK Proofs', 'Aleo'],
  ipfsHash: 'QmX...abc123',
}

export default function VideoPage({ params }: { params: { id: string } }) {
  const { publicKey: address } = useWallet()
  const { checkAgeRequired, verifyAge, isVerified } = useAgeVerification(address || '')
  const { grantAccess, getAccessState } = useAccessControl(address || '')
  const [showAgeVerification, setShowAgeVerification] = useState(false)
  const [isAgeVerified, setIsAgeVerified] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [liked, setLiked] = useState(false)

  const video = mockVideoData
  const accessState = getAccessState(video.id)

  const handlePlayClick = async () => {
    if (!address) {
      console.log('[v0] User not connected')
      return
    }

    if (checkAgeRequired(video.ageRestriction)) {
      if (!isAgeVerified) {
        setShowAgeVerification(true)
      } else {
        console.log('[v0] Playing video - age verified')
      }
    } else {
      console.log('[v0] No age verification required for this video')
    }
  }

  const handleVerificationComplete = async () => {
    setShowAgeVerification(false)
    setIsAgeVerified(true)
    console.log('[v0] Age verification completed, video can now be played')
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <div className="flex-1">
        <div className="w-full max-w-5xl mx-auto px-6 py-12">
          {/* Video Player Section */}
          <div className="mb-8">
            {checkAgeRequired(video.ageRestriction) && !isAgeVerified ? (
              <div className="relative aspect-video bg-gradient-to-br from-secondary to-secondary/50 rounded-lg overflow-hidden mb-6 flex items-center justify-center">
                <img
                  src={video.thumbnail || "/placeholder.svg"}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Button
                    onClick={() => setShowAgeVerification(true)}
                    disabled={!address}
                    className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Verify Age to Watch
                  </Button>
                </div>
              </div>
            ) : (
              <VideoPlayer
                videoCid={video.ipfsHash}
                videoTitle={video.title}
                thumbnailUrl={video.thumbnail}
                isAgeVerified={!checkAgeRequired(video.ageRestriction) || isAgeVerified}
              />
            )}

            {/* Status Badge */}
            {isAgeVerified && (
              <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold border border-green-500/30">
                Age Verified
              </div>
            )}

            {/* Duration */}
            <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded text-sm font-semibold text-white">
              {video.duration}
            </div>
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{video.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span>{video.views.toLocaleString()} views</span>
                <span>Uploaded {video.uploadDate}</span>
              </div>
            </div>

            {/* Creator Info */}
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{video.creator}</p>
                    <p className="text-sm text-muted-foreground">{video.creatorAddress}</p>
                  </div>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Subscribe
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Description and Stats */}
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-foreground whitespace-pre-wrap">
                      {video.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 pt-4 border-t border-border">
                    <button
                      onClick={() => setLiked(!liked)}
                      className={`flex items-center gap-2 text-sm font-medium transition-colors ${liked
                          ? 'text-accent'
                          : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${liked ? 'fill-current' : ''}`}
                      />
                      {(video.likes + (liked ? 1 : 0)).toLocaleString()}
                    </button>

                    <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      <Share2 className="w-5 h-5" />
                      Share
                    </button>

                    {/* Age Restriction Badge */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${video.ageRestriction === '13+'
                            ? 'bg-orange-500/10 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-700'
                            : 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-700'
                          }`}
                      >
                        <Eye className="w-3 h-3" />
                        {video.ageRestriction}
                      </div>

                      {/* Purchase Button */}
                      {!accessState?.hasAccess && (
                        <Button
                          onClick={() => setShowCheckout(true)}
                          disabled={!address}
                          className="ml-auto gap-2 bg-accent/80 text-accent-foreground hover:bg-accent/70 text-xs h-7"
                          variant="outline"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          Purchase Access
                        </Button>
                      )}

                      {accessState?.hasAccess && (
                        <div className="ml-auto text-xs font-semibold text-green-500">
                          ✓ Access Granted
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Encryption Status */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                    <Lock className="w-4 h-4 text-accent" />
                    <span>
                      End-to-end encrypted via IPFS ({video.ipfsHash})
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 pt-4">
                    {video.tags.map((tag) => (
                      <button
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/30 hover:border-accent transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Streaming Stats */}
            {isAgeVerified || !checkAgeRequired(video.ageRestriction) && (
              <StreamingStats ipfsCid={video.ipfsHash} videoSize={104857600} />
            )}
          </div>
        </div>
      </div>

      {/* Age Verification Modal */}
      <AgeVerificationModal
        isOpen={showAgeVerification}
        videoRestriction={video.ageRestriction}
        videoTitle={video.title}
        userAddress={address || ''}
        onVerified={handleVerificationComplete}
        onCancel={() => setShowAgeVerification(false)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        videoId={video.id}
        videoTitle={video.title}
        creatorAddress={video.creatorAddress}
        userAddress={address || ''}
        onPaymentSuccess={() => {
          setShowCheckout(false)
          grantAccess(video.id, 'premium', Date.now() + 7 * 24 * 60 * 60 * 1000)
          console.log('[v0] Access granted after successful payment')
        }}
        onCancel={() => setShowCheckout(false)}
      />

      <Footer />
    </main>
  )
}
