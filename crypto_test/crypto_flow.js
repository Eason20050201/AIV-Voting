const { RSABSSA } = require('@cloudflare/blindrsa-ts');
// Polyfill for Node.js environment if needed (Node 19+ has global crypto)
const { webcrypto } = require('node:crypto');
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

async function run() {
    console.log('--- AIV-Voting Crypto Test (User Requirements) ---');

    console.log('\n[Setup] Generating Keys...');

    // 1. Organizer Encryption Keys (X25519)
    const organizerEncKeys = nacl.box.keyPair();
    const organizerEncPubK = organizerEncKeys.publicKey;
    const organizerEncPrivK = organizerEncKeys.secretKey;
    console.log('✅ Organizer X25519 Keys Ready');
    console.log(`   Public:  ${Buffer.from(organizerEncPubK).toString('base64')}`);
    console.log(`   Private: ${Buffer.from(organizerEncPrivK).toString('base64')}`);

    // 2. Organizer Signing Keys (RSA-Blind)
    // RFC 9474 Suite: RSABSSA-SHA384-PSS-Randomized
    const suite = RSABSSA.SHA384.PSS.Randomized();
    const rsaKeyPair = await RSABSSA.SHA384.generateKey({
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        modulusLength: 2048,
    });
    const organizerSignPubK = rsaKeyPair.publicKey;
    const organizerSignPrivK = rsaKeyPair.privateKey;

    // Export RSA Keys for display
    const rsaPubJwk = await crypto.subtle.exportKey('jwk', organizerSignPubK);
    const rsaPrivJwk = await crypto.subtle.exportKey('jwk', organizerSignPrivK);

    console.log('✅ Organizer RSA Keys Ready');
    console.log(`   Public (n):  ${rsaPubJwk.n}`);
    console.log(`   Private (d): ${rsaPrivJwk.d}`);


    // ==========================================
    // Phase 1: Blind Signature (Get S)
    // ==========================================
    console.log('\n\n=== Step 1: Obtain Blind Signature (S) ===');

    // Fixed Sender Address
    const senderAddress = '0x600a7615a7826c163a65f333908a7641caf5bce9ab4bc40a4ff3e68e970b0335';
    console.log(`Target Address (addr): ${senderAddress}`);

    // 1. Blinding
    const msgBytes = new TextEncoder().encode(senderAddress);
    const { blindedMsg, inv } = await suite.blind(organizerSignPubK, msgBytes);
    console.log(`Blinded Address (addr'): ${Buffer.from(blindedMsg).toString('hex').substring(0, 20)}...`);

    // 2. Signing (Organizer)
    const blindSignature = await suite.blindSign(organizerSignPrivK, blindedMsg);
    console.log(`Blind Signature (S'):    ${Buffer.from(blindSignature).toString('hex').substring(0, 20)}...`);

    // 3. Unblinding (Voter)
    const signature = await suite.finalize(organizerSignPubK, msgBytes, blindSignature, inv);
    const sigHex = Buffer.from(signature).toString('hex');
    console.log(`Unblinded Signature (S):  ${sigHex.substring(0, 20)}...`);

    // Sanity check
    if (!await suite.verify(organizerSignPubK, signature, msgBytes)) {
        throw new Error('Signature verification failed!');
    }
    console.log('✅ Signature (S) verified valid for addr');


    // ==========================================
    // Phase 2: Encrypt Vote V = [addr, S, c]
    // ==========================================
    console.log('\n\n=== Step 2: Constructing Encrypted Vote Payload V ===');
    console.log('Structure: V = { addr, S, c }');
    console.log('Where c (Ciphertext Blob) = [ EphemeralPK | Nonce | Encrypted(candidate_id) ]');

    const votePlaintext = JSON.stringify({ candidate_id: 1 });
    console.log(`Vote Plaintext: ${votePlaintext}`);

    // Perform 3 Encryptions
    for (let i = 1; i <= 3; i++) {
        console.log(`\n--- Vote #${i} ---`);

        // 1. Encrypt Content (c)
        const voterEphemeral = nacl.box.keyPair();
        const nonce = nacl.randomBytes(nacl.box.nonceLength);
        const msgUint8 = naclUtil.decodeUTF8(votePlaintext);

        const ciphertext = nacl.box(
            msgUint8,
            nonce,
            organizerEncPubK,
            voterEphemeral.secretKey
        );

        // Pack c: [EphemeralPK (32)] + [Nonce (24)] + [Ciphertext]
        const packedC = new Uint8Array(voterEphemeral.publicKey.length + nonce.length + ciphertext.length);
        packedC.set(voterEphemeral.publicKey, 0);
        packedC.set(nonce, voterEphemeral.publicKey.length);
        packedC.set(ciphertext, voterEphemeral.publicKey.length + nonce.length);

        const cBase64 = Buffer.from(packedC).toString('base64');
        console.log(`c (Encrypted Blob): ${cBase64}`);

        // 2. Construct V
        const V = {
            addr: senderAddress,
            S: sigHex,
            c: cBase64 // payload
        };

        console.log(`V (Final Payload):`, JSON.stringify(V, null, 2));


        // 3. Organizer Decrypts & Verifies
        console.log(`\n[Organizer Processing Vote #${i}]`);
        // Extract c from V
        const receivedC = Buffer.from(V.c, 'base64');

        // Unpack c
        const pkLen = nacl.box.publicKeyLength; // 32
        const nonceLen = nacl.box.nonceLength;   // 24

        const ephemPk = receivedC.slice(0, pkLen);
        const receivedNonce = receivedC.slice(pkLen, pkLen + nonceLen);
        const receivedCipher = receivedC.slice(pkLen + nonceLen);

        // Decrypt
        const decryptedBytes = nacl.box.open(
            receivedCipher,
            receivedNonce,
            ephemPk,
            organizerEncPrivK
        );

        if (decryptedBytes) {
            const decryptedString = naclUtil.encodeUTF8(decryptedBytes);
            console.log(`Decrypted Content: ${decryptedString}`);

            const match = decryptedString === votePlaintext;
            console.log(`Verification: ${match ? '✅ Vote Valid' : '❌ Invalid Vote'}`);
        } else {
            console.error('❌ Decryption Failed');
        }
    }
}

run().catch(console.error);
