import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

export const encryptVote = (voteContent, eaPublicKeyBase64) => {
    try {
        // 1. Prepare Plaintext
        const votePlaintext = JSON.stringify(voteContent);
        const msgUint8 = naclUtil.decodeUTF8(votePlaintext);

        // 2. Ephemeral Keys
        const ephemeralKeyPair = nacl.box.keyPair();
        const nonce = nacl.randomBytes(nacl.box.nonceLength);

        // 3. EA Public Key
        if (!eaPublicKeyBase64) {
            throw new Error("EA Public Key is missing");
        }
        const eaPublicKey = naclUtil.decodeBase64(eaPublicKeyBase64);

        // 4. Encrypt
        const ciphertext = nacl.box(msgUint8, nonce, eaPublicKey, ephemeralKeyPair.secretKey);

        // 5. Pack: [EphemeralPK (32)] + [Nonce (24)] + [Ciphertext]
        const packedVote = new Uint8Array(ephemeralKeyPair.publicKey.length + nonce.length + ciphertext.length);
        packedVote.set(ephemeralKeyPair.publicKey, 0);
        packedVote.set(nonce, ephemeralKeyPair.publicKey.length);
        packedVote.set(ciphertext, ephemeralKeyPair.publicKey.length + nonce.length);

        return Array.from(packedVote); // Convert to regular array for IOTA SDK
    } catch (err) {
        console.error("Encryption Failed:", err);
        throw err;
    }
};
