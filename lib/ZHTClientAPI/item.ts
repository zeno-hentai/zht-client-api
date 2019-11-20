import {ZHTClientAPI} from './base';
import { EncryptedItemIndexData, ItemIndexData, ZHTItemQueryPaging } from '../data/item';
import { rsaDecrypt } from '../utils/crypto/rsa';
import { ItemTagData } from '../data/tag';

declare module './base' {
    interface ZHTClientAPI {
        getItemsTotal(): Promise<number>
        getItem<Meta extends {}>(id: number, privateKey: string, metaParser: MetaParser<Meta>): Promise<ItemIndexData>
        queryItemList<Meta extends {}>(offset: number, limit: number, privateKey: string, metaParser: MetaParser<Meta>): Promise<ItemIndexData<Meta>[]>
        deleteItem(id: number): Promise<void>
    }
}

ZHTClientAPI.prototype.getItemsTotal = async function(): Promise<number>{
    const res = await this.http.get<ZHTItemQueryPaging>("/api/item/paging")
    return res.total
}

export type MetaParser<Meta> = (data: any) => Meta | Promise<Meta>

export async function decryptItemData<Meta extends {}>(
    encryptedItem: EncryptedItemIndexData, 
    privateKey: string, 
    metaParser: MetaParser<Meta>): Promise<ItemIndexData<Meta>> {
        const key = await rsaDecrypt(encryptedItem.encryptedKey, privateKey)
        const metaText = await rsaDecrypt(encryptedItem.encryptedMeta, privateKey)
        const meta = await Promise.resolve(metaParser(JSON.parse(metaText)))
        const tags: ItemTagData[] = await Promise.all(encryptedItem.encryptedTags.map(async t => ({
            id: t.id,
            tag: await rsaDecrypt(t.encryptedTag, privateKey)
        })))
        return {key, meta, tags, id: encryptedItem.id}
}

ZHTClientAPI.prototype.getItem = async function<Meta extends {}>(id: number, privateKey: string, metaParser: MetaParser<Meta>): Promise<ItemIndexData<Meta>> {
    const encryptedItem = await this.http.get<EncryptedItemIndexData>(`/api/item/get/${id}`)
    return await decryptItemData<Meta>(encryptedItem, privateKey, metaParser)
}

ZHTClientAPI.prototype.queryItemList = async function <Meta extends {}>(offset: number, limit: number, privateKey: string, metaParser: MetaParser<Meta>): Promise<ItemIndexData<Meta>[]> {
    const encryptedItemList = await this.http.get<EncryptedItemIndexData[]>(`/api/item/query/${offset}/${limit}`)
    return await Promise.all(encryptedItemList.map(async item => await decryptItemData<Meta>(item, privateKey, metaParser)))
}

ZHTClientAPI.prototype.deleteItem = async function(id: number): Promise<void> {
    await this.http.delete<void>(`/api/item/delete/${id}`)
}

export default {} // work around