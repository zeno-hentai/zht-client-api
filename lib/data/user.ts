export interface ZHTUserInfo {
    authorized: true
    id: number
    username: string
    publicKey: string
    encryptedPrivateKey: string
}

export interface ZHTDecryptedUserInfo {
    authorized: true
    id: number
    username: string
    publicKey: string
    privateKey: string
}

export interface ZHTUserUnauthorized {
    authorized: false
}