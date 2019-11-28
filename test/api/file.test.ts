import {expect} from 'chai'
import { getClient, getWorkerClient } from './utils/client';
import ZHTWorkerClientAPI from '../../lib/ZHTWorkerClientAPI';
import { generateTestingPackage, ZHTTestingPackage, ZHTTestingMeta } from './utils/file';
import { b64encode } from '../../lib/utils/crypto/base64';
import { decryptItemData } from '../../lib';
import moment from 'moment'

describe('item testing', () => {
    const client = getClient()
    let workerClient: ZHTWorkerClientAPI | null
    let testPack: ZHTTestingPackage | null
    let itemId: number | null
    let privateKey: string | null
    let itemKey: string | null
    let publicKey: string | null
    const PASSWORD = "password"
    const afterMoment = moment()
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

    it('get key pair', async () => {
        const user = await client.infoDecrypted(PASSWORD)
        expect(user.authorized).is.true
        if(user.authorized) {
            privateKey = user.privateKey
            publicKey = user.publicKey
        }
    })

    it('upload package', async () => {
        expect(workerClient).not.null
        expect(testPack).not.null
        expect(publicKey).not.null
        if(workerClient && testPack && publicKey) {
            const uploadedItem = await workerClient.createItem<ZHTTestingMeta>({
                meta: testPack.data.meta,
                tags: testPack.data.tags
            }, publicKey)
            itemId = uploadedItem.id
            itemKey = uploadedItem.key
            for(let [name, data] of Object.entries(testPack.files)){
                console.log(`      upload: ${name}`)
                await workerClient.uploadItemFile(itemId, name, itemKey, data)
            }
        }
    })

    it('check updated', async () => {
        expect(itemId).is.not.null
        expect(testPack).not.null
        expect(privateKey).not.null
        if(itemId && testPack && privateKey) {
            for await(let item of client.updatedItemsAfter<ZHTTestingMeta>(afterMoment, privateKey, s => s as ZHTTestingMeta)) {
                expect(item.id).eq(itemId)
            }
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

    it('update item', async () => {
        expect(itemId).is.not.null
        expect(itemKey).not.null
        expect(privateKey).not.null
        expect(testPack).not.null
        if(itemId && testPack && itemKey && privateKey) {
            const newTitle = 'new_test_title'
            const newMeta: ZHTTestingMeta = {
                ...testPack.data.meta,
                title: newTitle
            }
            await client.updateItemMeta<ZHTTestingMeta>(itemId, newMeta, itemKey)
            const newItem = await client.getItem<ZHTTestingMeta>(itemId, privateKey, p => p as ZHTTestingMeta)
            expect(newItem.meta.title).eq(newTitle)
        }
    })

    let testMappedName: string | null
    const TEST_FILE_NAME = 'test_file_name.txt'
    const TEST_FILE_CONTENT = new TextEncoder().encode('test_content_'.repeat(1000))

    it('upload file', async () => {
        expect(itemId).is.not.null
        expect(itemKey).is.not.null
        if(itemId  && itemKey) {
            await client.uploadFile(itemId, TEST_FILE_NAME, itemKey, TEST_FILE_CONTENT)
            const fileMap = await client.getFileMap(itemId, itemKey)
            testMappedName = fileMap[TEST_FILE_NAME]
            expect(!!testMappedName).is.true
            const decryptedContent = await client.getFileData(itemId, testMappedName, itemKey)
            expect(b64encode(decryptedContent)).eq(b64encode(TEST_FILE_CONTENT))
        }
    })

    it('delete file', async () => {
        expect(itemId).is.not.null
        expect(itemKey).is.not.null
        expect(testMappedName).is.not.null
        if(itemId && itemKey && testMappedName) {
            await client.deleteFile(itemId, testMappedName)
            const fileMap = await client.getFileMap(itemId, itemKey)
            const mappedName = fileMap[TEST_FILE_NAME]
            expect(!!mappedName).is.false
        }
    })

    it('test file', async () => {
        expect(itemId).is.not.null
        expect(testPack).not.null
        expect(privateKey).not.null
        if(itemId !== null && testPack && privateKey) {
            const item = await client.getItem(itemId, privateKey, data => data as ZHTTestingMeta)
            const fileMap = await client.getFileMap(itemId, item.key)
            const [name, mappedName] = Object.entries(fileMap)[0]
            const data = await client.getFileData(itemId, mappedName, item.key)
            console.log(`      downloading ${name} => ${mappedName}`)
            expect(b64encode(data)).eq(b64encode(testPack.files[name]))
        }
    })

    it('test tag', async () => {
        expect(itemKey).not.null
        expect(privateKey).not.null
        expect(itemId).not.null
        const testTag = 'test_tag'
        if(itemKey && itemId && privateKey) {
            const res = await client.addTag(itemId, testTag, itemKey)
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

    it('delete record', async () => {
        expect(itemId).is.not.null
        if(itemId) {
            const idList = await client.deletedItemIdsAfter(afterMoment)
            expect(idList.includes(itemId)).true
        }
    })
})