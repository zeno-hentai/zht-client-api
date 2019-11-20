import {ZHTClientAPI} from './base';
import { APITokenCreateResponse, APITokenData, APITokenCreateRequest } from '../data/token';

declare module './base' {
    interface ZHTClientAPI {
        createToken(title: string): Promise<APITokenCreateResponse>
        queryTokens(): Promise<APITokenData[]>
        deleteToken(id: number): Promise<void>
    }
}

ZHTClientAPI.prototype.createToken = async function(title: string): Promise<APITokenCreateResponse> {
    return await this.http.post<APITokenCreateResponse, APITokenCreateRequest>("/api/api/token/create", {title})
}

ZHTClientAPI.prototype.queryTokens = async function(): Promise<APITokenData[]> {
    return await this.http.get<APITokenData[]>("/api/api/token/query")
}

ZHTClientAPI.prototype.deleteToken = async function(id: number): Promise<void> {
    await this.http.delete(`/api/api/token/delete/${id}`)
}

export default {} // work around