import {ZHTWorkerClientAPI} from './base';
import { ZHTResourcePackBuilder } from '../utils/packageZip';

declare module './base' {
    interface ZHTWorkerClientAPI {
        uploadPackageData(data: ArrayBuffer, onUploadProgress?: OnUploadProgress): Promise<ZHTUploadPackageResponse>
        uploadPackage(builder: ZHTResourcePackBuilder, publicKey: string, onUploadProgress?: OnUploadProgress): Promise<ZHTUploadPackageResponse>
        uploadPackagePullingPublicKey(builder: ZHTResourcePackBuilder, onUploadProgress?: OnUploadProgress): Promise<ZHTUploadPackageResponse>
    }
}

type OnUploadProgress = (p: any) => void
export interface ZHTUploadPackageResponse {id: number}

ZHTWorkerClientAPI.prototype.uploadPackageData = async function(data: ArrayBuffer, onUploadProgress?: OnUploadProgress): Promise<ZHTUploadPackageResponse> {
    return await this.http.postBinaryData<ZHTUploadPackageResponse>("/api/api/upload", data, onUploadProgress)
}

ZHTWorkerClientAPI.prototype.uploadPackage = async function (builder: ZHTResourcePackBuilder, publicKey: string, onUploadProgress?: OnUploadProgress): Promise<ZHTUploadPackageResponse> {
    const data = await builder.build(publicKey)
    return await this.uploadPackageData(data, onUploadProgress)
}

ZHTWorkerClientAPI.prototype.uploadPackagePullingPublicKey = async function (builder: ZHTResourcePackBuilder, onUploadProgress?: OnUploadProgress): Promise<ZHTUploadPackageResponse> {
    const publicKey = await this.getPublicKey()
    return await this.uploadPackage(builder, publicKey, onUploadProgress)
}

export default {}