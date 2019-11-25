import {ZHTWorkerClientAPI} from './base';
import { WorkerRegisterResult, PolledWorkerTask, EncryptedWorkerTaskInfo, WorkerTaskInfo, WorkerRegisterRequest, WorkerTaskStatusUpdateRequest, ZHTWorkerNotificationListener, ZHTWorkerNotificationListenerConnectionRequest } from '../data/worker';
import { rsaGenKey, rsaDecrypt, rsaEncrypt } from '../utils/crypto/rsa';
import { createWebSocketClient } from '../utils/net/ws';

declare module './base' {
    interface ZHTWorkerClientAPI {
        registerWorker(userPublicKey: string): Promise<WorkerRegisterResult>
        pollTask(workerPrivateKey: string): Promise<PolledWorkerTask<WorkerTaskInfo>>
        taskSuccess(taskId: number): Promise<void>
        taskFailed(taskId: number): Promise<void>
    }
}

async function getNotificationListener(url: string, apiToken: string, workerPublicKey: string, userPublicKey: string, onNotification: () => void): Promise<ZHTWorkerNotificationListener> {
    const encryptedPublicKey = await rsaEncrypt(workerPublicKey, userPublicKey)
    const request: ZHTWorkerNotificationListenerConnectionRequest = {
        token: apiToken,
        encryptedPublicKey
    }
    const ws = createWebSocketClient(url)
    return new Promise((resolve, reject) => {
        ws.onConnection(() => {
            ws.send(JSON.stringify(request))
            ws.onMessage(() => {
                ws.onMessage(onNotification)
                resolve({
                    close: () => { ws.close() }
                })
            })
        })
    })
}

ZHTWorkerClientAPI.prototype.registerWorker = async function (userPublicKey: string): Promise<WorkerRegisterResult> {
    const {privateKey, publicKey} = await rsaGenKey()
    const encryptedPublicKey = await rsaEncrypt(publicKey, userPublicKey)
    await this.http.post<void, WorkerRegisterRequest>("/api/api/worker/register", {
        token: this.apiToken,
        encryptedPublicKey
    })
    return {
        privateKey, 
        getNotificationListener: async (userPublicKey: string, onNotification: () => void) => {
            return await getNotificationListener(`${this.baseURL}/api/ws/worker`, this.apiToken, publicKey, userPublicKey, onNotification)
        }
    }
}

ZHTWorkerClientAPI.prototype.pollTask = async function(workerPrivateKey: string): Promise<PolledWorkerTask<WorkerTaskInfo>> {
    const res = await this.http.delete<PolledWorkerTask<EncryptedWorkerTaskInfo>>("/api/api/worker/task/poll")
    if(res.hasTask){
        const {encryptedURL, ...rest} = res.data
        const url = await rsaDecrypt(encryptedURL, workerPrivateKey)
        return {
            hasTask: true,
            data: {
                url,
                ...rest
            }
        }
    }else{
        return {hasTask: false}
    }
}

ZHTWorkerClientAPI.prototype.taskSuccess = async function (taskId: number): Promise<void> {
    await this.http.put<void, WorkerTaskStatusUpdateRequest>("/api/api/worker/task/status/success", {taskId})
}

ZHTWorkerClientAPI.prototype.taskFailed = async function (taskId: number): Promise<void> {
    await this.http.put<void, WorkerTaskStatusUpdateRequest>("/api/api/worker/task/status/failed", {taskId})
}

export default {}