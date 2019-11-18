
const KEY_FORMAT = "pkcs8"

const ENCRYPTION_ALGORITHM: RsaHashedKeyGenParams = {
    name: "RSA-OAEP",
    modulusLength: 4096,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
  }

export interface ZHTKeyPair {
    publicKey: string,
    privateKey: string
}

const zCryptoSubtle = globalThis.crypto.subtle

export async function rsaGenKey(): Promise<ZHTKeyPair>{
    const {publicKey, privateKey} = await zCryptoSubtle.generateKey(
        ENCRYPTION_ALGORITHM,
        true,
        ["encrypt", "decrypt"]
      )
    const publicKeyBuffer = await zCryptoSubtle.exportKey(KEY_FORMAT, publicKey)
    const privateKeyBuffer = await zCryptoSubtle.exportKey(KEY_FORMAT, privateKey)
    const dec = new TextDecoder()
    return {
        publicKey: dec.decode(publicKeyBuffer),
        privateKey: dec.decode(privateKeyBuffer)
    }
}

export async function rsaEncrypt(plainText: string, publicKey: string): Promise<string> {
    const enc = new TextEncoder()
    const dec = new TextDecoder()
    const key = await zCryptoSubtle.importKey(KEY_FORMAT, enc.encode(publicKey), ENCRYPTION_ALGORITHM, true, ['encrypt'])
    const binData = await zCryptoSubtle.encrypt(ENCRYPTION_ALGORITHM, key, enc.encode(plainText))
    return dec.decode(binData)
}

export async function rsaDecrypt(plainText: string, privateKey: string) {
    const enc = new TextEncoder()
    const dec = new TextDecoder()
    const key = await zCryptoSubtle.importKey(KEY_FORMAT, enc.encode(privateKey), ENCRYPTION_ALGORITHM, true, ['decrypt'])
    const binData = await zCryptoSubtle.decrypt(ENCRYPTION_ALGORITHM, key, enc.encode(plainText))
    return dec.decode(binData)
}