'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileVideo, AlertCircle } from 'lucide-react'

interface UploadFormProps {
  onUpload: (videoData: any) => void
  onCancel: () => void
}

export default function UploadForm({ onUpload, onCancel }: UploadFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ageRestriction, setAgeRestriction] = useState('G')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('video/')) {
      setSelectedFile(file)

      // Create preview thumbnail
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      console.log('[v0] Video file selected:', file.name)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !selectedFile) {
      console.log('[v0] Missing required fields')
      return
    }

    onUpload({
      title,
      description,
      ageRestriction,
      file: selectedFile,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
    })

    // Reset form
    setTitle('')
    setDescription('')
    setAgeRestriction('G')
    setSelectedFile(null)
    setPreview(null)
    console.log('[v0] Video uploaded successfully')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Video File Upload */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${isDragging
            ? 'border-accent bg-accent/5'
            : selectedFile
              ? 'border-accent/50 bg-card/50'
              : 'border-border hover:border-accent/50'
          }`}
      >
        <input
          type="file"
          accept="video/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
        />

        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-accent/10 border border-accent/20">
                <FileVideo className="w-8 h-8 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault()
                  setSelectedFile(null)
                  setPreview(null)
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Change
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="font-semibold text-foreground mb-1">Drag and drop your video here</p>
            <p className="text-sm text-muted-foreground">
              or click to browse (MP4, WebM, MOV - up to 5GB)
            </p>
          </div>
        )}
      </div>

      {/* Video Metadata */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">
            Video Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter video description (optional)"
            rows={4}
            className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </div>

        {/* Age Restriction */}
        <div>
          <label className="block text-sm font-semibold mb-3 text-foreground">
            Age Restriction
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['G', 'PG', '13+', '18+'].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setAgeRestriction(rating)}
                className={`p-4 rounded-lg border-2 font-semibold text-center transition-all ${ageRestriction === rating
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-card text-foreground hover:border-accent/50'
                  }`}
              >
                {rating}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            Age verification will be enforced via Provable SDK ZK proofs
          </p>
        </div>
      </div>

      {/* Encryption Notice */}
      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="pt-4">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Privacy Secured:</span> Your video will be encrypted end-to-end using AES-256-GCM and stored on IPFS with access controlled by your Aleo smart contract.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="px-6 bg-transparent"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!title.trim() || !selectedFile}
          className="px-6 bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Upload Video
        </Button>
      </div>
    </form>
  )
}
