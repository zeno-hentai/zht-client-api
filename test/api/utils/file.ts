import { ItemIndexData } from "../../../lib";
import { ZHTResourcePackBuilderOptions } from '../../../lib/utils/packageZip';
import { ZHTResourcePackBuilder } from '../../../lib/utils/packageZip';

export interface ZHTTestingMeta {
    title: string
    type: "testing_file"
    fileNumber: number
}

export interface ZHTTestingPackage {
    data: ZHTResourcePackBuilderOptions<ZHTTestingMeta>
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
    const data: ZHTResourcePackBuilderOptions<ZHTTestingMeta> = {
        meta,
        tags
    }
    const files: {[key: string]: ArrayBuffer} = {}
    const enc = new TextEncoder()
    for(let i=0; i<fileNumber; i++){
        files[`file_${i}`] = enc.encode(`file_content_${i}`.repeat(5000))
    }
    return {data, files}
}

export async function convertTestingPackageToBuilder(testPack: ZHTTestingPackage): Promise<ZHTResourcePackBuilder<ZHTTestingMeta>> {
    const builder = new ZHTResourcePackBuilder<ZHTTestingMeta>(testPack.data)
    for(let [name, data] of Object.entries(testPack.files)){
        await builder.addFile(name, data)
    }
    return builder
}