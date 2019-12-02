import {ZHTClientAPI} from './base';
import { aesDecrypt, aesEncrypt, aesDecryptWrappedUrlSafe, aesEncryptWrappedUrlSafe } from '../utils/crypto/aes';
import { decompress, compress } from '../utils/compress';

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
        result[await aesDecryptWrappedUrlSafe(n, key)] = v
    }
    return result
}

ZHTClientAPI.prototype.getFileData = async function (itemId: number, mappedFileName: string, key: string, onDownloadProgress?: (progressEvent: any) => void): Promise<ArrayBuffer> {
    const data = await this.http.getBinaryData(`/api/file/data/${itemId}/${mappedFileName}`, onDownloadProgress)
    const compressedData = await aesDecrypt(data, key)
    return await decompress(compressedData)
}

ZHTClientAPI.prototype.uploadFile = async function (itemId: number, name: string, key: string, data: ArrayBuffer, onUpload?: (p: any) => void): Promise<void> {
    const compressedData = await compress(data)
    const encryptedData = await aesEncrypt(compressedData, key)
    const encryptedFileName = await aesEncryptWrappedUrlSafe(name, key)
    await this.http.putBinaryData(`/api/item/file/upload/${itemId}/${encryptedFileName}`, encryptedData, onUpload)
}

ZHTClientAPI.prototype.deleteFile = async function(itemId: number, mappedFileName: string): Promise<void> {
    await this.http.delete(`/api/item/file/delete/${itemId}/${mappedFileName}`)
}

export default {}