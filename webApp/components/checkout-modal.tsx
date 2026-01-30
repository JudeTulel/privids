'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Loader2, X, Clock, Download, Volume2, Eye } from 'lucide-react'
import { paymentService, PricingTier } from '@/lib/payment-service'

interface CheckoutModalProps {
  isOpen: boolean
  videoId: string
  videoTitle: string
  creatorAddress: string
  userAddress: string
  onPaymentSuccess: () => void
  onCancel: () => void
}

type PaymentStep = 'pricing' | 'processing' | 'success' | 'failed'

export default function CheckoutModal({
  isOpen,
  videoId,
  videoTitle,
  creatorAddress,
  userAddress,
  onPaymentSuccess,
  onCancel,
}: CheckoutModalProps) {
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('pricing')
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [txHash, setTxHash] = useState('')

  if (!isOpen) return null

  const pricingTiers = paymentService.getPricingTiers()

  const handlePayment = async (tier: PricingTier) => {
    setSelectedTier(tier)
    setIsProcessing(true)
    setPaymentStep('processing')

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const transaction = await paymentService.processPayment(
        videoId,
        userAddress,
        creatorAddress,
        tier.id
      )

      setTxHash(transaction.txHash)
      setPaymentStep('success')

      // Auto-close after 3 seconds
      setTimeout(() => {
        setIsProcessing(false)
        onPaymentSuccess()
      }, 3000)

      console.log('[v0] Payment successful:', transaction.id)
    } catch (error) {
      console.error('[v0] Payment error:', error)
      setPaymentStep('failed')
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-border">
          <div className="flex-1">
            <CardTitle>Purchase Video Access</CardTitle>
            <CardDescription className="mt-1">
              {videoTitle}
            </CardDescription>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="pt-6">
          {paymentStep === 'pricing' && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Choose your access tier. All purchases support the creator and enable continued development of this platform.
              </p>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pricingTiers.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => handlePayment(tier)}
                    disabled={isProcessing}
                    className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                      tier.recommended
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-card hover:border-accent/50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {tier.recommended && (
                      <div className="absolute -top-3 left-4 bg-accent text-accent-foreground px-2 py-0.5 rounded text-xs font-semibold">
                        Recommended
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{tier.name}</h3>
                        <p className="text-2xl font-bold text-accent mt-1">
                          {tier.price === 0 ? 'Free' : `$${tier.price.toFixed(2)}`}
                        </p>
                        {tier.duration > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {tier.duration === 36500 ? 'Lifetime' : `${tier.duration} days`}
                          </p>
                        )}
                      </div>

                      {/* Features */}
                      <div className="space-y-2">
                        {tier.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-muted-foreground flex items-start gap-2"
                          >
                            <CheckCircle2 className="w-3 h-3 text-accent mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        className={`w-full ${
                          tier.recommended
                            ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                            : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                        disabled={isProcessing}
                      >
                        {tier.price === 0 ? 'Claim Free Access' : 'Purchase Now'}
                      </Button>
                    </div>
                  </button>
                ))}
              </div>

              {/* Payment Info */}
              <Card className="bg-accent/5 border-accent/20">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <p className="text-foreground font-medium">Payment Details</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Powered by USAD (USD Aleo Dollar)</p>
                    <p>• 15% platform fee, 85% to creator</p>
                    <p>• 7-day refund policy available</p>
                    <p>• All transactions are verified on Aleo blockchain</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-12 h-12 mx-auto text-accent animate-spin" />
              <div>
                <p className="font-semibold text-foreground">Processing Payment</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Confirming your {selectedTier?.name.toLowerCase()} purchase on Aleo blockchain...
                </p>
              </div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Payment Successful</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your {selectedTier?.name.toLowerCase()} access has been activated
                </p>
              </div>

              {/* Success Details */}
              <Card className="bg-secondary/30 border-border mt-6">
                <CardContent className="pt-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction Hash:</span>
                    <span className="font-mono text-foreground">
                      {txHash.substring(0, 16)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-semibold text-foreground">
                      ${selectedTier?.price.toFixed(2) || '0.00'} USAD
                    </span>
                  </div>
                  {selectedTier && selectedTier.duration > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Access Duration:</span>
                      <span className="font-semibold text-foreground">
                        {selectedTier.duration === 36500
                          ? 'Lifetime'
                          : `${selectedTier.duration} days`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {paymentStep === 'failed' && (
            <div className="py-12 text-center space-y-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Payment Failed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  An error occurred while processing your payment. Please try again.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPaymentStep('pricing')}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
