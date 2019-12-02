import {ZHTWorkerClientAPI} from './base';
import { CreateItemRequest, CreateItemResponse, EncryptedCreateItemRequest, CreateItemResult } from '../data/item';
import { rsaEncryptWrapped } from '../utils/crypto/rsa';
import { aesGenKey, aesEncrypt, aesEncryptWrapped, aesEncryptWrappedUrlSafe } from '../utils/crypto/aes';
import { compress } from '../utils/compress';

declare module './base' {
    interface ZHTWorkerClientAPI {
        createItem<Meta>(request: CreateItemRequest<Meta>, publicKey: string): Promise<CreateItemResult>
        uploadItemFile(itemId: number, fileName: string, key: string, data: ArrayBuffer, onUpload?: OnUploadFileProcess): Promise<void>
    }
}

export type OnUploadFileProcess = (p: any) => void

ZHTWorkerClientAPI.prototype.createItem = async function<Meta> (request: CreateItemRequest<Meta>, publicKey: string): Promise<CreateItemResult> {
    const key = await aesGenKey()
    const encryptedKey = await rsaEncryptWrapped(key, publicKey)
    const encryptedMeta = await aesEncryptWrapped(JSON.stringify(request.meta), key)
    const encryptedTags = await Promise.all(request.tags.map(t => aesEncryptWrapped(t, key)))
    const {id} = await this.http.post<CreateItemResponse, EncryptedCreateItemRequest>("/api/api/item/add", {
        encryptedKey, encryptedMeta, encryptedTags
    })
    return {
        id, key
    }
}

ZHTWorkerClientAPI.prototype.uploadItemFile = async function (itemId: number, fileName: string, key: string, data: ArrayBuffer, onUpload?: OnUploadFileProcess): Promise<void> {
    const compressedData = await compress(data)
    const encryptedData = await aesEncrypt(compressedData, key)
    const encryptedFileName = await aesEncryptWrappedUrlSafe(fileName, key)
    await this.http.putBinaryData(`/api/api/file/upload/${itemId}/${encryptedFileName}`, encryptedData, onUpload)
}


export default {}