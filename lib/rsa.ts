import Base64ArrayBuffer from 'base64-arraybuffer'

export interface ZHTKeyPair {
    publicKey: string,
    privateKey: string
}

interface ZHTRsaUtil {
    generateKeyPair(): Promise<ZHTKeyPair>
    encrypt(plain: string, publicKey: string): Promise<string>
    decrypt(encrypted: string, privateKey: string): Promise<string>
}

class BrowserRsaUtil implements ZHTRsaUtil {
    subtle: SubtleCrypto

    KEY_FORMAT: "jwk" = "jwk"

    ENCRYPTION_ALGORITHM: RsaHashedKeyGenParams = {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
    }

    constructor(subtle: SubtleCrypto) {
        this.subtle = subtle
    }
    async generateKeyPair(): Promise<ZHTKeyPair> {
        const {publicKey, privateKey} = await this.subtle.generateKey(
            this.ENCRYPTION_ALGORITHM,
            true,
            ["encrypt", "decrypt"]
          )
        const publicKeyBuffer = await this.subtle.exportKey(this.KEY_FORMAT, publicKey)
        const privateKeyBuffer = await this.subtle.exportKey(this.KEY_FORMAT, privateKey)
        return {
            publicKey: JSON.stringify(publicKeyBuffer),
            privateKey: JSON.stringify(privateKeyBuffer)
        }
    }    
    async encrypt(plainText: string, publicKey: string): Promise<string> {
        const enc = new TextEncoder()
        const key = await this.subtle.importKey(this.KEY_FORMAT, JSON.parse(publicKey), this.ENCRYPTION_ALGORITHM, true, ['encrypt'])
        const binData = await this.subtle.encrypt(this.ENCRYPTION_ALGORITHM, key, enc.encode(plainText))
        return Base64ArrayBuffer.encode(binData)
    }
    async decrypt(plainText: string, privateKey: string): Promise<string> {
        const dec = new TextDecoder()
        const key = await this.subtle.importKey(this.KEY_FORMAT, JSON.parse(privateKey), this.ENCRYPTION_ALGORITHM, true, ['decrypt'])
        const binData = await this.subtle.decrypt(this.ENCRYPTION_ALGORITHM, key, Base64ArrayBuffer.decode(plainText))
        return dec.decode(binData)
    }
}

const rsaUtil: ZHTRsaUtil = globalThis.crypto && globalThis.crypto.subtle ? 
    new BrowserRsaUtil(globalThis.crypto.subtle) : 
    new BrowserRsaUtil((() => {
        const {Crypto} = require('@peculiar/webcrypto')
        console.log(Crypto)
        return new Crypto().subtle
    })())

export async function rsaGenKey(): Promise<ZHTKeyPair>{
    return await rsaUtil.generateKeyPair()
}

export async function rsaEncrypt(plainText: string, publicKey: string): Promise<string> {
    return await rsaUtil.encrypt(plainText, publicKey)
}

export async function rsaDecrypt(plainText: string, privateKey: string) {
    return await rsaUtil.decrypt(plainText, privateKey)
}