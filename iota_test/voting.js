const { IotaClient } = require('@iota/iota-sdk/client');
const crypto = require('crypto');
const { Transaction } = require('@iota/iota-sdk/transactions');
const { Ed25519Keypair } = require('@iota/iota-sdk/keypairs/ed25519');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const fs = require('fs');

const CONFIG_FILE = 'test_config.json';

async function vote(voteEventId, candidateId) {
    console.log(`--- Starting Voting Process for Event: ${voteEventId} ---`);

    // 1. Load Config
    if (!fs.existsSync(CONFIG_FILE)) {
        throw new Error(`Config file ${CONFIG_FILE} not found.`);
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

    // Init Client
    const client = new IotaClient({ url: config.NODE_URL });

    // Init Voter
    const voterKeypair = Ed25519Keypair.fromSecretKey(config.VOTER_SecretKey);
    const voterAddress = voterKeypair.toIotaAddress();
    console.log(`Voter Address: ${voterAddress}`);

    // EA Public Key for Encryption
    const eaPublicKey = new Uint8Array(Buffer.from(config.EA_PublicKey_X25519, 'base64'));

    // --- Phase 2: Registration (Offline/Mock) ---
    // Simulate: Get Blind Signature S from EA (using EA's signing key from config just for this test script to work standalone)
    // In real app, this comes from backend API. here we simulate acquiring it.
    const eaKeypair = Ed25519Keypair.fromSecretKey(config.ADMIN_SecretKey);
    const msgBytes = new TextEncoder().encode(voterAddress);
    const { signature } = await eaKeypair.signPersonalMessage(msgBytes);
    const S = typeof signature === 'string' ? new Uint8Array(Buffer.from(signature, 'base64')) : signature;
    console.log(`Acquired Eligibility Sig (S): ${Buffer.from(S).toString('hex').substring(0, 20)}...`);

    // --- Phase 3: Voting ---

    // 3.1 Prepare Vote
    const votePlaintext = JSON.stringify({
        candidate_id: parseInt(candidateId),
        nonce: crypto.randomUUID()
    });
    console.log(`Vote Content: ${votePlaintext}`);

    // 3.2 Encrypt Vote
    const ephemeralKeyPair = nacl.box.keyPair();
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const msgUint8 = naclUtil.decodeUTF8(votePlaintext);
    const ciphertext = nacl.box(msgUint8, nonce, eaPublicKey, ephemeralKeyPair.secretKey);

    // Pack: [EphemeralPK (32)] + [Nonce (24)] + [Ciphertext]
    const packedVote = new Uint8Array(ephemeralKeyPair.publicKey.length + nonce.length + ciphertext.length);
    packedVote.set(ephemeralKeyPair.publicKey, 0);
    packedVote.set(nonce, ephemeralKeyPair.publicKey.length);
    packedVote.set(ciphertext, ephemeralKeyPair.publicKey.length + nonce.length);

    console.log(`Encrypted Vote Blob Size: ${packedVote.length}`);

    // 3.3 Submit
    const tx = new Transaction();
    tx.moveCall({
        target: `${config.PACKAGE_ID}::vote_event::vote`,
        arguments: [
            tx.object(voteEventId),
            tx.pure.vector('u8', Array.from(packedVote)),
            tx.pure.vector('u8', Array.from(S))
        ]
    });

    console.log('Submitting Vote transaction...');
    const result = await client.signAndExecuteTransaction({
        signer: voterKeypair,
        transaction: tx,
        options: { showEffects: true }
    });

    if (result.effects.status.status === 'success') {
        console.log('✅ Vote cast successfully!');
        console.log('Digest:', result.digest);
    } else {
        console.error('❌ Vote failed:', result.effects.status.error);
    }
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Usage: node voting.js <vote_event_id> <candidate_id>");
    console.log("Example: node voting.js 0x123... 1");
    process.exit(1);
}

vote(args[0], args[1]).catch(console.error);
