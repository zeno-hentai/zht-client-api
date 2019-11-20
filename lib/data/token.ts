export interface APITokenCreateRequest {
    title: string
}

export interface APITokenCreateResponse {
    id: number
    title: string
    token: string
}

export interface APITokenData {
    id: number
    title: string
}
