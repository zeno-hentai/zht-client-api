import CryptoJS from 'crypto-js'

export async function aesEncrypt(plainText: string, key: string): Promise<string> {
    return CryptoJS.AES.encrypt(plainText, key).toString()
}

export async function aesDecrypt(plainText: string, key: string): Promise<string> {
    return CryptoJS.AES.decrypt(plainText, key).toString(CryptoJS.enc.Utf8)
}