import {ZHTWorkerClientAPI} from './base';
import { WorkerRegisterResult, PolledWorkerTask, EncryptedWorkerTaskInfo, WorkerTaskInfo, WorkerRegisterRequest, WorkerTaskStatusUpdateRequest } from '../data/worker';
import { rsaGenKey, rsaDecrypt, rsaEncrypt } from '../utils/crypto/rsa';

declare module './base' {
    interface ZHTWorkerClientAPI {
        registerWorker(userPublicKey: string): Promise<WorkerRegisterResult>
        pollTask(workerPrivateKey: string): Promise<PolledWorkerTask<WorkerTaskInfo>>
        taskSuccess(taskId: number): Promise<void>
        taskFailed(taskId: number): Promise<void>
    }
}

ZHTWorkerClientAPI.prototype.registerWorker = async function (userPublicKey: string): Promise<WorkerRegisterResult> {
    const {privateKey, publicKey} = await rsaGenKey()
    const encryptedPublicKey = await rsaEncrypt(publicKey, userPublicKey)
    await this.http.post<void, WorkerRegisterRequest>("/api/api/worker/register", {
        token: this.apiToken,
        encryptedPublicKey
    })
    return {privateKey}
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