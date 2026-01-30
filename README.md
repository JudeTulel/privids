# PriviDocs: Confidential Media Infrastructure

> **The Problem:** We live in an era of surveillance and censorship. Traditional platforms (YouTube, Vimeo) and even transparent blockchains (Ethereum) leave creators and viewers vulnerable. They track every view, expose payment histories, and can deplatform sensitive content at the flip of a switch.

**PriviDocs** changes the paradigm. We are building the infrastructure for confidential media. Whether it's independent journalism, medical education, or premium entertainment, PriviDocs uses **Aleo’s zero-knowledge architecture** to ensure that what you watch, how you pay, and who you are remain mathematically private. 

We don't just "hide" the data; we eliminate the need for the platform to see it.

---

## 1. The Vision: Why Privacy? Why Now?

PriviDocs is a decentralized, client-side video protocol where access rights are cryptographically enforced but completely private.

-   **For Viewers:** Access sensitive or paywalled content without generating a digital footprint. Your "subscription" is a private record in your wallet, not a row in a database.
-   **For Creators:** Monetize globally in **USAD** (Aleo Stablecoin) without platform fees, censorship risk, or leaking your subscriber list.
-   **For Society:** Enable true whistleblowing and secure journalism where the viewer's identity is protected by math, not policy.

## 2. Why Aleo? (The Unfair Advantage)

PriviDocs cannot exist on any other blockchain.

-   **On Ethereum/Solana:** Every purchase links a specific wallet to specific content. If you watch a controversial documentary or adult content, the entire world knows.
-   **On Web2:** The platform owns your data, tracks your retention, and sells your profile.

### Aleo’s Unique Features Enable:

1.  **Private Access Records:** We use Aleo’s Record Model to mint a `ViewerCard`. This record sits in the user's wallet. The user proves they own it to unlock the documentary, but the network never sees *which* specific user is unlocking it.
2.  **Off-Chain Decryption:** Video decryption runs client-side. The decryption keys are released only after a Zero-Knowledge proof of access is verified.
3.  **ZK Age-Gating:** Users can turn on age verification to prove they are over 18 (for mature or sensitive content) without ever uploading an ID or revealing their birthdate.

## 3. Core Features (MVP)

-   ✅ **USAD-Only Economy:** Stable, predictable pricing for content access.
-   ✅ **Encrypted IPFS Storage:** Content is encrypted at the source; only the decentralized network holds the bits.
-   ✅ **Access Node:** A lightweight Node.js server that manages key exchange, verifying ZK proofs before releasing decryption keys.
-   ✅ **Zero-Knowledge Age Verification:** Client-side proof generation using `@aleohq/sdk`.

---

## 🚀 Getting Started

### Prerequisites
-   Node.js v18+
-   Aleo Wallet (e.g., Leo Wallet) installed in browser.

### 1. Install Dependencies
```bash
# Install Web App dependencies
cd webApp
npm install

# Install Access Node dependencies
cd ../access-node
npm install
```

### 2. Run the Access Node
The Access Node handles the encrypted key storage and retrieval.
```bash
cd access-node
npm run start
# (Ensure keys.json is writable)
```

### 3. Run the Frontend
```bash
cd webApp
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.