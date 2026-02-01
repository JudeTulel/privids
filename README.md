# PriviDocs: Confidential Media Infrastructure

> **The Problem:** We live in an era of surveillance and censorship. Traditional platforms (YouTube, Vimeo) and even transparent blockchains (Ethereum) leave creators and viewers vulnerable. They track every view, expose payment histories, and can deplatform sensitive content at the flip of a switch.

**PriviDocs** changes the paradigm. We are building the infrastructure for confidential media. Whether it's independent journalism, medical education, or premium entertainment, PriviDocs uses **Aleo’s zero-knowledge architecture** to ensure that what you watch, how you pay, and who you are remain mathematically private. 

We don't just "hide" the data; we eliminate the need for the platform to see it.

---

## Why PriviDocs?

### The Problem: The Algorithm is Eating Culture.
Web2 video platforms are built on **surveillance capitalism**. Because they rely on ad revenue, their algorithms prioritize "engagement" above all else. This creates a race to the bottom:

1.  **The Volume Trap:** With payouts as low as $0.001 per view, creators are forced to churn out daily, low-effort content just to survive.
2.  **The AI Sludge:** To feed the algorithm's hunger for volume, the internet is now flooding with low-quality, AI-generated "slop."
3.  **The Privacy Cost:** Viewers pay with their data, having their psychological profiles sold to the highest bidder while being trapped in echo chambers.

### The Solution: Value Over Views.
PriviDocs restores sanity to digital media by shifting the incentive structure from **Attention** to **Intention**.

### How PriviDocs Creates Better Content
By leveraging Aleo’s privacy-preserving architecture, we change *why* content is made:

#### 1. The "Direct-to-Wallet" Quality Shift
*   **Web2 Model:** Creator makes clickbait $\rightarrow$ You click $\rightarrow$ Advertiser pays Platform $\rightarrow$ Platform pays Creator crumbs.
*   **PriviDocs Model:** Creator makes something valuable $\rightarrow$ You pay Creator directly (USAD).

**The Result:** When a creator relies on payments rather than clicks, they stop optimizing for the algorithm and start optimizing for the human. One deep, investigative documentary sold for **1 USAD** is worth more than **10,000 views** on YouTube. This funds real journalism and high-effort art.

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