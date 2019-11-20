export interface EncryptedItemTagData {
    id: number
    encryptedTag: string
}

export interface ItemTagData {
    id: number
    tag: string
}

export interface AddItemTagRequest {
    itemId: number
    encryptedTag: string
}

export interface AddItemTagResponse {
    id: number
    itemId: number
    encryptedTag: string
}