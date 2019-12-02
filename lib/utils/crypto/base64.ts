import Base64ArrayBuffer from 'base64-arraybuffer'

export function b64encode(buf: ArrayBuffer): string {
    return Base64ArrayBuffer.encode(buf)
}

export function b64decode(text: string): ArrayBuffer {
    return Base64ArrayBuffer.decode(text)
}

export function urlSafeB64Encode(buf: ArrayBuffer): string {
    return b64encode(buf).replace(/\//g, "_").replace(/\+/g, '-')
}

export function urlSafeB64Decode(text: string): ArrayBuffer {
    return b64decode(text.replace(/_/g, "/").replace(/-/g, '+'))
}