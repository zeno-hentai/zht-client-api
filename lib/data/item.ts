import { EncryptedItemTagData, ItemTagData } from './tag';

export interface ZHTItemQueryPaging {
    total: number
}

export interface CreateItemResponse {
    id: number
}

export interface CreateItemResult {
    id: number
    key: string
}

export interface CreateItemRequest<Meta> {
    meta: Meta
    tags: string[]
}

export interface EncryptedCreateItemRequest {
    encryptedMeta: string
    encryptedKey: string
    encryptedTags: string[]
}

export interface EncryptedItemIndexData {
    id: number
    encryptedMeta: string
    encryptedKey: string
    encryptedTags: EncryptedItemTagData[]
}

export interface ItemIndexData<Meta = any> {
    id: number
    meta: Meta
    key: string
    tags: ItemTagData[]
}