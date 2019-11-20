import { CreateItemRequest } from '../../../lib/data/item';
export interface ZHTTestingMeta {
    title: string
    type: "testing_file"
    fileNumber: number
}

export interface ZHTTestingPackage {
    data: CreateItemRequest<ZHTTestingMeta>
    files: {[key: string]: ArrayBuffer}
}

export function generateTestingPackage(title: string): ZHTTestingPackage {
    const fileNumber = 15
    const tagNumber = 15
    const meta: ZHTTestingMeta = {
        title,
        type: "testing_file",
        fileNumber
    }
    const tags: string[] = []
    for(let i=0; i<tagNumber; i++){
        tags.push(`tag_${i}`)
    }
    const data: CreateItemRequest<ZHTTestingMeta> = {
        meta,
        tags
    }
    const files: {[key: string]: ArrayBuffer} = {}
    const enc = new TextEncoder()
    for(let i=0; i<fileNumber; i++){
        files[`file_${i}`] = enc.encode(`file_content_${i}`.repeat(1024))
    }
    return {data, files}
}
