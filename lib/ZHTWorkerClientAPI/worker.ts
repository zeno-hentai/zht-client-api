import {ZHTWorkerClientAPI} from './base';
import { PolledWorkerTask, EncryptedWorkerTaskInfo, WorkerTaskInfo, WorkerRegisterRequest, WorkerTaskStatusUpdateRequest, ZHTWorkerNotificationListener, ZHTWorkerNotificationListenerConnectionRequest, ConnectWorkerOptions } from '../data/worker';
import { rsaDecrypt, rsaEncrypt } from '../utils/crypto/rsa';
import { createWebSocketClient } from '../utils/net/ws';

declare module './base' {
    interface ZHTWorkerClientAPI {
        registerWorker(): void
        connectWorker(options: ConnectWorkerOptions): Promise<ZHTWorkerNotificationListener>
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

ZHTWorkerClientAPI.prototype.registerWorker = async function (): Promise<void> {
    await this.http.post<void, WorkerRegisterRequest>("/api/api/worker/register", {
        token: this.apiToken
    })
}

ZHTWorkerClientAPI.prototype.connectWorker = async function ({userPublicKey, workerPublicKey, onNotification}: ConnectWorkerOptions): Promise<ZHTWorkerNotificationListener> {
    return await getNotificationListener(`${this.baseURL}/api/ws/worker`, this.apiToken, workerPublicKey, userPublicKey, onNotification)
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