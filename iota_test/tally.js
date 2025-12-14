const { IotaClient } = require('@iota/iota-sdk/client');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const fs = require('fs');
const { Ed25519Keypair } = require('@iota/iota-sdk/keypairs/ed25519');

const CONFIG_FILE = 'test_config.json';

async function tally(voteEventId) {
    console.log(`--- Starting Tally Process for Event: ${voteEventId} ---`);

    // 1. Load Config
    if (!fs.existsSync(CONFIG_FILE)) {
        throw new Error(`Config file ${CONFIG_FILE} not found.`);
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

    const client = new IotaClient({ url: config.NODE_URL });

    // EA Keys (for verification and decryption)
    // Verification uses Ed25519 Public Key
    const eaKeypair = Ed25519Keypair.fromSecretKey(config.ADMIN_SecretKey);
    // Decryption uses X25519 Private Key
    const eaSecretKey = new Uint8Array(Buffer.from(config.EA_PrivateKey_X25519, 'base64'));

    console.log(`Scanning transactions...`);

    // Query transactions that mutated the VoteEvent
    let hasMore = true;
    let cursor = null;
    const allTxBlocks = [];

    while (hasMore) {
        const txResults = await client.queryTransactionBlocks({
            filter: { ChangedObject: voteEventId },
            options: { showInput: true, showEffects: true },
            cursor: cursor
        });
        allTxBlocks.push(...txResults.data);
        cursor = txResults.nextCursor;
        hasMore = txResults.hasNextPage;
    }

    console.log(`Found ${allTxBlocks.length} total interactions.`);

    const tallyCounts = {};
    const validVotes = [];
    const invalidVotes = [];

    for (const txBlock of allTxBlocks) {
        // 1. Identify Sender
        const senderAddr = txBlock.transaction?.data?.sender;
        if (!senderAddr) continue;

        // 2. Find Vote Command
        const txData = txBlock.transaction.data.transaction;
        const commands = txData.kind === 'ProgrammableTransaction' ? (txData.transactions || txData.commands) : [];
        const inputs = txData.inputs || [];

        let voteCommandFound = false;
        let cBytes = null;
        let sBytes = null;

        for (const cmd of commands) {
            const call = cmd.MoveCall || cmd.moveCall;
            if (call && call.function === 'vote' && call.package === config.PACKAGE_ID) {

                const resolveBytes = (argIndex) => {
                    const arg = call.arguments[argIndex];
                    if (arg && arg.Input !== undefined) {
                        const inputVal = inputs[arg.Input];
                        // SDK Pure Input handling
                        if (inputVal && inputVal.value) return inputVal.value;
                        if (inputVal && inputVal.Pure) {
                            return inputVal.Pure.inputs ? inputVal.Pure.inputs[0] : inputVal.Pure;
                        }
                    }
                    return null;
                };

                const cInput = resolveBytes(1);
                const sInput = resolveBytes(2);

                if (cInput && sInput) {
                    cBytes = Buffer.from(cInput);
                    sBytes = Buffer.from(sInput);
                    voteCommandFound = true;
                    // Assuming only one vote per tx is relevant for now
                    break;
                }
            }
        }

        if (voteCommandFound) {
            // Verify Signature
            if (sBytes.length === 97 && sBytes[0] === 0) {
                sBytes = sBytes.slice(1, 65);
            }

            try {
                const msgToCheck = new TextEncoder().encode(senderAddr);
                const isValid = await eaKeypair.getPublicKey().verifyPersonalMessage(msgToCheck, sBytes);

                if (isValid) {
                    // Decrypt
                    const pkLen = nacl.box.publicKeyLength;
                    const nonceLen = nacl.box.nonceLength;
                    if (cBytes.length >= pkLen + nonceLen) {
                        const senderEphemPK = cBytes.slice(0, pkLen);
                        const msgNonce = cBytes.slice(pkLen, pkLen + nonceLen);
                        const msgCipher = cBytes.slice(pkLen + nonceLen);

                        const decryptedBytes = nacl.box.open(msgCipher, msgNonce, senderEphemPK, eaSecretKey);
                        if (decryptedBytes) {
                            const decryptedText = naclUtil.encodeUTF8(decryptedBytes);
                            try {
                                const voteObj = JSON.parse(decryptedText);
                                const cid = voteObj.candidate_id;
                                if (cid !== undefined) {
                                    tallyCounts[cid] = (tallyCounts[cid] || 0) + 1;
                                    validVotes.push({ tx: txBlock.digest, sender: senderAddr, choice: cid });
                                    // console.log(`   + Valid Vote from ${senderAddr} for Candidate ${cid}`);
                                } else {
                                    invalidVotes.push({ tx: txBlock.digest, reason: "Missing candidate_id" });
                                }
                            } catch (e) {
                                invalidVotes.push({ tx: txBlock.digest, reason: "JSON Parse Error" });
                            }
                        } else {
                            invalidVotes.push({ tx: txBlock.digest, reason: "Decryption Failed" });
                        }
                    } else {
                        invalidVotes.push({ tx: txBlock.digest, reason: "Malformed Ciphertext" });
                    }
                } else {
                    invalidVotes.push({ tx: txBlock.digest, reason: "Invalid Signature" });
                }
            } catch (e) {
                invalidVotes.push({ tx: txBlock.digest, reason: `Error: ${e.message}` });
            }
        }
    }

    console.log('\n=== ELECTION RESULTS ===');
    console.log(`Vote Event ID: ${voteEventId}`);
    console.log(`Total Interactions: ${allTxBlocks.length}`);
    console.log(`Valid Votes: ${validVotes.length}`);
    console.log(`Invalid Votes: ${invalidVotes.length}`);
    console.log('------------------------');
    for (const [cid, count] of Object.entries(tallyCounts)) {
        console.log(`> Candidate ${cid}: ${count} votes`);
    }
    console.log('========================');
}

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log("Usage: node tally.js <vote_event_id>");
    process.exit(1);
}

tally(args[0]).catch(console.error);
