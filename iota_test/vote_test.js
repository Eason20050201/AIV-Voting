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
    if (!config.PACKAGE_ID || !config.ADMIN_SecretKey || !config.VOTER_SecretKey) {
        throw new Error('Config file is incomplete. Please check test_config.json.');
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
    // Signature is often base64 string in SDK
    const S = typeof signature === 'string' ? new Uint8Array(Buffer.from(signature, 'base64')) : signature;
    console.log(`EA Signed Voter Address (S): ${Buffer.from(S).toString('hex').substring(0, 20)}...`);

    // --- Phase 3: Voting ---
    console.log('\n--- Phase 3: Voting ---');

    // 3.1 Prepare Plaintext Vote
    // 3.1 Prepare Plaintext Vote
    const votePlaintext = JSON.stringify({
        candidate_id: 1,
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

    // --- Phase 4: Verification (Indexer / Tally Logic) ---
    console.log('\n--- Phase 4: Verification (Off-chain Tally) ---');
    console.log(`Scanning transactions for VoteEvent: ${voteEventId}`);

    // Query transactions that mutated the VoteEvent
    const txResults = await client.queryTransactionBlocks({
        filter: {
            ChangedObject: voteEventId
        },
        options: {
            showInput: true,
            showEffects: true,
            showEvents: true
        }
    });

    console.log(`Found ${txResults.data.length} transactions involving this event.`);

    let foundMyVote = false;
    const tallyCounts = {};
    const validVotes = [];

    // Iterate newly to oldest usually, or reverse depending on need.
    for (const txBlock of txResults.data) {
        // Did we find valid sender?
        const senderAddr = txBlock.transaction?.data?.sender;
        console.log(`Scan TX: ${txBlock.digest}, Sender: ${senderAddr}`);

        if (!senderAddr) continue;

        if (!txBlock.transaction || !txBlock.transaction.data || !txBlock.transaction.data.transaction) {
            console.warn('Skipping malformed tx block:', txBlock.digest);
            continue;
        }

        // 1. Identify Sender (addr)
        // const senderAddr = txBlock.transaction.data.sender; // This line is now redundant
        // console.log('DEBUG TX:', txBlock.digest); 

        // 2. Look for the "vote" Move Call
        const txData = txBlock.transaction.data.transaction;
        // console.log('DEBUG TX DATA:', JSON.stringify(txData, null, 2));
        const commands = txData.kind === 'ProgrammableTransaction' ? (txData.transactions || txData.commands) : [];

        if (!Array.isArray(commands)) {
            console.warn(`Commands is not an array for tx: ${txBlock.digest}. Kind: ${txData.kind}`);
            // Try fallback location?
            console.warn('DUMP:', JSON.stringify(txData));
            continue;
        }

        // We need to parse inputs. The inputs list is in txBlock.transaction.data.transaction.inputs
        // The commands reference these inputs.
        const inputs = txData.inputs || [];

        if (senderAddr === voterAddress) {
            // Check first command keys
        }

        // Find command calling "vote"
        let voteCommandFound = false;
        let cBytes = null;
        let sBytes = null;

        for (const cmd of commands) {
            // Check for both CamelCase and PascalCase
            const call = cmd.MoveCall || cmd.moveCall;
            if (call && call.function === 'vote') {
                if (call.package === config.PACKAGE_ID) {
                    console.log('DEBUG: Vote Command Found. Resolving inputs...');
                    console.log('Arguments:', JSON.stringify(call.arguments));
                } else {
                    console.warn(`DEBUG: Package ID Mismatch. Config: ${config.PACKAGE_ID}, Tx: ${call.package}`);
                }

                voteCommandFound = true; // Mark found anyway to debug further if needed

                // arguments: [ve, encrypted_vote, sign]
                const resolveBytes = (argIndex) => {
                    const arg = call.arguments[argIndex];
                    if (arg && arg.Input !== undefined) {
                        const inputVal = inputs[arg.Input];

                        // Structure: { type: 'pure', valueType: 'vector<u8>', value: [...] }
                        if (inputVal && inputVal.value) {
                            return inputVal.value;
                        }

                        // SDK Pure Input handling (Fallback for other versions)
                        if (inputVal && inputVal.Pure) {
                            const raw = inputVal.Pure.inputs ? inputVal.Pure.inputs[0] : inputVal.Pure;
                            return raw;
                        }
                    }
                    return null;
                };

                const cInput = resolveBytes(1); // 2nd argument
                const sInput = resolveBytes(2); // 3rd argument

                // console.log(`DEBUG: cInput found: ${!!cInput}, sInput found: ${!!sInput}`);

                if (cInput && sInput) {
                    const cBuf = Buffer.from(cInput);
                    // Use Buffer.from() to ensure we handle array of numbers or bytes correctly
                    // sInput is vector<u8> (array of numbers), Buffer.from(sInput) works.
                    let sBuf = Buffer.from(sInput);

                    console.log(`   Scanner Found Vote. Sender: ${senderAddr}`);
                    console.log(`   sBytes Length: ${sBuf.length}`);
                    console.log(`   cBytes Length: ${cBuf.length}`);

                    if (sBuf.length === 97) {
                        // Serialized Signature: 1 byte flag + 64 bytes sig + 32 bytes pk
                        if (sBuf[0] === 0) {
                            sBuf = sBuf.slice(1, 65);
                        }
                    }

                    // 3. Verify S
                    try {
                        const msgToCheck = new TextEncoder().encode(senderAddr);
                        // Ensure Uint8Array
                        const sBytesValid = new Uint8Array(sBuf);

                        // verifyPersonalMessage likely expects raw 64-byte signature but handles Intent
                        const isValid = await eaKeypair.getPublicKey().verifyPersonalMessage(msgToCheck, sBytesValid);

                        console.log(`   Eligibility Check (S): ${isValid ? '✅ VALID' : '❌ INVALID'}`);

                        if (isValid) {
                            // 4. Decrypt c
                            // console.log('   Decrypting vote content...');
                            const pkLen = nacl.box.publicKeyLength;
                            const nonceLen = nacl.box.nonceLength;

                            if (cBuf.length >= pkLen + nonceLen) {
                                const senderEphemPK = cBuf.slice(0, pkLen);
                                const msgNonce = cBuf.slice(pkLen, pkLen + nonceLen);
                                const msgCipher = cBuf.slice(pkLen + nonceLen);

                                const decryptedBytes = nacl.box.open(msgCipher, msgNonce, senderEphemPK, eaSecretKey);
                                if (decryptedBytes) {
                                    const decryptedText = naclUtil.encodeUTF8(decryptedBytes);
                                    console.log(`   Decrypted Vote: ${decryptedText}`);

                                    try {
                                        const voteObj = JSON.parse(decryptedText);
                                        const cid = voteObj.candidate_id;
                                        if (cid !== undefined) {
                                            tallyCounts[cid] = (tallyCounts[cid] || 0) + 1;
                                            validVotes.push({ tx: txBlock.digest, candidate_id: cid });
                                        }
                                    } catch (e) {
                                        console.error('   Error parsing vote JSON:', e.message);
                                    }

                                    if (decryptedText === votePlaintext) {
                                        foundMyVote = true;
                                    }
                                } else {
                                    console.error('   -> FAIL: Decryption failed.');
                                }
                            } else {
                                console.error('   -> FAIL: Malformed ciphertext length.');
                            }
                        }
                    } catch (err) {
                        console.error(`   Verification Error: ${err.message}`);
                    }
                }
            }
        }
    }

    console.log('\n--- Election Results ---');
    console.log(`Total Valid Votes: ${validVotes.length}`);
    for (const [cid, count] of Object.entries(tallyCounts)) {
        console.log(`Candidate ${cid}: ${count} votes`);
    }

    if (foundMyVote) {
        console.log('SUCCESS: Flow verified. Our vote was counted.');
    } else {
        console.error('FAIL: Our vote was not found/counted.');
    }
}

runTest().catch(console.error);
