# 🚀 Deployment Guide

## Quick Reference

**Program ID:** `prividocs_v1.aleo`  
**Payment Token:** `credits.aleo` (testnet) → `usad.aleo` (production)  
**Network:** Testnet → Mainnet  

---

## 📋 Pre-Deployment Checklist

### 1. **Update Platform Address**

Edit `contracts/prividocs/src/main.leo` line 18:
```leo
const PLATFORM_ADDRESS: address = aleo1your_actual_address_here;
```

### 2. **Configure Environment Variables**

Edit `webApp/.env.local`:
```bash
# Your deployed contract address
NEXT_PUBLIC_PROGRAM_ID=prividocs_v1.aleo

# Network
NEXT_PUBLIC_NETWORK=testnet  # Change to 'mainnet' for production

# Payment token
NEXT_PUBLIC_PAYMENT_TOKEN=credits.aleo  # Change to 'usad.aleo' for production

# Your platform wallet (receives 2% fee)
NEXT_PUBLIC_PLATFORM_ADDRESS=aleo1your_address_here

# Pinata IPFS
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud

# Access Node
NEXT_PUBLIC_ACCESS_NODE_URL=http://localhost:3001
```

---

## 🛠️ Testnet Deployment

### Step 1: Build Contract

```bash
cd contracts/prividocs
leo build
```

### Step 2: Get Testnet Credits

Visit: https://faucet.aleo.org

Enter your Aleo address to receive free testnet credits.

### Step 3: Deploy to Testnet

```bash
# Using snarkOS CLI
snarkos developer deploy \
    --private-key YOUR_PRIVATE_KEY \
    --query https://api.explorer.aleo.org/v1 \
    --path ./build \
    --broadcast https://api.explorer.aleo.org/v1/testnet/transaction/broadcast \
    --fee 1000000 \
    --record RECORD_STRING
```

**Note:** Replace:
- `YOUR_PRIVATE_KEY` - Your Aleo private key
- `RECORD_STRING` - A credits record with enough balance

### Step 4: Verify Deployment

Check on Aleo Explorer:
https://explorer.aleo.org/program/prividocs_v1.aleo

### Step 5: Test Upload

1. Start your Next.js app: `npm run dev`
2. Connect your wallet
3. Upload a test video
4. Verify chunks uploaded to IPFS
5. Check transaction on explorer

---

## 🌐 Mainnet Deployment (Production)

### Prerequisites

- [ ] Tested thoroughly on testnet
- [ ] USAD token is available (or decide to use credits)
- [ ] Platform address is secure
- [ ] Access Node is production-ready
- [ ] All environment variables configured

### Step 1: Update Contract for USAD (if available)

```leo
// Change in main.leo
import credits.aleo;  // ❌ Remove

// To:
import usad.aleo;     // ✅ Add

// Update all references:
credits.aleo/credits.record → usad.aleo/usad.record
credits.aleo/transfer_private → usad.aleo/transfer_private
```

### Step 2: Update Program Version (Optional)

```json
// program.json
{
  "program": "prividocs_v2.aleo",  // New version for mainnet
  "version": "1.0.0"
}
```

### Step 3: Build for Mainnet

```bash
cd contracts/prividocs
leo build
```

### Step 4: Deploy to Mainnet

```bash
snarkos developer deploy \
    --private-key YOUR_MAINNET_PRIVATE_KEY \
    --query https://api.explorer.aleo.org/v1 \
    --path ./build \
    --broadcast https://api.explorer.aleo.org/v1/mainnet/transaction/broadcast \
    --fee 5000000 \
    --record MAINNET_RECORD_STRING
```

### Step 5: Update Frontend

```bash
# .env.local
NEXT_PUBLIC_PROGRAM_ID=prividocs_v2.aleo
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_PAYMENT_TOKEN=usad.aleo
NEXT_PUBLIC_PLATFORM_ADDRESS=aleo1your_secure_mainnet_address
```

### Step 6: Deploy Frontend

```bash
# Build production bundle
npm run build

# Deploy to Vercel/Netlify/etc
vercel deploy --prod
```

---

## 🔐 Security Checklist

- [ ] Platform address is from a secure hardware wallet
- [ ] Private keys never committed to git
- [ ] `.env.local` is in `.gitignore`
- [ ] Access Node is using HTTPS
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Encryption keys stored securely

---

## 📊 Monitoring

### Track Platform Fees

Query the blockchain:
```bash
# Get total fees collected
snarkos developer execute \
    --query https://api.explorer.aleo.org/v1 \
    prividocs_v1.aleo \
    get_total_fees
```

### Monitor Transactions

- **Testnet Explorer:** https://explorer.aleo.org/?network=testnet
- **Mainnet Explorer:** https://explorer.aleo.org/?network=mainnet

---

## 🐛 Troubleshooting

### "Program already exists"

The program ID is already taken. Options:
1. Use a different name (e.g., `prividocs_v2.aleo`)
2. If you own it, use the existing deployment

### "Insufficient balance"

You need more credits/USAD:
- **Testnet:** Get from faucet
- **Mainnet:** Purchase credits or USAD

### "Transaction failed"

Check:
- [ ] Correct network (testnet vs mainnet)
- [ ] Valid record string
- [ ] Sufficient fee
- [ ] Contract compiles without errors

---

## 📚 Resources

- **Aleo Docs:** https://developer.aleo.org
- **Leo Guide:** https://developer.aleo.org/leo
- **snarkOS CLI:** https://developer.aleo.org/testnet/getting_started/deploy_execute
- **Explorer:** https://explorer.aleo.org
- **Faucet:** https://faucet.aleo.org

---

## ✅ Post-Deployment

After successful deployment:

1. ✅ Save your program ID
2. ✅ Document your platform address
3. ✅ Test all features end-to-end
4. ✅ Monitor first transactions
5. ✅ Set up analytics/monitoring
6. ✅ Prepare user documentation

---

## 🎯 Summary

**For Testnet (Now):**
```bash
Program ID: prividocs_v1.aleo
Token: credits.aleo
Network: testnet
Cost: Free (faucet)
```

**For Mainnet (Later):**
```bash
Program ID: prividocs_v2.aleo (or v1)
Token: usad.aleo (or credits.aleo)
Network: mainnet
Cost: Real money
```

Good luck with your deployment! 🚀
