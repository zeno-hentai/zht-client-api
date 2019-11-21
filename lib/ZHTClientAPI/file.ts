import {ZHTClientAPI} from './base';
import { aesDecrypt, aesEncrypt } from '../utils/crypto/aes';
import { b64decode, b64encode } from '../utils/crypto/base64';

declare module './base' {
    interface ZHTClientAPI {
        getFileMap(itemId: number, key: string): Promise<{[key: string]: string}>
        getFileData(itemId: number, mappedFileName: string, key: string, onDownloadProgress?: (progressEvent: any) => void): Promise<ArrayBuffer>
        uploadFile(itemId: number, name: string, key: string, data: ArrayBuffer, onUpload?: (p: any) => void): Promise<void>
        deleteFile(itemId: number, mappedFile: string): Promise<void>
    }
}

ZHTClientAPI.prototype.getFileMap = async function (itemId: number, key: string): Promise<{[key: string]: string}> {
    const encryptedMapping = await this.http.get<{[key: string]: string}>(`/api/file/list/${itemId}`)
    const result: {[key: string]: string} = {}
    for(let [n, v] of Object.entries(encryptedMapping)){
        result[await aesDecrypt(n, key)] = v
    }
    return result
}

ZHTClientAPI.prototype.getFileData = async function (itemId: number, mappedFileName: string, key: string, onDownloadProgress?: (progressEvent: any) => void): Promise<ArrayBuffer> {
    const data = await this.http.getBinaryData(`/api/file/data/${itemId}/${mappedFileName}`, onDownloadProgress)
    return b64decode(await aesDecrypt(data, key))
}

ZHTClientAPI.prototype.uploadFile = async function (itemId: number, name: string, key: string, data: ArrayBuffer, onUpload?: (p: any) => void): Promise<void> {
    const encryptedData = new TextEncoder().encode(await aesEncrypt(await b64encode(data), key))
    const encryptedFileName = await aesEncrypt(name, key)
    await this.http.putBinaryData(`/api/item/file/upload/${itemId}/${encryptedFileName}`, encryptedData, onUpload)
}

ZHTClientAPI.prototype.deleteFile = async function(itemId: number, mappedFileName: string): Promise<void> {
    await this.http.delete(`/api/item/file/delete/${itemId}/${mappedFileName}`)
}

export default {}