import {Crypto as WebCrypto} from '@peculiar/webcrypto'
import Base64ArrayBuffer from 'base64-arraybuffer'

export async function sha256Hash (plainText: string): Promise<string> {
    const {subtle} = new WebCrypto()
    const enc = new TextEncoder()
    const raw = await subtle.digest('SHA-256', enc.encode(plainText))
    return Base64ArrayBuffer.encode(raw)
}