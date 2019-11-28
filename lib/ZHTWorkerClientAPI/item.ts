import {ZHTWorkerClientAPI} from './base';
import { CreateItemRequest, CreateItemResponse, EncryptedCreateItemRequest, CreateItemResult } from '../data/item';
import { rsaEncrypt } from '../utils/crypto/rsa';
import { b64encode } from '../utils/crypto/base64';
import { aesGenKey, aesEncrypt } from '../utils/crypto/aes';

declare module './base' {
    interface ZHTWorkerClientAPI {
        createItem<Meta>(request: CreateItemRequest<Meta>, publicKey: string): Promise<CreateItemResult>
        uploadItemFile(itemId: number, fileName: string, key: string, data: ArrayBuffer, onUpload?: OnUploadFileProcess): Promise<void>
    }
}

export type OnUploadFileProcess = (p: any) => void

ZHTWorkerClientAPI.prototype.createItem = async function<Meta> (request: CreateItemRequest<Meta>, publicKey: string): Promise<CreateItemResult> {
    const key = await aesGenKey()
    const encryptedKey = await rsaEncrypt(key, publicKey)
    const encryptedMeta = await aesEncrypt(JSON.stringify(request.meta), key)
    const encryptedTags = await Promise.all(request.tags.map(t => aesEncrypt(t, key)))
    const {id} = await this.http.post<CreateItemResponse, EncryptedCreateItemRequest>("/api/api/item/add", {
        encryptedKey, encryptedMeta, encryptedTags
    })
    return {
        id, key
    }
}

ZHTWorkerClientAPI.prototype.uploadItemFile = async function (itemId: number, fileName: string, key: string, data: ArrayBuffer, onUpload?: OnUploadFileProcess): Promise<void> {
    const encryptedData = new TextEncoder().encode(await aesEncrypt(await b64encode(data), key))
    const encryptedFileName = await aesEncrypt(fileName, key)
    await this.http.putBinaryData(`/api/api/file/upload/${itemId}/${encryptedFileName}`, encryptedData, onUpload)
}


export default {}