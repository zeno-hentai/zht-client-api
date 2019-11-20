import {expect} from 'chai'
import { getClient, getWorkerClient } from './utils/client';
import ZHTWorkerClientAPI from '../../lib/ZHTWorkerClientAPI';
import { generateTestingPackage, ZHTTestingPackage, convertTestingPackageToBuilder, ZHTTestingMeta } from './utils/file';
import { ZHTResourcePackBuilder } from '../../lib/utils/packageZip';
import { b64encode } from '../../lib/utils/crypto/base64';

describe('item testing', () => {
    const client = getClient()
    let workerClient: ZHTWorkerClientAPI | null
    let testPack: ZHTTestingPackage | null
    let itemId: number | null
    let privateKey: string | null
    let publicKey: string | null
    const PASSWORD = "password"
    before(async () => {
        await client.register({username: `user_${new Date().getTime()}`, password: PASSWORD, masterKey: 'admin-secret'})
        const tokenResult = await client.createToken("test api")
        workerClient = getWorkerClient(tokenResult.token)
    })
    after(async () => {
        await client.deleteUser()
    })

    it('generate package', async () => {
        expect(workerClient).not.null
        if(workerClient) {
            testPack = generateTestingPackage("test package")
        }
    })

    it('upload package', async () => {
        expect(workerClient).not.null
        expect(testPack).not.null
        if(workerClient && testPack) {
            const builder: ZHTResourcePackBuilder<ZHTTestingMeta> = await convertTestingPackageToBuilder(testPack)
            const uploadedItem = await workerClient.uploadPackagePullingPublicKey(builder)
            itemId = uploadedItem.id
        }
    })

    it('get key pair', async () => {
        const user = await client.infoDecrypted(PASSWORD)
        expect(user.authorized).is.true
        if(user.authorized) {
            privateKey = user.privateKey
            publicKey = user.publicKey
        }
    })

    it('check item data', async () => {
        expect(itemId).is.not.null
        expect(testPack).not.null
        expect(privateKey).not.null
        if(itemId !== null && testPack && privateKey) {
            const total = await client.getItemsTotal()
            expect(total).eq(1)
            const itemList = await client.queryItemList<ZHTTestingMeta>(0, 10, privateKey, data => data as ZHTTestingMeta)
            expect(itemList.length).eq(1)
            const listItem = itemList[0]
            if(listItem){
                expect(listItem.id).eq(itemId)
                expect(listItem.meta.title).eq(testPack.data.meta.title)
            }

            const item = await client.getItem(itemId, privateKey, data => data as ZHTTestingMeta)
            expect(item.id).eq(itemId)
            expect(listItem.meta.title).eq(testPack.data.meta.title)
        }
    })

    it('test file', async () => {
        expect(itemId).is.not.null
        expect(testPack).not.null
        expect(privateKey).not.null
        if(itemId !== null && testPack && privateKey) {
            const item = await client.getItem(itemId, privateKey, data => data as ZHTTestingMeta)
            const fileMap = await client.getFileMap(itemId, item.key)
            for(let [name, mappedName] of Object.entries(fileMap)) {
                const data = await client.getFileData(itemId, mappedName, item.key)
                expect(b64encode(data)).eq(b64encode(testPack.files[name]))
            }
        }
    })

    it('test tag', async () => {
        expect(publicKey).not.null
        expect(privateKey).not.null
        expect(itemId).not.null
        const testTag = 'test_tag'
        if(publicKey && itemId && privateKey) {
            const res = await client.addTag(itemId, testTag, publicKey)
            expect(res.itemId).eq(itemId)
            const item = await client.getItem(itemId, privateKey, data => data as ZHTTestingMeta)
            expect(item.tags.some(t => t.id == res.id && t.tag == testTag)).true
            await client.deleteTag(res.id)
            const item2 = await client.getItem(itemId, privateKey, data => data as ZHTTestingMeta)
            expect(item2.tags.some(t => t.tag == testTag)).false
        }
    })

    it('delete item', async () => {
        expect(itemId).is.not.null
        if(itemId){
            await client.deleteItem(itemId)
            const total = await client.getItemsTotal()
            expect(total).eq(0)
        }
    })
})