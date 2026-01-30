'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Plus, Trash2 } from 'lucide-react'
import UploadForm from '@/components/upload-form'
import VideoUploadCard from '@/components/video-upload-card'

import { ipfsService } from '@/lib/ipfs-service'
import { publishVideoOnChain } from '@/services/contract'
import { useWallet } from '@/components/wallet-provider'
import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base'

export default function CreatorDashboard() {
  // Use the standard hook result which provides wallet and publicKey
  const { wallet, publicKey } = useWallet()

  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [uploadedVideos, setUploadedVideos] = useState([
    {
      id: '1',
      title: 'Introduction to Aleo',
      description: 'Learn the basics of Aleo blockchain',
      ageRestriction: 'G',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=300&h=200&fit=crop',
      duration: '12:34',
    },
    {
      id: '2',
      title: 'Advanced Privacy Techniques',
      description: 'Deep dive into zero-knowledge proofs',
      ageRestriction: '18+',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop',
      duration: '25:16',
    },
  ])

  const [showUploadForm, setShowUploadForm] = useState(false)

  const handleDeleteVideo = (id: string) => {
    setUploadedVideos(uploadedVideos.filter(video => video.id !== id))
  }

  const handleUploadVideo = async (videoData: any) => {
    if (!publicKey || !wallet || !wallet.adapter) {
      setUploadError("Wallet not connected. Please connect your Aleo wallet.")
      return;
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // 1. Upload to IPFS via Pinata
      console.log("1. Uploading to IPFS...", videoData.file.name);
      const encryptionKey = "demo-encryption-key-123";
      const metadata = await ipfsService.uploadVideo(videoData.file, encryptionKey);

      console.log("IPFS Upload complete. CID:", metadata.cid);

      // 2. Prepare transaction data
      const { part1, part2 } = ipfsService.splitCidToU128(metadata.cid);

      // 3. Publish to Chain using Standard Adapter
      console.log("2. Requesting Wallet Signature...");

      const transaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.Testnet,
        'prividocs_v1.aleo', // Your program ID
        'publish_video',     // Your transition name
        [
          `${Math.floor(Math.random() * 1000000)}field`, // video_id (random for demo)
          `10u64`,                                        // price (default 10)
          part1,                                          // cid_part1
          part2                                           // cid_part2
        ],
        1_000_000 // Fee (1 credit)
      )

      if (!wallet.adapter.requestTransaction) {
        throw new Error("Wallet does not support transaction requests")
      }

      const txId = await wallet.adapter.requestTransaction(transaction)
      console.log("Transaction ID:", txId)

      const newVideo = {
        id: metadata.cid,
        title: videoData.title,
        description: videoData.description,
        ageRestriction: videoData.ageRestriction,
        thumbnail: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&h=200&fit=crop',
        duration: '0:00',
      }
      setUploadedVideos([newVideo, ...uploadedVideos])
      setShowUploadForm(false)

    } catch (error: any) {
      console.error("Chain Error:", error);
      setUploadError(error.message || "Transaction failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      {/* Header Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Creator Dashboard</h1>
        <p className="text-muted-foreground text-lg">Upload and manage your encrypted videos</p>
      </div>

      {/* Upload Section */}
      {!showUploadForm ? (
        <Button
          className="mb-8 gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
          onClick={() => setShowUploadForm(true)}
          disabled={isUploading}
        >
          <Plus className="w-5 h-5" />
          {isUploading ? 'Uploading...' : 'Upload New Video'}
        </Button>
      ) : (
        <Card className="mb-8 border-accent/30 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-accent" />
              Upload Video
            </CardTitle>
            <CardDescription>
              Upload your video with age restrictions and encryption
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadError && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">
                Error: {uploadError}
              </div>
            )}
            {isUploading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                <p className="text-muted-foreground">Uploading to IPFS & Publishing to Chain...</p>
              </div>
            ) : (
              <UploadForm
                onUpload={handleUploadVideo}
                onCancel={() => setShowUploadForm(false)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Videos Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Your Videos ({uploadedVideos.length})</h2>

        {uploadedVideos.length === 0 ? (
          <Card className="border-dashed bg-card/50">
            <CardContent className="py-12 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No videos uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start by uploading your first encrypted video
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uploadedVideos.map((video) => (
              <VideoUploadCard
                key={video.id}
                video={video}
                onDelete={() => handleDeleteVideo(video.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{uploadedVideos.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Encrypted & stored</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">1,247</p>
            <p className="text-xs text-muted-foreground mt-1">Privacy-preserved access</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Storage Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">2.4 GB</p>
            <p className="text-xs text-muted-foreground mt-1">of 100 GB free</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
