'use client'

import React from "react"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Loader2,
} from 'lucide-react'

interface VideoPlayerProps {
  videoCid: string
  videoTitle: string
  thumbnailUrl: string
  isAgeVerified: boolean
}

export default function VideoPlayer({
  videoCid,
  videoTitle,
  thumbnailUrl,
  isAgeVerified,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [bufferProgress, setBufferProgress] = useState(0)
  const [quality, setQuality] = useState('auto')

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Construct IPFS gateway URL
  const videoUrl = `https://gateway.pinata.cloud/ipfs/${videoCid}`

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlayPause = () => {
      setIsPlaying(!video.paused)
      console.log('[v0] Video play state:', !video.paused)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      console.log('[v0] Video metadata loaded, duration:', video.duration)
    }

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        setBufferProgress((bufferedEnd / video.duration) * 100)
      }
    }

    const handleLoadStart = () => {
      setIsLoading(true)
      console.log('[v0] Video loading started')
    }

    const handleCanPlay = () => {
      setIsLoading(false)
      console.log('[v0] Video can play')
    }

    const handleError = () => {
      setIsLoading(false)
      console.error('[v0] Video playback error')
    }

    video.addEventListener('play', handlePlayPause)
    video.addEventListener('pause', handlePlayPause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('play', handlePlayPause)
      video.removeEventListener('pause', handlePlayPause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
    }
  }, [])

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(!isMuted)
      console.log('[v0] Muted:', !isMuted)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
    }
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
      console.log('[v0] Seeking to:', newTime)
    }
  }

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen?.()
        setIsFullscreen(true)
        console.log('[v0] Fullscreen enabled')
      } else {
        document.exitFullscreen?.()
        setIsFullscreen(false)
        console.log('[v0] Fullscreen disabled')
      }
    }
  }

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (!isAgeVerified) {
    return (
      <Card className="aspect-video bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center border-border">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Age verification required to watch this video
          </p>
          <Button disabled className="bg-accent text-accent-foreground opacity-50">
            Complete Age Verification
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={() => {
        setShowControls(true)
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        controlsTimeoutRef.current = setTimeout(
          () => setShowControls(false),
          3000
        )
      }}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full"
        crossOrigin="anonymous"
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="w-12 h-12 text-accent animate-spin" />
        </div>
      )}

      {/* Player Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="relative h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer group/progress">
            {/* Buffer Progress */}
            <div
              className="absolute h-full bg-white/40 rounded-full transition-all"
              style={{ width: `${bufferProgress}%` }}
            />

            {/* Playback Progress */}
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleProgressChange}
              className="absolute w-full h-full cursor-pointer opacity-0 z-10"
            />

            {/* Visual Progress */}
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />

            {/* Hover Indicator */}
            <div className="absolute h-3 w-3 bg-white rounded-full top-1/2 -translate-y-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-xs text-white/70">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleMute}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quality Selector */}
            <div className="relative group">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 h-8 px-2 text-xs"
              >
                {quality}
              </Button>

              <div className="absolute hidden group-hover:block right-0 bottom-full bg-black/90 border border-white/20 rounded mb-2 z-20">
                {['auto', '1080p', '720p', '480p', '360p'].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setQuality(q)
                      console.log('[v0] Quality changed to:', q)
                    }}
                    className={`block w-full text-left px-4 py-2 text-xs hover:bg-white/10 ${
                      quality === q ? 'text-accent' : 'text-white'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <Settings className="w-4 h-4" />
            </Button>

            {/* Fullscreen */}
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Center Play Button (when paused) */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="w-20 h-20 rounded-full bg-accent/80 hover:bg-accent flex items-center justify-center">
            <Play className="w-8 h-8 fill-current text-accent-foreground ml-1" />
          </div>
        </button>
      )}
    </div>
  )
}
