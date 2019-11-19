import CryptoJS from 'crypto-js'
import Base64ArrayBuffer from 'base64-arraybuffer'

export async function aesGenKey(): Promise<string> {
    const key = await window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256
        },
        true,
        ["encrypt", "decrypt"]
      )
      return Base64ArrayBuffer.encode(await crypto.subtle.exportKey('raw', key))
}

export async function aesEncrypt(plainText: string, key: string): Promise<string> {
    return CryptoJS.AES.encrypt(plainText, key).toString()
}

export async function aesDecrypt(plainText: string, key: string): Promise<string> {
    return CryptoJS.AES.decrypt(plainText, key).toString(CryptoJS.enc.Utf8)
}