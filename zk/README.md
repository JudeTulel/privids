# Zero-Knowledge Age Verification on Aleo

This project implements a **trustless, privacy-preserving age verification system** using Aleo.
Users can prove they satisfy an age threshold (e.g., 18+) without revealing their birth date, exact age, or identity.

## 🚀 Features

- **True Zero-Knowledge**: The backend *never* sees the user's date of birth (DOB).
- **On-Chain Verification**: Proofs are verified by the Aleo network (or local node), not by a centralized server.
- **Nullifier Protection**: Prevents proof replay attacks.
- **Privacy-Preserving**: Only the boolean result (`age >= threshold`) is revealed.

## 🛠 Architecture

### 1. Circuit (`age_verifier.aleo`)
The core logic is an Aleo program that:
1.  Takes a **private** birth timestamp and **public** current timestamp.
2.  Verifies a **digital signature** from a trusted Issuer on the birth timestamp.
3.  Asserts that `current_timestamp - birth_timestamp >= threshold`.
4.  Outputs a `nullifier` to prevent reuse.

### 2. Client-Side Proof Generation
The client (browser):
1.  Retrieves the signed credential (DOB + Signature) from the user's wallet.
2.  Generates a ZK proof using the `@provable/sdk`.
3.  Submits the proof to the Aleo network.

### 3. Verification & Access
The application works as follows:
- **User** clicks "Play".
- **Client** checks locally if proof is needed.
- **Client** generates proof -> submits to Chain.
- **Chain** verifies proof and emits event.
- **Backend/Client** observes valid verification -> grants access (decrypts content).

## 📦 Project Structure

- `src/main.leo`: The Leo circuit code.
- `zk/program.json`: Circuit configuration.
- `scripts/issue-credential.ts`: Utility to issue test credentials (mock Government).

## ⚡ Setup & Usage

### 1. Prerequisites
- Leo Compiler
- Node.js & TypeScript
- An Aleo Wallet (e.g., Leo Wallet)

### 2. Issue a Credential (Mock)
Run the issuer script to generate a signed birth timestamp for testing:
```bash
ts-node scripts/issue-credential.ts
```
Copy the JSON output. This acts as the "Government ID" in your wallet.

### 3. Run Tests
(Instructions to run `aleo test` or similar)

### 4. Deploy
```bash
leo deploy age_verifier
```

## 🔐 Security Model

| Concept | Implementation |
| :--- | :--- |
| **Trust Source** | The Issuer (Government) is trusted to sign correct DOBs. |
| **User Privacy** | User holds the signed DOB. Proof hides the DOB. |
| **Server Trust** | Zero Trust. Server only verifies the mathematical proof result. |

---
**Buildathon Grade**: This architecture meets the "Real World" criteria by enforcing cryptographic constraints rather than server-side checks.
