'use client';

import { useState, useCallback } from 'react'
import { generateAgeProof, BirthCredential } from '@/lib/age-verification'

export interface VerificationState {
  isRequired: boolean
  videoRestriction: string
  videoTitle: string
  isVerified: boolean
  isLoading: boolean
}

// Mock credential provider - in a real app, this prompts the user's wallet
const mockCredentialProvider = async (): Promise<BirthCredential> => {
  // Simulate wallet delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    birthTimestamp: Math.floor(Date.now() / 1000) - 631139040, // ~20 years ago
    signature: "sign_mock_signature_of_birth_timestamp",
    issuer: "aleo1_issuer_address_mock"
  };
};

export function useAgeVerification(userAddress: string) {
  const [verificationStates, setVerificationStates] = useState<
    Map<string, boolean>
  >(new Map())

  const checkAgeRequired = useCallback(
    (videoRestriction: string): boolean => {
      // Age verification required for 13+ and 18+ content
      return videoRestriction === '13+' || videoRestriction === '18+'
    },
    []
  )

  const verifyAge = useCallback(
    async (videoId: string, videoRestriction: string): Promise<boolean> => {
      const cacheKey = `${userAddress}-${videoId}`

      // Check if already verified
      if (verificationStates.has(cacheKey)) {
        return verificationStates.get(cacheKey) || false
      }

      console.log('[ZK] Starting verification flow for video:', videoId);

      // Verify age proof
      const threshold =
        videoRestriction === '18+' ? 18 : videoRestriction === '13+' ? 13 : 0

      if (threshold === 0) return true;

      // 1. Generate Proof (Client Side)
      const result = await generateAgeProof(
        threshold,
        videoId,
        userAddress,
        mockCredentialProvider
      );

      if (!result.success || !result.proof) {
        console.error("Proof generation failed:", result.message);
        return false;
      }

      // 2. Submit Proof to Chain (Mocked for now)
      // In production: await wallet.submitTransaction('verify_age', ...inputs)
      console.log("Submitting proof to Aleo chain...", result.proof);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate chain time

      const isVerified = true; // Assume chain verification passed

      // Update cache
      setVerificationStates((prev) => {
        const next = new Map(prev)
        next.set(cacheKey, isVerified)
        return next
      })

      return isVerified
    },
    [userAddress, verificationStates]
  )

  const clearVerification = useCallback((videoId: string) => {
    const cacheKey = `${userAddress}-${videoId}`
    setVerificationStates((prev) => {
      const next = new Map(prev)
      next.delete(cacheKey)
      return next
    })
  }, [userAddress])

  const isVerified = useCallback(
    (videoId: string): boolean => {
      const cacheKey = `${userAddress}-${videoId}`
      return verificationStates.get(cacheKey) || false
    },
    [userAddress, verificationStates]
  )

  return {
    checkAgeRequired,
    verifyAge,
    clearVerification,
    isVerified,
  }
}
