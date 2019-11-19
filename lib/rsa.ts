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

    KEY_FORMAT: "pkcs8" = "pkcs8"

    ENCRYPTION_ALGORITHM: RsaHashedKeyGenParams = {
        name: "RSA-OAEP",
        modulusLength: 4096,
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
        const dec = new TextDecoder()
        return {
            publicKey: dec.decode(publicKeyBuffer),
            privateKey: dec.decode(privateKeyBuffer)
        }
    }    
    async encrypt(plainText: string, publicKey: string): Promise<string> {
        const enc = new TextEncoder()
        const dec = new TextDecoder()
        const key = await this.subtle.importKey(this.KEY_FORMAT, enc.encode(publicKey), this.ENCRYPTION_ALGORITHM, true, ['encrypt'])
        const binData = await this.subtle.encrypt(this.ENCRYPTION_ALGORITHM, key, enc.encode(plainText))
        return dec.decode(binData)
    }
    async decrypt(plainText: string, privateKey: string): Promise<string> {
        const enc = new TextEncoder()
        const dec = new TextDecoder()
        const key = await this.subtle.importKey(this.KEY_FORMAT, enc.encode(privateKey), this.ENCRYPTION_ALGORITHM, true, ['decrypt'])
        const binData = await this.subtle.decrypt(this.ENCRYPTION_ALGORITHM, key, enc.encode(plainText))
        return dec.decode(binData)
    }
}

class NodeRsaUtil implements ZHTRsaUtil {
    crypto: any
    enc: TextEncoder = new TextEncoder()
    dec: TextDecoder = new TextDecoder()
    algorithm: "rsa" = "rsa"
    options = {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
          cipher: 'aes-256-cbc',
          passphrase: ''
        }
      }

    constructor(crypto: any){
        this.crypto = crypto
    }
    async generateKeyPair(): Promise<ZHTKeyPair> {
        return await new Promise<ZHTKeyPair>((res, rej) => {
            this.crypto.generateKeyPair(this.algorithm, this.options, (err: any, publicKey: string, privateKey: string) => (
                err ? rej(err) : res({
                    privateKey, publicKey
                })
            ))
        })
    }
    async encrypt(plain: string, publicKey: string): Promise<string> {
        let data: Buffer = this.crypto.publicEncrypt({
            key: publicKey,
            oaepHash: 'sha1',
            passphrase: ''
        }, this.enc.encode(plain))
        return data.toString('base64')
    }
    async decrypt(encrypted: string, privateKey: string): Promise<string> {
        let data = this.crypto.privateDecrypt({
            key: privateKey,
            passphrase: ''
        }, this.enc.encode(encrypted))
        return this.dec.decode(data)
    }
}
const rsaUtil: ZHTRsaUtil = globalThis.crypto && globalThis.crypto.subtle ? 
    new BrowserRsaUtil(globalThis.crypto.subtle) : 
    new NodeRsaUtil(require('crypto'))

export async function rsaGenKey(): Promise<ZHTKeyPair>{
    return await rsaUtil.generateKeyPair()
}

export async function rsaEncrypt(plainText: string, publicKey: string): Promise<string> {
    return await rsaUtil.encrypt(plainText, publicKey)
}

export async function rsaDecrypt(plainText: string, privateKey: string) {
    return await rsaUtil.decrypt(plainText, privateKey)
}