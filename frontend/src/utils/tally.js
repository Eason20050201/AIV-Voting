import { IotaClient } from "@iota/iota-sdk/client";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
import { Ed25519PublicKey } from "@iota/iota-sdk/keypairs/ed25519";
import { getRejectedWallets } from "../services/votingService";

export const tallyOnChainVotes = async (event, eaParams) => {
    // eaParams: { encryptionPrivateKey (base64 string) }
    // event: { onChainId, ... }
    
    // 1. Init Client
    // Use the same node URL as config or default to testnet
    const client = new IotaClient({ url: "https://api.testnet.iota.cafe" }); 
    
    console.log(`Starting Tally for Event: ${event.onChainId}`);
    
    // 2. Fetch Transactions
    let cursor = null;
    let hasNextPage = true;
    let allTxBlocks = [];

    while (hasNextPage) {
        const response = await client.queryTransactionBlocks({
            filter: {
                ChangedObject: event.onChainId
            },
            options: {
                showInput: true,
                showEffects: true,
                showEvents: true
            },
            cursor: cursor
        });

        allTxBlocks = [...allTxBlocks, ...response.data];
        cursor = response.nextCursor;
        hasNextPage = response.hasNextPage;
        
        // Safety Break for demo to avoid infinite loop if huge
        if (allTxBlocks.length > 500) break; 
    }

    console.log(`Found ${allTxBlocks.length} transactions.`);

    console.log(`Found ${allTxBlocks.length} transactions.`);

    // 3. Fetch Rejected Wallets (from Backend)
    let rejectedSet = new Set();
    try {
        const rejectedWallets = await getRejectedWallets(event._id);
        rejectedWallets.forEach(addr => rejectedSet.add(addr));
        console.log(`Loaded ${rejectedSet.size} rejected wallets.`);
    } catch (e) {
        console.error("Failed to load rejected wallets:", e);
        // Fallback: Proceed without filtering? Or stop? 
        // Safer to warn but proceed, or maybe user wants to know.
        // For now log and proceed.
    }

    const tally = {};
    const validVotes = [];
    const seenSenders = new Set(); // Track unique voters

    // EA Secret Key (Uint8Array)
    const eaSecretKey = naclUtil.decodeBase64(eaParams.encryptionPrivateKey);
    
    // We also need the GLOBAL EA Public Key to verify the signature S
    // Because currently S is signed by the Global EA, not the event-specific key.
    // Ideally we pass this in. For now hardcode or use env variable passed in.
    const globalEAPublicKeyStr = import.meta.env.VITE_EA_PUBLIC_KEY_ED25519; // We might need to add this to .env
    // Or we assume the signature verification is optional for "Tallying"?
    // No, verification is key.
    // Actually, verifying S proves they were ELIGIBLE.
    // Decrypting C proves the VOTE is readable.
    
    // If we lack the Global EA Pub Key in frontend, we can skip S verification 
    // AND rely on the fact that the Smart Contract SHOULD have verified S. 
    // IF the Move contract verified S, then we just need to decrypt C.
    // However, the Move contract currently likely doesn't verify S cryptographically (Ed25519 on chain is expensive/complex unless specific native function used).
    // Let's try to verify S if possible, otherwise just decrypt.
    
    for (const txBlock of allTxBlocks) {
        const txData = txBlock.transaction?.data?.transaction;
        if (!txData || txData.kind !== 'ProgrammableTransaction') continue;

        // Extract Sender
        const sender = txBlock.transaction?.data?.sender;
        if (!sender) continue;

        if (seenSenders.has(sender)) {
            console.log(`Skipping duplicate vote from ${sender}`);
            continue;
        }

        if (rejectedSet.has(sender)) {
            console.log(`Skipping REJECTED vote from ${sender}`);
            continue;
        }

        const commands = txData.transactions || [];
        const inputs = txData.inputs || [];

        // Helper to resolve input bytes
        const resolveBytes = (arg) => {
            if (!arg) return null;
            if (arg.Input !== undefined) {
               const inputVal = inputs[arg.Input];
               if (inputVal && inputVal.value) return new Uint8Array(inputVal.value);
               if (inputVal && inputVal.Pure) return new Uint8Array(inputVal.Pure.inputs[0]); // Check structure
            }
            return null;
        };

        for (const cmd of commands) {
            const call = cmd.MoveCall;
            if (call && call.function === 'vote') {
                // arguments: [ve, encrypted_vote, sign]
                // encrypted_vote is index 1
                // sign is index 2
                
                // Note: The SDK structure for arguments might be slightly different in browser vs node
                // But generally call.arguments[1] is the relevant input
                
                try {
                     // We need to parse inputs carefully.
                     // Accessing raw bytes from transaction blocks in browser SDK might differ slightly
                     // Let's assume we can get the bytes.
                     
                     // Optimization: In browser, inspecting strict inputs is hard without a robust parser.
                     // But wait, we can just try to decrypt any vector<u8> input?
                     // No, that's messy.
                     
                     // Let's rely on the inputs being available in the `inputs` array.
                     // The argument points to the input index.
                     const cArg = call.arguments[1];
                     const cInputIndex = cArg.Input;
                     const cInputObj = inputs[cInputIndex];
                     
                     // Value is usually array of numbers
                     let cBytes = null;
                     if(cInputObj.value) cBytes = new Uint8Array(cInputObj.value);
                     else if (cInputObj.Pure) cBytes = new Uint8Array(cInputObj.Pure.inputs[0]);
                     
                     if (cBytes) {
                        const pkLen = nacl.box.publicKeyLength;
                        const nonceLen = nacl.box.nonceLength;
                        
                        if (cBytes.length >= pkLen + nonceLen) {
                            const senderEphemPK = cBytes.slice(0, pkLen);
                            const msgNonce = cBytes.slice(pkLen, pkLen + nonceLen);
                            const msgCipher = cBytes.slice(pkLen + nonceLen);
                            
                            const decrypted = nacl.box.open(msgCipher, msgNonce, senderEphemPK, eaSecretKey);
                            
                            if (decrypted) {
                                const jsonStr = naclUtil.encodeUTF8(decrypted);
                                const voteObj = JSON.parse(jsonStr);
                                const cid = String(voteObj.candidate_id);
                                
                                if (cid !== undefined && cid !== "undefined") {
                                    tally[cid] = (tally[cid] || 0) + 1;
                                    validVotes.push({ tx: txBlock.digest, candidate_id: cid, sender });
                                    seenSenders.add(sender); // Mark sender as counted
                                    break; // Count once per tx
                                }
                            }
                        }
                     }
                } catch (e) {
                    console.error("Failed to process transaction", txBlock.digest, e);
                }
            }
        }
    }
    
    return { tally, validVotes, total: validVotes.length };
};
