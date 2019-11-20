import CryptoJS from 'crypto-js'
import {Crypto as WebCrypto} from '@peculiar/webcrypto'
import { b64encode } from './base64';

export async function aesGenKey(): Promise<string> {
    const crypto = new WebCrypto()
    const key = await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256
        },
        true,
        ["encrypt", "decrypt"]
      )
      return b64encode(await crypto.subtle.exportKey('raw', key))
}

export async function aesEncrypt(plainText: string, key: string): Promise<string> {
    return CryptoJS.AES.encrypt(plainText, key).toString().replace(/\//g, '_')
}

export async function aesDecrypt(plainText: string, key: string): Promise<string> {
    return CryptoJS.AES.decrypt(plainText.replace(/_/g, '/'), key).toString(CryptoJS.enc.Utf8)
}