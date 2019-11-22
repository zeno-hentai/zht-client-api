import {Crypto as WebCrypto} from '@peculiar/webcrypto'
import { b64encode, b64decode } from './base64';

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
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
    }

    private chunkSize = 256

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
        const chunks: string[] = []
        const originalBinary = enc.encode(plainText)
        for(let begin = 0; begin < originalBinary.byteLength; begin += this.chunkSize){
            const chunk = originalBinary.slice(begin, begin + this.chunkSize)
            const binData = await this.subtle.encrypt(this.ENCRYPTION_ALGORITHM, key, chunk)
            chunks.push(b64encode(binData))
        }
        return chunks.join("|")
    }
    async decrypt(plainText: string, privateKey: string): Promise<string> {
        const dec = new TextDecoder()
        const key = await this.subtle.importKey(this.KEY_FORMAT, JSON.parse(privateKey), this.ENCRYPTION_ALGORITHM, true, ['decrypt'])
        const targets: ArrayBuffer[] = []
        let len = 0
        for(let chunk of plainText.split("|")) {
            const binData = await this.subtle.decrypt(this.ENCRYPTION_ALGORITHM, key, b64decode(chunk))
            len += binData.byteLength
            targets.push(binData)
        }
        const result = new Uint8Array(len)
        let offset = 0
        for(let c of targets){
            result.set(new Uint8Array(c), offset)
            offset += c.byteLength
        }
        return dec.decode(result)
    }
}

const rsaUtil: ZHTRsaUtil = globalThis.crypto && globalThis.crypto.subtle ? 
    new BrowserRsaUtil(globalThis.crypto.subtle) : 
    new BrowserRsaUtil(new WebCrypto().subtle)

export async function rsaGenKey(): Promise<ZHTKeyPair>{
    return await rsaUtil.generateKeyPair()
}

export async function rsaEncrypt(plainText: string, publicKey: string): Promise<string> {
    return await rsaUtil.encrypt(plainText, publicKey)
}

export async function rsaDecrypt(plainText: string, privateKey: string) {
    return await rsaUtil.decrypt(plainText, privateKey)
}