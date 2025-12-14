# IOTA Encrypted Voting Verification System

This directory contains the Move smart contracts and Node.js scripts to simulate and verify the IOTA-based encrypted voting system.

## 📋 Prerequisites

- **Node.js** (v18+)
- **IOTA CLI** (installed and added to PATH)
- **Localnet** running (started via `iota start`) or access to IOTA Testnet.

## 🚀 Setup Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Environment
Run the setup script to generate keys and create your configuration file.
> **Note**: This script will automatically check for a shared Package ID (from `test_config.example.json`). If found, it uses that contract directly without redeploying. It effectively generates a personal `test_config.json` for you.

```bash
node setup_env.js
```

### 3. Fund Your Wallet (Important!)
After running `setup_env.js`, it will print the generated addresses for the **Admin (EA)** and **Voter** to the console. It attempts to auto-fund via the local faucet, but if you are on Testnet or if auto-funding fails, **you must manualy fund these addresses**.

- Check `test_config.json` or the console output for the addresses.
- Use the [IOTA Testnet Faucet](https://faucet.testnet.iota.cafe/) or a wallet to send ~1 IOTA to both the `ADMIN` and `VOTER` addresses.

---

## 🧪 Running Tests

### Option A: Full Integration Test
Run the comprehensive test that orchestrates the entire flow:
1.  EA creates a `VoteEvent`.
2.  EA registers a Voter (Blind Signature).
3.  Voter casts an encrypted vote.
4.  EA scans the chain, verifies the signature, and tallies the vote.

```bash
node vote_test.js
```
*Output will show the Vote Event ID, Transaction Digest, and final Election Results.*

### Option B: Modular Testing (Standalone)
You can test individual actions using the modular scripts. This is useful for simulating multiple voters.

#### 1. Vote Step
Cast a vote for a specific candidate.
- **Usage**: `node voting.js <vote_event_id> <candidate_id>`
- The script uses the `VOTER_SecretKey` from `test_config.json`.

```bash
# Example: Vote for Candidate 1 on Event 0x123...
node voting.js 0x123... 1
```

#### 2. Tally Step
Scan the blockchain to count all valid ballots for a specific event.
- **Usage**: `node tally.js <vote_event_id>`
- The script uses the `ADMIN_SecretKey` (EA) to verify signatures and decrypt votes.

```bash
# Example: Tally votes for Event 0x123...
node tally.js 0x123...
```

---

## wd Architecture Overview

The system operates in 4 phases:

1.  **Creation**: Admin creates a `VoteEvent` shared object on-chain.
2.  **Registration**: Voter authenticates off-chain. Admin signs the Voter's address (Eligibility Token `S`).
3.  **Voting**:
    - Voter encrypts their choice `c` using X25519.
    - Voter submits `c` and `S` to the Move contract.
4.  **Tallying (Off-chain Indexer)**:
    - The Tally script scans transaction history.
    - Verifies `S` against the Sender's address using the Admin's Public Key.
    - Decrypts `c` using the Admin's Private Key.
    - Aggregates valid votes.
