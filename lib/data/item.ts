import { EncryptedItemTagData, ItemTagData } from './tag';

export interface ZHTItemQueryPaging {
    total: number
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