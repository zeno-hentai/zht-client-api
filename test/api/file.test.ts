import {expect} from 'chai'
import { getClient, getWorkerClient } from './utils/client';
import ZHTWorkerClientAPI from '../../lib/ZHTWorkerClientAPI';
import { generateTestingPackage, ZHTTestingPackage, convertTestingPackageToBuilder, ZHTTestingMeta } from './utils/file';
import { ZHTResourcePackBuilder } from '../../lib/utils/packageZip';

describe('item testing', () => {
    const client = getClient()
    let workerClient: ZHTWorkerClientAPI | null
    let testPack: ZHTTestingPackage | null
    before(async () => {
        await client.register({username: `user_${new Date().getTime()}`, password: 'password', masterKey: 'admin-secret'})
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

    it('generate package', async () => {
        expect(workerClient).not.null
        expect(testPack).not.null
        if(workerClient && testPack) {
            const builder: ZHTResourcePackBuilder<ZHTTestingMeta> = await convertTestingPackageToBuilder(testPack)
            await workerClient.uploadPackagePullingPublicKey(builder)
        }
    })
})