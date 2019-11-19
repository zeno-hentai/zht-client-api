export interface ZHTUserInfo {
    authorized: true
    id: number
    username: string
    publicKey: string
    encryptedPrivateKey: string
}

export interface ZHTUserUnauthorized {
    authorized: false
}