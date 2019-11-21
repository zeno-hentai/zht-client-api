import {ZHTClientAPI} from './base';
import { EncryptedItemIndexData, ItemIndexData, ZHTItemQueryPaging, UpdateMetaRequest } from '../data/item';
import { rsaDecrypt, rsaEncrypt } from '../utils/crypto/rsa';
import { ItemTagData, AddItemTagResponse, AddItemTagRequest } from '../data/tag';
import { CreateItemResult, CreateItemRequest, EncryptedCreateItemRequest, CreateItemResponse } from '../../lib/data/item';
import { aesGenKey } from '../utils/crypto/aes';

declare module './base' {
    interface ZHTClientAPI {
        getItemsTotal(): Promise<number>
        getItem<Meta extends {}>(id: number, privateKey: string, metaParser: MetaParser<Meta>): Promise<ItemIndexData<Meta>>
        
        queryItemList<Meta extends {}>(offset: number, limit: number, privateKey: string, metaParser: MetaParser<Meta>): Promise<ItemIndexData<Meta>[]>
        
        createItem<Meta extends {}>(request: CreateItemRequest<Meta>, publicKey: string): Promise<CreateItemResult>
        updateItemMeta<Meta extends {}>(itemId: number, meta: Meta, publicKey: string): Promise<void>
        deleteItem(id: number): Promise<void>

        addTag(itemId: number, tag: string, publicKey: string): Promise<AddItemTagResponse>
        deleteTag(tagId: number): Promise<void>
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

ZHTClientAPI.prototype.createItem = async function <Meta extends {}>(request: CreateItemRequest<Meta>, publicKey: string): Promise<CreateItemResult> {
    const key = await aesGenKey()
    const encryptedKey = await rsaEncrypt(key, publicKey)
    const encryptedMeta = await rsaEncrypt(JSON.stringify(request.meta), publicKey)
    const encryptedTags = await Promise.all(request.tags.map(t => rsaEncrypt(t, publicKey)))
    const {id} = await this.http.post<CreateItemResponse, EncryptedCreateItemRequest>("/api/item/create", {
        encryptedKey, encryptedMeta, encryptedTags
    })
    return {id, key}
}

ZHTClientAPI.prototype.updateItemMeta = async function <Meta extends {}>(itemId: number, meta: Meta, publicKey: string): Promise<void>{
    const encryptedMeta = await rsaEncrypt(JSON.stringify(meta), publicKey)
    await this.http.put<void, UpdateMetaRequest>("/api/item/update/meta", {encryptedMeta, itemId})
}

ZHTClientAPI.prototype.deleteItem = async function(id: number): Promise<void> {
    await this.http.delete<void>(`/api/item/delete/${id}`)
}

ZHTClientAPI.prototype.addTag = async function (itemId: number, tag: string, publicKey: string): Promise<AddItemTagResponse> {
    const encryptedTag = await rsaEncrypt(tag, publicKey)
    return await this.http.post<AddItemTagResponse, AddItemTagRequest>("/api/item/tag/add", {itemId, encryptedTag})
}

ZHTClientAPI.prototype.deleteTag = async function (tagId: number): Promise<void> {
    await this.http.delete<void>(`/api/item/tag/delete/${tagId}`)
}

export default {} // work around