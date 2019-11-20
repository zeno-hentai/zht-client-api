import Base64ArrayBuffer from 'base64-arraybuffer'

export function b64encode(buf: ArrayBuffer): string {
    return Base64ArrayBuffer.encode(buf).replace(/\//g, "_")
}

export function b64decode(text: string): ArrayBuffer {
    return Base64ArrayBuffer.decode(text.replace(/_/g, "/"))
}