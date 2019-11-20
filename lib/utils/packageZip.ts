import JSZip from 'jszip';
import { aesGenKey, aesEncrypt } from './crypto/aes';
import { rsaEncrypt } from './crypto/rsa';
import { b64encode } from './crypto/base64';

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
    private async encryptData(content: ArrayBuffer): Promise<string> {
        const text = b64encode(content)
        return await this.encryptText(text)
    }
    private async encryptText(text: string): Promise<string> {
        return await aesEncrypt(text, await this.keyPromise)
    }
    private async addMetaFile(publicKey: string) {
        const encryptedMeta = await rsaEncrypt(JSON.stringify(this.meta), publicKey)
        const encryptedKey = await rsaEncrypt(await this.keyPromise, publicKey)
        const encryptedTags = await Promise.all(this.tags.map(async t => await rsaEncrypt(t, publicKey)))
        const meta = {
            encryptedMeta, encryptedKey, encryptedTags, 
            files: this.fileNameList
        }
        this.zip.file('index.json', JSON.stringify(meta))
    }
    async addFile(name: string, content: ArrayBuffer): Promise<void> {
        const targetName = await this.encryptText(name)
        await this.zip.file(`resource/${targetName}`, await this.encryptData(content))
        this.fileNameList.push(targetName)
    }
    async build(publicKey: string): Promise<ArrayBuffer> {
        await this.addMetaFile(publicKey)
        return await this.zip.generateAsync({
            type: "arraybuffer"
        })
    }
}