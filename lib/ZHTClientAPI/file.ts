import {ZHTClientAPI} from './base';
import { aesDecrypt, aesEncrypt } from '../utils/crypto/aes';
import { b64decode } from '../utils/crypto/base64';

declare module './base' {
    interface ZHTClientAPI {
        getFileMap(itemId: number, key: string): Promise<{[key: string]: string}>
        getFileData(itemId: number, mappedFileName: string, privateKey: string, onDownloadProgress?: (progressEvent: any) => void): Promise<ArrayBuffer>
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

export default {}