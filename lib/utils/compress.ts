import pako from 'pako';

export async function compress(data: ArrayBuffer): Promise<ArrayBuffer>{
    return pako.deflate(new Uint8Array(data)).buffer
}

export async function decompress(encrypted: ArrayBuffer): Promise<ArrayBuffer>{
    return pako.inflate(new Uint8Array(encrypted)).buffer
}