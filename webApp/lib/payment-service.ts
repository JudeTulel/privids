export interface PricingTier {
  id: string
  name: string
  price: number // in USAD
  duration: number // in days
  features: string[]
  recommended?: boolean
}

export interface PaymentTransaction {
  id: string
  videoId: string
  buyerAddress: string
  creatorAddress: string
  amount: number // in USAD
  status: 'pending' | 'confirmed' | 'failed'
  txHash: string
  timestamp: number
  accessToken: string
}

export interface AccessRecord {
  userId: string
  videoId: string
  accessToken: string
  expiresAt: number
  isPaid: boolean
}

class PaymentService {
  private transactions: Map<string, PaymentTransaction> = new Map()
  private accessRecords: Map<string, AccessRecord[]> = new Map()
  private pricingTiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free Access',
      price: 0,
      duration: 0,
      features: ['Low quality (360p)', 'Ad-supported', '24-hour access'],
    },
    {
      id: 'basic',
      name: 'Basic Access',
      price: 2.99,
      duration: 7,
      features: ['HD quality (720p)', 'Ad-free', '7-day access', 'Download'],
      recommended: true,
    },
    {
      id: 'pro',
      name: 'Pro Access',
      price: 9.99,
      duration: 90,
      features: ['4K quality', 'Ad-free', '90-day access', 'Download', 'Offline viewing'],
    },
    {
      id: 'lifetime',
      name: 'Lifetime Access',
      price: 29.99,
      duration: 36500,
      features: ['4K quality', 'Ad-free', 'Lifetime access', 'Download', 'Offline viewing', 'Priority support'],
    },
  ]

  /**
   * Process USAD payment for video access
   */
  async processPayment(
    videoId: string,
    buyerAddress: string,
    creatorAddress: string,
    tierId: string
  ): Promise<PaymentTransaction> {
    try {
      const tier = this.pricingTiers.find((t) => t.id === tierId)
      if (!tier) {
        throw new Error('Invalid pricing tier')
      }

      console.log('[v0] Processing USAD payment:', {
        videoId,
        buyerAddress,
        amount: tier.price,
        tier: tierId,
      })

      // Simulate blockchain transaction
      const txHash = `0x${Math.random().toString(16).substring(2, 66)}`
      const accessToken = this.generateAccessToken(buyerAddress, videoId)

      const transaction: PaymentTransaction = {
        id: Math.random().toString(36).substring(7),
        videoId,
        buyerAddress,
        creatorAddress,
        amount: tier.price,
        status: 'confirmed',
        txHash,
        timestamp: Date.now(),
        accessToken,
      }

      this.transactions.set(transaction.id, transaction)

      // Record access
      const accessRecord: AccessRecord = {
        userId: buyerAddress,
        videoId,
        accessToken,
        expiresAt: Date.now() + tier.duration * 24 * 60 * 60 * 1000,
        isPaid: tier.price > 0,
      }

      const key = `${buyerAddress}-${videoId}`
      if (!this.accessRecords.has(key)) {
        this.accessRecords.set(key, [])
      }
      this.accessRecords.get(key)!.push(accessRecord)

      console.log('[v0] Payment processed successfully, access granted')
      return transaction
    } catch (error) {
      console.error('[v0] Payment processing error:', error)
      throw error
    }
  }

  /**
   * Verify user has access to video
   */
  async verifyAccess(userId: string, videoId: string): Promise<boolean> {
    try {
      const key = `${userId}-${videoId}`
      const records = this.accessRecords.get(key)

      if (!records || records.length === 0) {
        console.log('[v0] No access record found for user')
        return false
      }

      // Check if any record is still valid
      const now = Date.now()
      const validRecord = records.find((r) => r.expiresAt > now)

      if (validRecord) {
        console.log('[v0] User has valid access to video')
        return true
      }

      console.log('[v0] User access has expired')
      return false
    } catch (error) {
      console.error('[v0] Access verification error:', error)
      return false
    }
  }

  /**
   * Generate secure access token
   */
  private generateAccessToken(userId: string, videoId: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const token = Buffer.from(`${userId}-${videoId}-${timestamp}-${random}`).toString(
      'base64'
    )
    return token
  }

  /**
   * Get pricing tiers
   */
  getPricingTiers(): PricingTier[] {
    return this.pricingTiers
  }

  /**
   * Get pricing tier by ID
   */
  getPricingTier(id: string): PricingTier | undefined {
    return this.pricingTiers.find((t) => t.id === id)
  }

  /**
   * Get transaction details
   */
  getTransaction(txId: string): PaymentTransaction | undefined {
    return this.transactions.get(txId)
  }

  /**
   * Get user's access records for a video
   */
  getAccessRecords(userId: string, videoId: string): AccessRecord[] {
    const key = `${userId}-${videoId}`
    return this.accessRecords.get(key) || []
  }

  /**
   * Refund payment (within grace period)
   */
  async refundPayment(txId: string, reason: string): Promise<boolean> {
    try {
      const transaction = this.transactions.get(txId)
      if (!transaction) {
        throw new Error('Transaction not found')
      }

      // Check if within 7 days
      const daysElapsed = (Date.now() - transaction.timestamp) / (1000 * 60 * 60 * 24)
      if (daysElapsed > 7) {
        throw new Error('Refund period expired (7 days)')
      }

      transaction.status = 'failed'
      console.log('[v0] Refund processed for transaction:', txId, 'Reason:', reason)
      return true
    } catch (error) {
      console.error('[v0] Refund error:', error)
      return false
    }
  }

  /**
   * Calculate revenue share (creator vs platform)
   */
  calculateRevenue(amount: number): { creator: number; platform: number } {
    const platformFee = 0.15 // 15%
    const creatorShare = amount * (1 - platformFee)
    const platformShare = amount * platformFee

    return {
      creator: creatorShare,
      platform: platformShare,
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService()
