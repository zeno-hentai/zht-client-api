import {Crypto as WebCrypto} from '@peculiar/webcrypto'
import { b64encode } from './base64';

export async function sha256Hash (plainText: string): Promise<string> {
    const {subtle} = new WebCrypto()
    const enc = new TextEncoder()
    const raw = await subtle.digest('SHA-256', enc.encode(plainText))
    return b64encode(raw)
}