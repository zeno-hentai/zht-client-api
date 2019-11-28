import { getClient, getWorkerClient } from './utils/client';
import ZHTWorkerClientAPI from '../../lib/ZHTWorkerClientAPI';
import { expect } from 'chai';
import { WorkerInfo, ZHTWorkerNotificationListener } from '../../lib/data/worker';
import { rsaGenKey } from '../../lib';
describe('worker tests', async () => {
    const client = getClient()
    let workerClient: ZHTWorkerClientAPI | null
    let apiToken: string | null
    let userPrivateKey: string | null
    let userPublicKey: string | null
    let workerInfo: WorkerInfo | null
    const {privateKey: workerPrivateKey, publicKey: workerPublicKey} = await rsaGenKey()
    const TEST_TOKEN_TITLE = "test worker client"
    const TEST_TASK_URL = "test url"
    let triggeredCounter = 0
    let listener: ZHTWorkerNotificationListener | null

    before(async () => {
        await client.register({username: `test_${new Date().getTime()}`, password: 'test', masterKey: 'admin-secret'})
        const user = await client.infoDecrypted('test')
        expect(user.authorized).true
        if(user.authorized){
            userPrivateKey = user.privateKey
        }
        const res = await client.createToken(TEST_TOKEN_TITLE)
        workerClient = getWorkerClient(res.token)
        apiToken = res.token
        userPublicKey = await workerClient.getPublicKey()
    })
    
    after(async () => {
        await client.deleteUser()
    })

    it('register worker client', async () => {
        expect(workerClient && workerInfo && userPublicKey && userPrivateKey).not.null
        if(workerClient && userPublicKey && userPrivateKey) {
            await workerClient.registerWorker()
            const workers = await client.queryWorkers(userPrivateKey)
            expect(workers.length).eq(1)
            expect(workers[0].title).eq(TEST_TOKEN_TITLE)
            expect(workers[0].online).false
            listener = await workerClient.connectWorker({
                userPublicKey, 
                workerPublicKey, 
                onNotification: () => {
                    triggeredCounter ++
                }})
            const workers2 = await client.queryWorkers(userPrivateKey)
            workerInfo = workers2[0]
            expect(workerInfo).not.null
            if(workerInfo){
                expect(workerInfo.online).true
            }
        }
    })

    let taskId: number | null

    it('add task', async () => {
        expect(workerClient && userPrivateKey && userPublicKey && workerInfo).not.null
        if(workerClient && userPublicKey && userPrivateKey && workerInfo) {
            expect(workerInfo.online).true
            if(workerInfo.online){
                await client.addWorkerTask(TEST_TASK_URL, userPublicKey, workerInfo.id, workerInfo.publicKey)
                const tasks = await client.queryWorkerTasks(userPrivateKey)
                expect(tasks.length).eq(1)
                expect(tasks[0].workerId).eq(workerInfo.id)
                expect(tasks[0].status).eq("SUSPENDED")
                taskId = tasks[0].id
            }
        }
    })

    it('poll task', async () => {
        expect(workerClient  && taskId && workerInfo && userPrivateKey).not.null
        if(workerClient && taskId && workerInfo && userPrivateKey) {
            const resp = await workerClient.pollTask(workerPrivateKey)
            expect(resp.hasTask).true
            if(resp.hasTask){
                expect(resp.data.workerId).eq(workerInfo.id)
                expect(resp.data.url).eq(TEST_TASK_URL)
            }
            const tasks = await client.queryWorkerTasks(userPrivateKey)
            expect(tasks[0].status).eq("RUNNING")
        }
    })

    it('failed task', async () => {
        expect(workerClient && taskId && userPrivateKey).not.null
        if(workerClient && taskId && userPrivateKey) {
            await workerClient.taskFailed(taskId)
            const tasks = await client.queryWorkerTasks(userPrivateKey)
            expect(tasks[0].status).eq("FAILED")
        }
    })

    it('retry task', async () => {
        expect(workerClient && taskId && userPrivateKey && userPublicKey).not.null
        if(workerClient && taskId && userPrivateKey && userPublicKey) {
            taskId = await client.retryWorkerTask(taskId, userPrivateKey, userPublicKey)
            const tasks = await client.queryWorkerTasks(userPrivateKey)
            expect(tasks[0].status).eq("SUSPENDED")
            const resp = await workerClient.pollTask(workerPrivateKey)
            expect(resp.hasTask).true
            if(resp.hasTask){
                expect(resp.data.id).eq(taskId)
            }
            const tasks2 = await client.queryWorkerTasks(userPrivateKey)
            expect(tasks2[0].status).eq("RUNNING")
        }
    })

    it('success task', async () => {
        expect(workerClient && taskId && userPrivateKey).not.null
        if(workerClient && taskId && userPrivateKey) {
            await workerClient.taskSuccess(taskId)
            const tasks = await client.queryWorkerTasks(userPrivateKey)
            expect(tasks[0].status).eq("SUCCESS")
        }
    })

    it('check notifier counter', async () => {
        expect(triggeredCounter).eq(4)
    })

    it('close worker', async () => {
        expect(!!(listener && userPrivateKey)).true
        if(listener && userPrivateKey){
            listener.close()
            await new Promise((r, j) => setTimeout(r, 500))
            const workers = await client.queryWorkers(userPrivateKey)
            expect(workers[0].online).false
        }
    })

    it('delete worker', async () => {
        expect(workerInfo && userPrivateKey).not.null
        if(workerInfo && userPrivateKey) {
            await client.deleteWorker(workerInfo.id)
            const workers = await client.queryWorkers(userPrivateKey)
            expect(workers.length).eq(0)
        }
    })
})