'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Play, Trash2, Lock, Eye, MoreVertical } from 'lucide-react'
import Image from 'next/image'

interface VideoUploadCardProps {
  video: {
    id: string
    title: string
    description: string
    ageRestriction: string
    thumbnail: string
    duration: string
  }
  onDelete: () => void
}

const ageRestrictionColors: Record<string, string> = {
  'G': 'bg-green-500/10 text-green-700 border-green-200',
  'PG': 'bg-blue-500/10 text-blue-700 border-blue-200',
  '13+': 'bg-orange-500/10 text-orange-700 border-orange-200',
  '18+': 'bg-red-500/10 text-red-700 border-red-200',
}

const ageRestrictionColorsDark: Record<string, string> = {
  'G': 'dark:bg-green-500/20 dark:text-green-400 dark:border-green-700',
  'PG': 'dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-700',
  '13+': 'dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-700',
  '18+': 'dark:bg-red-500/20 dark:text-red-400 dark:border-red-700',
}

export default function VideoUploadCard({ video, onDelete }: VideoUploadCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  return (
    <Card className="overflow-hidden bg-card border-border hover:border-accent/50 transition-all group">
      {/* Video Thumbnail with Hover Preview */}
      <div
        className="relative aspect-video bg-gradient-to-br from-secondary to-secondary/50 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={video.thumbnail || "/placeholder.svg"}
          alt={video.title}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
        />

        {/* Play Button Overlay on Hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Button
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full w-14 h-14 p-0"
              onClick={() => setShowPreview(true)}
            >
              <Play className="w-6 h-6 fill-current" />
            </Button>
          </div>
        )}

        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 bg-black/60 px-2 py-1 rounded text-xs font-semibold text-white">
          {video.duration}
        </div>

        {/* Encryption Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 px-2 py-1 rounded text-xs font-semibold text-white">
          <Lock className="w-3 h-3" />
          Encrypted
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
            {video.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {video.description}
          </p>
        </div>

        {/* Age Restriction Badge */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
              ageRestrictionColors[video.ageRestriction]
            } ${ageRestrictionColorsDark[video.ageRestriction]}`}
          >
            <Eye className="w-3 h-3" />
            {video.ageRestriction}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-8 bg-transparent"
            onClick={() => setShowPreview(true)}
          >
            <Play className="w-3 h-3 mr-1" />
            Preview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreview(false)}
        >
          <Card className="w-full max-w-2xl bg-card overflow-hidden">
            <div className="relative aspect-video bg-black">
              <img
                src={video.thumbnail || "/placeholder.svg"}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full w-20 h-20 p-0">
                  <Play className="w-8 h-8 fill-current" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {video.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {video.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                    ageRestrictionColors[video.ageRestriction]
                  } ${ageRestrictionColorsDark[video.ageRestriction]}`}
                >
                  <Eye className="w-3 h-3" />
                  {video.ageRestriction}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  )
}
