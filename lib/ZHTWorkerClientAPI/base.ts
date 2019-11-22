import Axios, { AxiosInstance, AxiosProxyConfig } from 'axios';
import { ZHTHttpClient } from '../utils/net/http';

const API_TOKEN_HEADER_NAME = 'ZHT-API-TOKEN'

export interface ZHTWorkerClientAPIOptions {
    apiToken: string
    baseURL: string,
    proxy: AxiosProxyConfig | null
}

export class ZHTWorkerClientAPI {
    http: ZHTHttpClient
    apiToken: string
    constructor(options: ZHTWorkerClientAPIOptions){
        this.apiToken=  options.apiToken
        this.http = new ZHTHttpClient({
            baseURL: options.baseURL,
            axiosOptions: {
                headers: {
                    [API_TOKEN_HEADER_NAME]: options.apiToken,
                },
                proxy: options.proxy || undefined,
            }
        })
    }
}
