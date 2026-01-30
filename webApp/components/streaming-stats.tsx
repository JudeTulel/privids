'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Zap, Shield, Globe } from 'lucide-react'

interface StreamingStatsProps {
  ipfsCid: string
  videoSize: number
}

export default function StreamingStats({ ipfsCid, videoSize }: StreamingStatsProps) {
  const [stats, setStats] = useState({
    bitrate: 0,
    buffering: 0,
    latency: 0,
    cacheHits: 0,
  })

  useEffect(() => {
    // Simulate stats updates
    const interval = setInterval(() => {
      setStats({
        bitrate: Math.floor(Math.random() * 5000) + 1000, // 1-6 Mbps
        buffering: Math.floor(Math.random() * 30),
        latency: Math.floor(Math.random() * 200) + 50, // 50-250ms
        cacheHits: Math.floor(Math.random() * 100),
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      {/* Bitrate */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Zap className="w-4 h-4 text-accent" />
            Bitrate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">
            {(stats.bitrate / 1000).toFixed(1)} Mbps
          </p>
          <p className="text-xs text-muted-foreground mt-1">Adaptive streaming</p>
        </CardContent>
      </Card>

      {/* Buffer */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Shield className="w-4 h-4 text-accent" />
            Buffer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">{stats.buffering}%</p>
          <p className="text-xs text-muted-foreground mt-1">Preloaded</p>
        </CardContent>
      </Card>

      {/* Latency */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Globe className="w-4 h-4 text-accent" />
            Latency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">{stats.latency}ms</p>
          <p className="text-xs text-muted-foreground mt-1">IPFS network</p>
        </CardContent>
      </Card>

      {/* Storage */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Database className="w-4 h-4 text-accent" />
            Size
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">
            {formatBytes(videoSize)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            CID: {ipfsCid.substring(0, 12)}...
          </p>
        </CardContent>
      </Card>

      {/* IPFS Info */}
      <Card className="bg-accent/5 border-accent/20 md:col-span-2 lg:col-span-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Decentralized Streaming via IPFS</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            This video is streamed from IPFS nodes worldwide with adaptive bitrate and automatic failover. 
            All video chunks are encrypted end-to-end using AES-256-GCM, ensuring your privacy while watching.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
