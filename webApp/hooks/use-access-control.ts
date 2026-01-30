'use client'

import { useState, useCallback } from 'react'
import { paymentService } from '@/lib/payment-service'

export interface AccessState {
  hasAccess: boolean
  isPaid: boolean
  accessExpiresAt: number | null
  accessTier: string | null
}

export function useAccessControl(userAddress: string) {
  const [accessState, setAccessState] = useState<Map<string, AccessState>>(
    new Map()
  )
  const [isCheckingAccess, setIsCheckingAccess] = useState(false)

  const checkAccess = useCallback(
    async (videoId: string): Promise<AccessState> => {
      const cacheKey = videoId

      // Return cached result if available
      if (accessState.has(cacheKey)) {
        const state = accessState.get(cacheKey)!
        if (state.accessExpiresAt && state.accessExpiresAt > Date.now()) {
          console.log('[v0] Using cached access state for video:', videoId)
          return state
        }
      }

      setIsCheckingAccess(true)

      try {
        const hasAccess = await paymentService.verifyAccess(userAddress, videoId)
        const records = paymentService.getAccessRecords(userAddress, videoId)

        let state: AccessState = {
          hasAccess: hasAccess || false,
          isPaid: false,
          accessExpiresAt: null,
          accessTier: null,
        }

        if (records.length > 0) {
          const latestRecord = records[records.length - 1]
          state = {
            hasAccess: latestRecord.expiresAt > Date.now(),
            isPaid: latestRecord.isPaid,
            accessExpiresAt: latestRecord.expiresAt,
            accessTier: latestRecord.userId ? 'premium' : 'free',
          }
        }

        // Cache the state
        setAccessState((prev) => {
          const next = new Map(prev)
          next.set(cacheKey, state)
          return next
        })

        console.log('[v0] Access checked for video:', videoId, state)
        return state
      } catch (error) {
        console.error('[v0] Access check error:', error)
        return {
          hasAccess: false,
          isPaid: false,
          accessExpiresAt: null,
          accessTier: null,
        }
      } finally {
        setIsCheckingAccess(false)
      }
    },
    [userAddress, accessState]
  )

  const grantAccess = useCallback(
    (videoId: string, tier: string, expiresAt: number) => {
      setAccessState((prev) => {
        const next = new Map(prev)
        next.set(videoId, {
          hasAccess: true,
          isPaid: tier !== 'free',
          accessExpiresAt: expiresAt,
          accessTier: tier,
        })
        return next
      })

      console.log('[v0] Access granted for video:', videoId, 'tier:', tier)
    },
    []
  )

  const revokeAccess = useCallback((videoId: string) => {
    setAccessState((prev) => {
      const next = new Map(prev)
      next.delete(videoId)
      return next
    })

    console.log('[v0] Access revoked for video:', videoId)
  }, [])

  const getAccessState = useCallback(
    (videoId: string): AccessState | null => {
      const state = accessState.get(videoId)
      if (!state) return null

      // Check if expired
      if (state.accessExpiresAt && state.accessExpiresAt <= Date.now()) {
        revokeAccess(videoId)
        return null
      }

      return state
    },
    [accessState, revokeAccess]
  )

  const formatTimeRemaining = useCallback((expiresAt: number | null): string => {
    if (!expiresAt) return 'No access'

    const timeRemaining = expiresAt - Date.now()
    if (timeRemaining <= 0) return 'Expired'

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor(
      (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    )

    if (days > 0) return `${days}d ${hours}h remaining`
    if (hours > 0) return `${hours}h remaining`

    const minutes = Math.floor(
      (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
    )
    return `${minutes}m remaining`
  }, [])

  return {
    checkAccess,
    grantAccess,
    revokeAccess,
    getAccessState,
    formatTimeRemaining,
    isCheckingAccess,
  }
}
