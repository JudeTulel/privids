# Private Video Access with ZK Age Verification

This repository contains a Privacy-First Video Platform POC that uses **Alle** and **Zero-Knowledge Proofs (ZKP)** to gate content based on age without revealing user identity.

## 🏗️ Modules

- **`webApp/`**: The Next.js frontend and API.
- **`zk/`**: The Aleo (Leo) circuits for generic ZK logic (Age Verification).
- **`contracts/`**: Smart contracts (if any additional logic is needed).

## 🔐 Key Features

1.  **ZK Age Proofs**: Users prove `Age >= 18` using a signed credential. The platform never learns their DOB.
2.  **Trustless**: Verification happens on-chain (or via client-side proof verified by the protocol).
3.  **Privacy**: No database of user ages. No leaked identities.

## 🚀 Getting Started

See [zk/README.md](./zk/README.md) for detailed ZK setup and architecture.

### 1. Install Dependencies
```bash
cd webApp
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. ZK Setup
Refer to `zk/README.md` to deploy the verification circuit.
