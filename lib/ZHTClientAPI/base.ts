import { ZHTHttpClient, ZHTHttpClientOptions } from './client';

export type ZHTClientOptions = ZHTHttpClientOptions

export class ZHTClientAPI {
    http: ZHTHttpClient
    constructor(options: ZHTClientOptions) {
        this.http = new ZHTHttpClient(options)
    }
}