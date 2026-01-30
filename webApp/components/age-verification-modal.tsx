'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Lock, CheckCircle2, Loader2 } from 'lucide-react'
import { generateAgeProof, mockCredentialProvider, AGE_CATEGORIES } from '@/lib/age-verification'

interface AgeVerificationModalProps {
  isOpen: boolean
  videoRestriction: string
  videoTitle: string
  userAddress: string
  onVerified: () => void
  onCancel: () => void
}

export default function AgeVerificationModal({
  isOpen,
  videoRestriction,
  videoTitle,
  userAddress,
  onVerified,
  onCancel,
}: AgeVerificationModalProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStep, setVerificationStep] = useState<'prompt' | 'generating' | 'verified' | 'failed'>(
    'prompt'
  )
  const [selectedAge, setSelectedAge] = useState<string | null>(null)

  if (!isOpen) return null

  const ageThreshold =
    videoRestriction === '18+' ? 18 : videoRestriction === '13+' ? 13 : 0

  const handleVerify = async () => {
    // In Real ZK, we don't need the user to claim an age, we verify the credential.
    // However, we can keep the UI state if needed, but we ignore the value.

    setIsVerifying(true)
    setVerificationStep('generating')

    try {
      // Generate ZK proof
      const result = await generateAgeProof(
        ageThreshold,
        videoTitle,
        mockCredentialProvider
      )

      if (result.success) {
        console.log('[ZK] Age verification proof generated')
        setVerificationStep('verified')

        // Auto-close and callback after 2 seconds
        setTimeout(() => {
          setIsVerifying(false)
          onVerified()
        }, 2000)
      } else {
        console.error("Verification failed:", result.message);
        setVerificationStep('failed')
        setIsVerifying(false)
      }
    } catch (error) {
      console.error('[ZK] Verification error:', error)
      setVerificationStep('failed')
      setIsVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-card border-border">
        {verificationStep === 'prompt' && (
          <>
            <CardHeader>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-500 mt-1 flex-shrink-0" />
                <div>
                  <CardTitle>Age Verification Required</CardTitle>
                  <CardDescription className="mt-1">
                    This video is restricted to {AGE_CATEGORIES[videoRestriction as keyof typeof AGE_CATEGORIES]?.label || 'General Audiences'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-2 text-foreground">
                  Confirm your age to continue
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  A zero-knowledge proof will be generated to verify your age without revealing it.
                </p>

                {/* Age Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Select Your Age Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Under 13', '13-17', '18-25', '25+'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setSelectedAge(range)}
                        disabled={
                          (range === 'Under 13' && ageThreshold > 0) ||
                          (range === '13-17' && ageThreshold > 17)
                        }
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${selectedAge === range
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-foreground hover:border-accent/50'
                          } ${(range === 'Under 13' && ageThreshold > 0) ||
                            (range === '13-17' && ageThreshold > 17)
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                          }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="text-xs text-foreground flex gap-2">
                    <Lock className="w-4 h-4 flex-shrink-0 text-accent mt-0.5" />
                    <span>
                      Your actual age is never revealed. A ZK proof confirms you meet the minimum age requirement.
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isVerifying}
                  className="flex-1 bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={!selectedAge || isVerifying}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {verificationStep === 'generating' && (
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 mx-auto text-accent animate-spin" />
            <div>
              <p className="font-semibold text-foreground">Generating ZK Proof</p>
              <p className="text-sm text-muted-foreground mt-1">
                Creating your age verification proof...
              </p>
            </div>
          </CardContent>
        )}

        {verificationStep === 'verified' && (
          <CardContent className="py-12 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Age Verified</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your ZK proof has been generated successfully
              </p>
            </div>
          </CardContent>
        )}

        {verificationStep === 'failed' && (
          <CardContent className="py-12 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Verification Failed</p>
              <p className="text-sm text-muted-foreground mt-1">
                You do not meet the age requirement for this video
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full mt-4 bg-transparent"
            >
              Go Back
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
