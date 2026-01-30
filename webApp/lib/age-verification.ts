import { Provable } from '@provable/sdk'

export interface AgeProof {
  proof: string                 // ZK proof bytes
  publicInputs: {
    threshold: number
    nullifier: string
    currentTimestamp: number
  }
}

export interface AgeVerificationRequest {
  ageThreshold: number
  videoId: string
}

export interface VerificationResult {
  success: boolean
  proof?: AgeProof
  message: string
  timestamp: number
}

// Credential interface (loaded from wallet)
export interface BirthCredential {
  birthTimestamp: number
  signature: string
  issuer: string
}

/**
 * Real ZK Age Proof Generation
 * This runs client-side in the browser
 */
export async function generateAgeProof(
  threshold: number,
  videoId: string,
  walletAddress: string,
  credentialProvider: () => Promise<BirthCredential>
): Promise<VerificationResult> {
  try {
    console.log('[ZK] Generating real age proof...')

    // 1. Get credential (user must unlock wallet/decrypt credential)
    const credential = await credentialProvider()

    // 2. Prepare inputs
    const now = Math.floor(Date.now() / 1000)
    // Create a unique nullifier for this video + user combination
    // In a real app, this should be a Poseidon hash of the secret + scope
    const nullifierInput = walletAddress + videoId

    // 3. Generate Proof using Provable/Aleo SDK
    // Note: The program name matches our deployed circuit
    const proof = await Provable.prove({
      program: 'age_verifier.aleo',
      inputs: {
        birth_timestamp: credential.birthTimestamp,
        issuer_signature: credential.signature,
        issuer_pubkey: credential.issuer,
        threshold,
        current_timestamp: now,
        nullifier: hash(nullifierInput)
      }
    })

    console.log('[ZK] Proof generated successfully')

    return {
      success: true,
      proof: {
        proof: proof.bytes, // The serialized proof
        publicInputs: {
          threshold,
          nullifier: proof.public.nullifier,
          currentTimestamp: now
        }
      },
      message: 'ZK Age Proof generated',
      timestamp: now,
    }

  } catch (error) {
    console.error('[ZK] Proof generation failed:', error)
    return {
      success: false,
      message: 'Failed to generate ZK proof: ' + (error as Error).message,
      timestamp: Date.now()
    }
  }
}

// Mock hash function helper - in prod use actual Poseidon/Pedersen
function hash(input: string): string {
  // Check if we have a crypto lib available, otherwise mock for interface
  // This would typically be Provable.hash() or similar
  return "hash_" + input;
}

// Mock credential provider - in a real app, this prompts the user's wallet
export const mockCredentialProvider = async (): Promise<BirthCredential> => {
  // Simulate wallet delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    birthTimestamp: Math.floor(Date.now() / 1000) - 631139040, // ~20 years ago
    signature: "sign_mock_signature_of_birth_timestamp",
    issuer: "aleo1_issuer_address_mock"
  };
};

// Export age categories
export const AGE_CATEGORIES = {
  G: { label: 'General Audiences', threshold: 0 },
  PG: { label: 'Parental Guidance', threshold: 0 },
  '13+': { label: 'Ages 13+', threshold: 13 },
  '18+': { label: 'Ages 18+', threshold: 18 },
} as const
