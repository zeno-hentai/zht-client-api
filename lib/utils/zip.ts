import JSZip from 'jszip';
import { aesGenKey, aesEncrypt } from './crypto/aes';
import { rsaEncrypt } from './crypto/rsa';
import Base64ArrayBuffer from 'base64-arraybuffer'

export interface ZHTResourcePackBuilderOptions<Meta> {
    meta: Meta,
    tags: string[]
}

export class ZHTResourcePackBuilder<Meta = any> {
    meta: Meta
    tags: string[]
    private fileNameList: string[]
    private keyPromise: Promise<string>
    private zip: JSZip
    constructor(options: ZHTResourcePackBuilderOptions<Meta>) {
        this.meta = options.meta
        this.tags = options.tags
        this.fileNameList = []
        this.zip = new JSZip()
        this.keyPromise = aesGenKey()
    }
    private async encrypt(content: ArrayBuffer): Promise<string> {
        const text = Base64ArrayBuffer.encode(content)
        return await aesEncrypt(text, await this.keyPromise)
    }
    private async addMetaFile(privateKey: string) {
        const encryptedMeta = await rsaEncrypt(JSON.stringify(this.meta), privateKey)
        const encryptedKey = await rsaEncrypt(await this.keyPromise, privateKey)
        const encryptedTags = await Promise.all(this.tags.map(async t => await rsaEncrypt(t, privateKey)))
        const files = await Promise.all(this.fileNameList.map(async f => await aesEncrypt(f, await this.keyPromise)))
        const meta = {
            encryptedMeta, encryptedKey, encryptedTags, files
        }
        this.zip.file('index.json', JSON.stringify(meta))
    }
    async addFile(name: string, content: ArrayBuffer): Promise<void> {
        await this.zip.file(`resource/${name}`, await this.encrypt(content))
        this.fileNameList.push(name)
    }
    async build(privateKey: string): Promise<ArrayBuffer> {
        await this.addMetaFile(privateKey)
        return await this.zip.generateAsync({
            type: "arraybuffer"
        })
    }
}