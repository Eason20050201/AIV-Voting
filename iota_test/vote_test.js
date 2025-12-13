const { IotaClient } = require('@iota/iota-sdk/client');
const crypto = require('crypto');
const { Transaction } = require('@iota/iota-sdk/transactions');
const { Ed25519Keypair } = require('@iota/iota-sdk/keypairs/ed25519');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = 'test_config.json';

async function runTest() {
    console.log('--- Starting Encrypted Voting Test ---');

    // 1. Load Config
    if (!fs.existsSync(CONFIG_FILE)) {
        throw new Error(`Config file ${CONFIG_FILE} not found. Run "node setup_env.js" first or create it manually.`);
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

    // Validate Config
    if (!config.PACKAGE_ID || !config.ADMIN_SecretKey || !config.VOTER_SecretKey || !config.EA_PrivateKey_PEM) {
        throw new Error('Config file is incomplete. Please check TEST_CONFIG.json. ADMIN_SecretKey is now required.');
    }

    // Init Client
    const client = new IotaClient({ url: config.NODE_URL });
    console.log(`Connected to ${config.NODE_URL}`);

    // Init Voter
    const voterKeypair = Ed25519Keypair.fromSecretKey(config.VOTER_SecretKey);
    const voterAddress = voterKeypair.toIotaAddress();
    console.log(`Voter Address: ${voterAddress}`);

    // Init EA (Load X25519 Keys)
    const eaKeypair = Ed25519Keypair.fromSecretKey(config.ADMIN_SecretKey);
    const eaAddress = eaKeypair.toIotaAddress();

    // EA Encryption Key
    if (!config.EA_PrivateKey_X25519 || !config.EA_PublicKey_X25519) {
        throw new Error('Config missing EA X25519 keys. Run setup_env.js again.');
    }
    const eaSecretKey = new Uint8Array(Buffer.from(config.EA_PrivateKey_X25519, 'base64'));
    const eaPublicKey = new Uint8Array(Buffer.from(config.EA_PublicKey_X25519, 'base64'));

    console.log(`EA Address: ${eaAddress}`);

    // Check Voter Balance
    const balance = await client.getBalance({ owner: voterAddress });
    console.log(`Voter Balance: ${balance.totalBalance}`);
    if (balance.totalBalance == 0) {
        console.warn('WARNING: Voter has 0 balance. Transaction will likely fail.');
    }

    // --- Phase 1: EA Creates Vote Event ---
    console.log('\n--- Phase 1: EA Creates Vote Event ---');
    let voteEventId;

    {
        const tx = new Transaction();
        const [ve] = tx.moveCall({
            target: `${config.PACKAGE_ID}::vote_event::create_vote_event`,
            arguments: []
        });

        console.log('EA submitting Create Vote Event transaction...');
        const result = await client.signAndExecuteTransaction({
            signer: eaKeypair,
            transaction: tx,
            options: { showEffects: true, showObjectChanges: true }
        });

        if (result.effects.status.status !== 'success') {
            throw new Error(`EA Failed to create vote event: ${result.effects.status.error}`);
        }

        const created = result.objectChanges.find(c => c.type === 'created' && c.objectType.includes('VoteEvent'));
        if (!created) {
            throw new Error('VoteEvent object creation not found in transaction results.');
        }
        voteEventId = created.objectId;
        console.log(`VoteEvent Created with ID: ${voteEventId}`);

        // Add Vote Info (New Feature)
        const eventName = 'Annual Tech Vote';
        const eventDesc = 'Vote for the best tech of 2024';
        console.log(`EA adding vote info...`);
        console.log(`   -> Name: ${eventName}`);
        console.log(`   -> Desc: ${eventDesc}`);

        const txInfo = new Transaction();
        txInfo.moveCall({
            target: `${config.PACKAGE_ID}::vote_event::add_vote_info`,
            arguments: [
                txInfo.object(voteEventId),
                txInfo.pure.vector('u8', Array.from(Buffer.from(eventName, 'utf8'))),
                txInfo.pure.vector('u8', Array.from(Buffer.from(eventDesc, 'utf8')))
            ]
        });
        await client.signAndExecuteTransaction({
            signer: eaKeypair,
            transaction: txInfo
        });

        // Add Candidates
        console.log('EA adding candidates...');
        const candidates = ['Alice', 'Bob'];
        for (const name of candidates) {
            const tx2 = new Transaction();
            tx2.moveCall({
                target: `${config.PACKAGE_ID}::vote_event::add_candidate`,
                arguments: [
                    tx2.object(voteEventId),
                    tx2.pure.vector('u8', Array.from(Buffer.from(name, 'utf8'))) // vector<u8> explicitly typed often safer
                ]
            });
            await client.signAndExecuteTransaction({
                signer: eaKeypair,
                transaction: tx2
            });
            console.log(`   + Candidate added: ${name}`);
        }
    }

    // --- Phase 2: Registration (Simulation) ---
    console.log('\n--- Phase 2: Registration ---');
    // Simulate: Voter sends blinded address -> EA signs it -> Voter unblinds
    // We mock this by having EA sign the address string with their Ed25519 key (or another key).
    // Let's use the EA's IOTA Keypair for signing (Ed25519) as "Eligibility Token".
    // Note: This is simpler than RSA blind signatures.
    const msgBytes = new TextEncoder().encode(voterAddress);
    const { signature } = await eaKeypair.signPersonalMessage(msgBytes); // Returns { bytes, signature }
    const S = signature; // Uint8Array
    console.log(`EA Signed Voter Address (S): ${Buffer.from(S).toString('hex').substring(0, 20)}...`);

    // --- Phase 3: Voting ---
    console.log('\n--- Phase 3: Voting ---');

    // 3.1 Prepare Plaintext Vote
    const votePlaintext = JSON.stringify({
        candidate_id: 0,
        candidate_name: 'Alice',
        nonce: crypto.randomUUID()
    });
    console.log(`[TEST] Plaintext Vote Content: ${votePlaintext}`);

    // 3.2 Encrypt Vote (X25519)
    // Voter generates ephemeral key pair for encryption
    const ephemeralKeyPair = nacl.box.keyPair();
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const msgUint8 = naclUtil.decodeUTF8(votePlaintext);

    // Encrypt: box(msg, nonce, receiverPK, senderSK)
    const ciphertext = nacl.box(msgUint8, nonce, eaPublicKey, ephemeralKeyPair.secretKey);

    // Pack: [EphemeralPK (32)] + [Nonce (24)] + [Ciphertext]
    const packedVote = new Uint8Array(ephemeralKeyPair.publicKey.length + nonce.length + ciphertext.length);
    packedVote.set(ephemeralKeyPair.publicKey, 0);
    packedVote.set(nonce, ephemeralKeyPair.publicKey.length);
    packedVote.set(ciphertext, ephemeralKeyPair.publicKey.length + nonce.length);

    console.log(`[TEST] Encrypted Vote Blob (len=${packedVote.length})`);

    const tx = new Transaction();
    tx.moveCall({
        target: `${config.PACKAGE_ID}::vote_event::vote`,
        arguments: [
            tx.object(voteEventId),
            tx.pure.vector('u8', Array.from(packedVote)),
            tx.pure.vector('u8', Array.from(S))
        ]
    });

    console.log('Voter submitting Vote transaction...');
    const result = await client.signAndExecuteTransaction({
        signer: voterKeypair,
        transaction: tx,
        options: {
            showEffects: true,
            showEvents: true,
        }
    });

    if (result.effects.status.status === 'success') {
        console.log('Vote cast successfully!');
        console.log('Digest:', result.digest);
    } else {
        console.error('Vote failed:', result.effects.status.error);
    }

    // --- Phase 4: Verification ---
    console.log('\n--- Phase 4: Verification ---');
    console.log(`Checking VoteEvent: ${voteEventId}`);

    const objectData = await client.getObject({
        id: voteEventId,
        options: { showContent: true }
    });

    if (objectData.data && objectData.data.content) {
        const fields = objectData.data.content.fields;

        // Verify Event Info
        if (fields.event_name) {
            console.log(`Event Name: ${Buffer.from(fields.event_name).toString('utf8')}`);
        }
        if (fields.event_desc) {
            console.log(`Event Desc: ${Buffer.from(fields.event_desc).toString('utf8')}`);
        }

        const votes = fields.votes;
        console.log(`Total Votes found on chain: ${votes.length}`);

        if (votes.length > 0) {
            let foundMyVote = false;
            for (let i = 0; i < votes.length; i++) {
                const vote = votes[i];
                // Handle nested fields if necessary
                const encryptedContentArray = vote.fields ? vote.fields.encrypted_vote : vote.encrypted_vote;
                const encryptedContent = new Uint8Array(encryptedContentArray);

                try {
                    // Unpack: [EphemeralPK (32)] + [Nonce (24)] + [Ciphertext]
                    const pkLen = nacl.box.publicKeyLength;
                    const nonceLen = nacl.box.nonceLength;

                    if (encryptedContent.length < pkLen + nonceLen) continue;

                    const senderEphemPK = encryptedContent.slice(0, pkLen);
                    const msgNonce = encryptedContent.slice(pkLen, pkLen + nonceLen);
                    const msgCipher = encryptedContent.slice(pkLen + nonceLen);

                    // Decrypt: box.open(cipher, nonce, senderPK, receiverSK)
                    const decryptedBytes = nacl.box.open(msgCipher, msgNonce, senderEphemPK, eaSecretKey);

                    if (!decryptedBytes) {
                        // Decryption failed (null)
                        throw new Error('Decryption returned null');
                    }

                    const decrypted = naclUtil.encodeUTF8(decryptedBytes);

                    console.log(`Vote #${i} Decrypted: ${decrypted}`);
                    if (decrypted === votePlaintext) {
                        console.log('   -> MATCH: This is our vote!');
                        foundMyVote = true;
                    }
                } catch (e) {
                    console.log(`Vote #${i} Decryption Skipped/Failed: ${e.message}`);
                }
            }

            if (foundMyVote) {
                console.log('SUCCESS: Flow verified.');
            } else {
                console.error('FAIL: Our vote was not found in the decryption check.');
            }

        }
    }
}

runTest().catch(console.error);
