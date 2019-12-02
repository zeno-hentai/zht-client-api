import {Crypto as WebCrypto} from '@peculiar/webcrypto'
import { b64encode, b64decode, urlSafeB64Encode, urlSafeB64Decode } from './base64';

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

export async function hashToAesKey(text: string): Promise<ArrayBuffer>{
  const {subtle} = new WebCrypto()
  const enc = new TextEncoder()
  return await subtle.digest('SHA-256', enc.encode(text))
}

// export async function aesEncrypt(plainText: string, key: string): Promise<string> {
//     return CryptoJS.AES.encrypt(plainText, key).toString().replace(/\//g, '_')
// }

// export async function aesDecrypt(plainText: string, key: string): Promise<string> {
//     return CryptoJS.AES.decrypt(plainText.replace(/_/g, '/'), key).toString(CryptoJS.enc.Utf8)
// }

function getAlgorithm(hashedKey: ArrayBuffer): AesCfbParams{
  const len = 16
  const k = new Uint8Array(hashedKey)
  const iv = new Uint8Array(len)
  for(let i=0; i<k.byteLength; i++){
    iv[i] ^= k[i]
  }
  return {
    name: 'AES-CBC',
    iv
  }
}

const {subtle} = new WebCrypto()

async function importFromKey(key: string): Promise<[AesCfbParams, CryptoKey]> {
  const hashedKey = await hashToAesKey(key)
  const algo = getAlgorithm(hashedKey)
  const importedKey = await subtle.importKey('raw', hashedKey, 'AES-CBC', true, ['encrypt', 'decrypt'])
  return [algo, importedKey]
} 

export async function aesEncrypt(data: ArrayBuffer, key: string): Promise<ArrayBuffer> {
  const [algo, ik] = await importFromKey(key)
  return await subtle.encrypt(algo, ik, data)
}

export async function aesDecrypt(encrypted: ArrayBuffer, key: string): Promise<ArrayBuffer> {
  const [algo, ik] = await importFromKey(key)
  return await subtle.decrypt(algo, ik, encrypted)
}

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export async function aesEncryptWrapped(data: string, key: string): Promise<string> {
  return b64encode(await aesEncrypt(textEncoder.encode(data), key))
}

export async function aesDecryptWrapped(encrypted: string, key: string): Promise<string> {
  return textDecoder.decode(await aesDecrypt(b64decode(encrypted), key))
}

export async function aesEncryptWrappedUrlSafe(data: string, key: string): Promise<string> {
  return urlSafeB64Encode(await aesEncrypt(textEncoder.encode(data), key))
}

export async function aesDecryptWrappedUrlSafe(encrypted: string, key: string): Promise<string> {
  return textDecoder.decode(await aesDecrypt(urlSafeB64Decode(encrypted), key))
}