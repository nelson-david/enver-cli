import crypto from "node:crypto";
import secrets from "secrets.js-grempe";

export interface EncryptedResult {
    ciphertext: string;
    iv: string;
    salt: string;
    shares: string[];
}

export function encryptPayload(
    plainText: string,
    lockKey: string,
): EncryptedResult {
    // 1. Generate random Master Key and split it using Shamir's Secret Sharing
    // secrets.js expects hex string, create a 256-bit (32 bytes) hex string
    const masterKeyHex = crypto.randomBytes(32).toString("hex");

    // Split into 5 shares with a threshold of 3
    const shares = secrets.share(masterKeyHex, 5, 3);

    // 2. Derive key from lockKey using PBKDF2
    const salt = crypto.randomBytes(16);
    const derivedKey = crypto.pbkdf2Sync(lockKey, salt, 100000, 32, "sha256");

    // 3. Encrypt plainText using AES-256-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", derivedKey, iv);

    let encrypted = cipher.update(plainText, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // AES-256-GCM authentication tag (16 bytes)
    const authTag = cipher.getAuthTag();

    // Append authTag to end of encrypted ciphertext payload
    const ciphertextWithTag = Buffer.concat([encrypted, authTag]);

    return {
        ciphertext: ciphertextWithTag.toString("base64"),
        iv: iv.toString("base64"),
        salt: salt.toString("base64"),
        shares,
    };
}

export function decryptPayload(
    ciphertextBase64: string,
    ivBase64: string,
    saltBase64: string,
    shares: string[],
    lockKey: string,
): string {
    // 1. Reconstruct Master Key using SSS
    const masterKeyHex = secrets.combine(shares);

    // 2. Derive key from lockKey using PBKDF2
    const salt = Buffer.from(saltBase64, "base64");
    const derivedKey = crypto.pbkdf2Sync(lockKey, salt, 100000, 32, "sha256");

    // 3. Decrypt ciphertext using AES-256-GCM
    const iv = Buffer.from(ivBase64, "base64");
    const ciphertext = Buffer.from(ciphertextBase64, "base64");

    const authTag = ciphertext.subarray(ciphertext.length - 16);
    const encryptedData = ciphertext.subarray(0, ciphertext.length - 16);

    const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
