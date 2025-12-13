const { IotaClient } = require('@iota/iota-sdk/client');
const { Ed25519Keypair } = require('@iota/iota-sdk/keypairs/ed25519');
const { getFaucetHost, requestSuiFromFaucetV0 } = require('@iota/iota-sdk/faucet');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = 'test_config.json';
const NETWORK = 'localnet';
const DEFAULT_NODE_URL = "http://127.0.0.1:9000";
const DEFAULT_FAUCET_URL = "http://127.0.0.1:9123/gas";

async function main() {
    console.log('--- Setting up Test Environment ---');

    // Load existing config or defaults
    let config = {};
    if (fs.existsSync(CONFIG_FILE)) {
        config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }

    config.NODE_URL = config.NODE_URL || DEFAULT_NODE_URL;
    config.FAUCET_URL = config.FAUCET_URL || DEFAULT_FAUCET_URL;

    // Force re-publish since we updated the contract code
    config.PACKAGE_ID = "";

    // 1. Generate Keys if missing
    if (!config.ADMIN_SecretKey) {
        console.log('Generating Admin Key...');
        const keypair = new Ed25519Keypair();
        config.ADMIN_SecretKey = keypair.getSecretKey();
        const address = keypair.toIotaAddress();
        console.log(`Admin Address: ${address}`);
        await fundAddress(address, config.FAUCET_URL);
    }

    if (!config.VOTER_SecretKey) {
        console.log('Generating Voter Key...');
        const keypair = new Ed25519Keypair();
        config.VOTER_SecretKey = keypair.getSecretKey();
        const address = keypair.toIotaAddress();
        console.log(`Voter Address: ${address}`);
        await fundAddress(address, config.FAUCET_URL);
    }

    if (!config.EA_PrivateKey_X25519) {
        console.log('Generating EA X25519 Keys...');
        // Generate new key pair
        const pair = nacl.box.keyPair();
        // Store as Base64 for easier JSON handling
        config.EA_PrivateKey_X25519 = Buffer.from(pair.secretKey).toString('base64');
        config.EA_PublicKey_X25519 = Buffer.from(pair.publicKey).toString('base64');
    }

    // 2. Publish Package if missing
    if (!config.PACKAGE_ID) {
        console.log('Publishing Package...');
        try {
            const packagePath = path.join(__dirname, 'aivoting');
            // Note: This uses the system 'iota' CLI which uses its own active wallet, not the 'ADMIN_SecretKey' above.
            // This is a limitation of mixing JS SDK and CLI. 
            // Ideally we run a proper publish via SDK, but that requires compiled modules.
            // We will stick to CLI for publish and capture the result.
            const output = execSync(`iota client publish --gas-budget 100000000 --json ${packagePath}`, { encoding: 'utf-8' });
            const result = JSON.parse(output);
            const packageId = result.objectChanges.find(c => c.type === 'published').packageId;
            config.PACKAGE_ID = packageId;
            console.log(`Published Package ID: ${packageId}`);
        } catch (e) {
            console.error('Failed to publish. Make sure `iota` CLI is installed and localnet is running.');
            // process.exit(1); // Don't exit, maybe user just wants keys
        }
    }

    // 3. (Optional) Log info
    if (config.PACKAGE_ID) {
        console.log(`Package ID: ${config.PACKAGE_ID}`);
    }

    // Save config
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4));
    console.log(`Config saved to ${CONFIG_FILE}`);
}

async function fundAddress(address, faucetUrl) {
    try {
        await requestSuiFromFaucetV0({ host: faucetUrl, recipient: address });
        await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
        console.warn(`Could not fund ${address} via faucet. Manual funding might be needed.`);
    }
}

main().catch(console.error);
