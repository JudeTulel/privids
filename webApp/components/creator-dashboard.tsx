'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Plus, Trash2 } from 'lucide-react'
import UploadForm from '@/components/upload-form'
import VideoUploadCard from '@/components/video-upload-card'

import { streamingEncryption } from '@/lib/streaming-encryption'
import { publishVideoOnChain, cidToU128Parts } from '@/services/contract'
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
      console.log("📦 Step 1: Encrypting video in chunks...");

      // 1. Encrypt video in chunks
      const { encryptedChunks, metadata } = await streamingEncryption.encryptFileInChunks(videoData.file);
      console.log(`✅ Encrypted ${encryptedChunks.length} chunks`);

      // 2. Upload each encrypted chunk to IPFS via Pinata
      console.log("📤 Step 2: Uploading chunks to IPFS...");
      const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
      if (!pinataJwt) {
        throw new Error('Pinata JWT not found. Please set NEXT_PUBLIC_PINATA_JWT in .env.local');
      }

      const chunkCids: string[] = [];

      for (let i = 0; i < encryptedChunks.length; i++) {
        const chunk = encryptedChunks[i];
        const formData = new FormData();
        const blob = new Blob([chunk.encryptedData]);
        formData.append('file', blob, `chunk_${i}.enc`);

        const metadataStr = JSON.stringify({
          name: `${videoData.title}_chunk_${i}`,
          keyvalues: {
            type: 'video_chunk',
            chunkIndex: i.toString(),
            encrypted: 'true'
          }
        });
        formData.append('pinataMetadata', metadataStr);

        const optionsStr = JSON.stringify({ cidVersion: 1 });
        formData.append('pinataOptions', optionsStr);

        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
          method: "POST",
          headers: { Authorization: `Bearer ${pinataJwt}` },
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Chunk ${i} upload failed: ${res.status}`);
        }

        const resData = await res.json();
        chunkCids.push(resData.IpfsHash);
        console.log(`✅ Uploaded chunk ${i + 1}/${encryptedChunks.length}: ${resData.IpfsHash}`);
      }

      // 3. Publish to blockchain
      console.log("⛓️ Step 3: Publishing to blockchain...");
      const videoId = `${Date.now()}field`;
      const price = 100; // 100 credits default

      const txId = await publishVideoOnChain(
        videoId,
        price,
        chunkCids,
        wallet.adapter as any
      );

      console.log("✅ Transaction ID:", txId);

      // 4. Store encryption metadata in Access Node
      console.log("🔐 Step 4: Storing encryption keys in Access Node...");
      try {
        const accessNodeUrl = process.env.NEXT_PUBLIC_ACCESS_NODE_URL || 'http://localhost:3001';
        await fetch(`${accessNodeUrl}/keys/store`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: videoId,
            encryptionKey: metadata.key,
            chunkIVs: metadata.chunkIVs,
            ownerAddress: publicKey,
            chunkCids: chunkCids
          })
        });
        console.log("✅ Encryption metadata stored");
      } catch (err) {
        console.warn("⚠️ Failed to store encryption metadata:", err);
        // Non-fatal - continue
      }

      // 5. Update UI
      const newVideo = {
        id: videoId,
        title: videoData.title,
        description: videoData.description,
        ageRestriction: videoData.ageRestriction,
        thumbnail: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&h=200&fit=crop',
        duration: '0:00',
        chunkCids: chunkCids,
      }
      setUploadedVideos([newVideo, ...uploadedVideos])
      setShowUploadForm(false)

      console.log("🎉 Upload complete!");

    } catch (error: any) {
      console.error("❌ Upload Error:", error);
      setUploadError(error.message || "Upload failed");
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
