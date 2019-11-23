import { getClient, getWorkerClient } from './utils/client';
import ZHTWorkerClientAPI from '../../lib/ZHTWorkerClientAPI';
import { expect } from 'chai';
import { WorkerInfo } from '../../lib/data/worker';
import { createWebSocketClient } from '../../lib/utils/net/ws';
describe('worker tests', () => {
    const client = getClient()
    let workerClient: ZHTWorkerClientAPI | null
    let apiToken: string | null
    let userPrivateKey: string | null
    let userPublicKey: string | null
    let workerInfo: WorkerInfo | null
    let clientPrivateKey: string | null
    const TEST_TOKEN_TITLE = "test worker client"
    const TEST_TASK_URL = "test url"
    let triggeredCounter = 0

    const ws = createWebSocketClient("ws://localhost:8080/api/ws/worker")
    ws.onMessage((s) => {
        triggeredCounter++
    })

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
        ws.close()
    })

    it('register worker client', async () => {
        expect(workerClient && userPublicKey && userPrivateKey).not.null
        if(workerClient && userPublicKey && userPrivateKey) {
            const res = await workerClient.registerWorker(userPublicKey)
            clientPrivateKey = res.privateKey
            const workers = await client.queryWorkers(userPrivateKey)
            expect(workers.length).eq(1)
            workerInfo = workers[0]
            expect(workerInfo.title).eq(TEST_TOKEN_TITLE)
            expect(workerInfo.online).false
        }
    })

    it('connect notifier', async () => {
        expect(apiToken).not.null
        if(apiToken && userPrivateKey){
            ws.send(apiToken)
        }
    })

    let taskId: number | null

    it('add task', async () => {
        expect(workerClient && userPrivateKey && userPublicKey && clientPrivateKey && workerInfo).not.null
        if(workerClient && userPublicKey && userPrivateKey && clientPrivateKey && workerInfo) {
            await client.addWorkerTask(TEST_TASK_URL, userPublicKey, workerInfo)
            const tasks = await client.queryWorkerTasks(userPrivateKey)
            expect(tasks.length).eq(1)
            expect(tasks[0].workerId).eq(workerInfo.id)
            expect(tasks[0].status).eq("SUSPENDED")
            taskId = tasks[0].id
        }
    })

    it('poll task', async () => {
        expect(workerClient && clientPrivateKey && taskId && workerInfo && userPrivateKey).not.null
        if(workerClient && clientPrivateKey && taskId && workerInfo && userPrivateKey) {
            const resp = await workerClient.pollTask(clientPrivateKey)
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
        expect(workerClient && clientPrivateKey && taskId && userPrivateKey).not.null
        if(workerClient && clientPrivateKey && taskId && userPrivateKey) {
            await workerClient.taskFailed(taskId)
            const tasks = await client.queryWorkerTasks(userPrivateKey)
            expect(tasks[0].status).eq("FAILED")
        }
    })

    it('retry task', async () => {
        expect(workerClient && clientPrivateKey && taskId && userPrivateKey).not.null
        if(workerClient && clientPrivateKey && taskId && userPrivateKey) {
            await client.retryWorkerTask(taskId)
            const tasks = await client.queryWorkerTasks(userPrivateKey)
            expect(tasks[0].status).eq("SUSPENDED")
            const resp = await workerClient.pollTask(clientPrivateKey)
            expect(resp.hasTask).true
            if(resp.hasTask){
                expect(resp.data.id).eq(taskId)
            }
            const tasks2 = await client.queryWorkerTasks(userPrivateKey)
            expect(tasks2[0].status).eq("RUNNING")
        }
    })

    it('success task', async () => {
        expect(workerClient && clientPrivateKey && taskId && userPrivateKey).not.null
        if(workerClient && clientPrivateKey && taskId && userPrivateKey) {
            await workerClient.taskSuccess(taskId)
            const tasks = await client.queryWorkerTasks(userPrivateKey)
            expect(tasks[0].status).eq("SUCCESS")
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

    it('check notifier counter', async () => {
        expect(triggeredCounter).eq(2)
    })
})