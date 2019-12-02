import {Crypto as WebCrypto} from '@peculiar/webcrypto'
import { b64encode, b64decode } from './base64';

export interface ZHTKeyPair {
    publicKey: string,
    privateKey: string
}

interface ZHTRsaUtil {
    generateKeyPair(): Promise<ZHTKeyPair>
    encrypt(data: ArrayBuffer, publicKey: string): Promise<ArrayBuffer>
    decrypt(encrypted: ArrayBuffer, privateKey: string): Promise<ArrayBuffer>
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

    private *splitIntoChunks(buffer: ArrayBuffer, chunkSize: number){
        for(let i=0; i<buffer.byteLength; i+=chunkSize){
            yield buffer.slice(i, i+chunkSize)
        }
    }

    private mergeChunks(chunks: ArrayBuffer[]): ArrayBuffer{
        let len = 0
        for(let c of chunks){
            len += c.byteLength
        }
        const buf = new Uint8Array(len)
        let offset = 0
        for(let c of chunks){
            buf.set(new Uint8Array(c), offset)
            offset += c.byteLength
        }
        return buf.buffer
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

    async encrypt(data: ArrayBuffer, publicKey: string): Promise<ArrayBuffer> {
        const key = await this.subtle.importKey(this.KEY_FORMAT, JSON.parse(publicKey), this.ENCRYPTION_ALGORITHM, true, ['encrypt'])
        const chunks: ArrayBuffer[] = []
        for(let chunk of this.splitIntoChunks(data, this.chunkSize)){
            const binData = await this.subtle.encrypt(this.ENCRYPTION_ALGORITHM, key, chunk)
            chunks.push(binData)
        }
        return this.mergeChunks(chunks)
    }
    async decrypt(encrypted: ArrayBuffer, privateKey: string): Promise<ArrayBuffer> {
        const key = await this.subtle.importKey(this.KEY_FORMAT, JSON.parse(privateKey), this.ENCRYPTION_ALGORITHM, true, ['decrypt'])
        const targets: ArrayBuffer[] = []
        for(let chunk of this.splitIntoChunks(encrypted, this.chunkSize*2)) {
            const binData = await this.subtle.decrypt(this.ENCRYPTION_ALGORITHM, key, chunk)
            targets.push(binData)
        }
        return this.mergeChunks(targets)
    }
}

const rsaUtil: ZHTRsaUtil = globalThis.crypto && globalThis.crypto.subtle ? 
    new BrowserRsaUtil(globalThis.crypto.subtle) : 
    new BrowserRsaUtil(new WebCrypto().subtle)

export async function rsaGenKey(): Promise<ZHTKeyPair>{
    return await rsaUtil.generateKeyPair()
}

export async function rsaEncrypt(data: ArrayBuffer, publicKey: string): Promise<ArrayBuffer> {
    return await rsaUtil.encrypt(data, publicKey)
}

export async function rsaDecrypt(encrypted: ArrayBuffer, privateKey: string): Promise<ArrayBuffer> {
    return await rsaUtil.decrypt(encrypted, privateKey)
}

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export async function rsaEncryptWrapped(data: string, publicKey: string): Promise<string> {
    return b64encode(await rsaUtil.encrypt(textEncoder.encode(data), publicKey))
}

export async function rsaDecryptWrapped(encrypted: string, privateKey: string): Promise<string> {
    return textDecoder.decode(await rsaUtil.decrypt(b64decode(encrypted), privateKey))
}