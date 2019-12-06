import {ZHTClientAPI} from './base';
import { EncryptedItemIndexData, ItemIndexData, ZHTItemQueryPaging, UpdateMetaRequest } from '../data/item';
import { rsaDecrypt, rsaEncrypt, rsaDecryptWrapped, rsaEncryptWrapped } from '../utils/crypto/rsa';
import { ItemTagData, AddItemTagResponse, AddItemTagRequest } from '../data/tag';
import { CreateItemResult, CreateItemRequest, EncryptedCreateItemRequest, CreateItemResponse } from '../../lib/data/item';
import { aesGenKey, aesDecrypt, aesEncrypt, aesDecryptWrapped, aesEncryptWrapped } from '../utils/crypto/aes';
import { Moment } from 'moment';

declare module './base' {
    interface ZHTClientAPI {
        getItemsTotal(): Promise<number>
        getItem<Meta extends {}>(id: number, privateKey: string, metaParser: MetaParser<Meta>): Promise<ItemIndexData<Meta>>
        
        queryItemList<Meta extends {}>(offset: number, limit: number, privateKey: string, metaParser: MetaParser<Meta>): Promise<ItemIndexData<Meta>[]>
        
        createItem<Meta extends {}>(request: CreateItemRequest<Meta>, publicKey: string): Promise<CreateItemResult>
        updateItemMeta<Meta extends {}>(itemId: number, meta: Meta, publicKey: string): Promise<void>
        deleteItem(id: number): Promise<void>


        deletedItemIdsAfter(after: Moment): Promise<number[]>
        updatedItemIdsAfter(after: Moment): Promise<number[]>
        updatedItemsAfter<Meta extends {}>(after: Moment, privateKey: string, metaParser: (x: any) => Meta): AsyncGenerator<ItemIndexData<Meta>>

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
        const key = await rsaDecryptWrapped(encryptedItem.encryptedKey, privateKey)
        const metaText = await aesDecryptWrapped(encryptedItem.encryptedMeta, key)
        const meta = await Promise.resolve(metaParser(JSON.parse(metaText)))
        const tags: ItemTagData[] = await Promise.all(encryptedItem.encryptedTags.map(async t => ({
            id: t.id,
            tag: await aesDecryptWrapped(t.encryptedTag, key)
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
    const encryptedKey = await rsaEncryptWrapped(key, publicKey)
    const encryptedMeta = await aesEncryptWrapped(JSON.stringify(request.meta), key)
    const encryptedTags = await Promise.all(request.tags.map(t => aesEncryptWrapped(t, key)))
    const {id} = await this.http.post<CreateItemResponse, EncryptedCreateItemRequest>("/api/item/create", {
        encryptedKey, encryptedMeta, encryptedTags
    })
    return {id, key}
}

ZHTClientAPI.prototype.updateItemMeta = async function <Meta extends {}>(itemId: number, meta: Meta, itemKey: string): Promise<void>{
    const encryptedMeta = await aesEncryptWrapped(JSON.stringify(meta), itemKey)
    await this.http.put<void, UpdateMetaRequest>("/api/item/update/meta", {encryptedMeta, itemId})
}

ZHTClientAPI.prototype.deleteItem = async function(id: number): Promise<void> {
    await this.http.delete<void>(`/api/item/delete/${id}`)
}

ZHTClientAPI.prototype.deletedItemIdsAfter = async function (after: Moment): Promise<number[]> {
    return await this.http.get<number[]>(`/api/item/deleted/after/${after.unix() * 1000 + after.milliseconds()}`)
}

ZHTClientAPI.prototype.updatedItemIdsAfter = async function (after: Moment): Promise<number[]> {
    return await this.http.get<number[]>(`/api/item/updated/after/${after.unix() * 1000 + after.milliseconds()}`)
}

ZHTClientAPI.prototype.updatedItemsAfter = async function* <Meta extends {}>(after: Moment, privateKey: string, metaParser: (x: any) => Meta): AsyncGenerator<ItemIndexData<Meta>> {
    const itemList = await this.updatedItemIdsAfter(after)
    for(let id of itemList){
        yield await this.getItem<Meta>(id, privateKey, metaParser)
    }
}

ZHTClientAPI.prototype.addTag = async function (itemId: number, tag: string, itemKey: string): Promise<AddItemTagResponse> {
    const encryptedTag = await aesEncryptWrapped(tag, itemKey)
    return await this.http.post<AddItemTagResponse, AddItemTagRequest>("/api/item/tag/add", {itemId, encryptedTag})
}

ZHTClientAPI.prototype.deleteTag = async function (tagId: number): Promise<void> {
    await this.http.delete<void>(`/api/item/tag/delete/${tagId}`)
}

export default {} // work around