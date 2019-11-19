import {ZHTWorkerClientAPI} from './base';

declare module './base' {
    interface ZHTWorkerClientAPI {
        getPublicKey(): Promise<string>
    }
}

ZHTWorkerClientAPI.prototype.getPublicKey = async function(): Promise<string> {
    return this.http.get<string>("/api/api/public-key")
}


export default {}