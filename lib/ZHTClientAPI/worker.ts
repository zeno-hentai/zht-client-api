import {ZHTClientAPI} from './base';
import { WorkerInfo, WorkerAddTaskRequest, EncryptedWorkerTaskInfo, WorkerTaskInfo, EncryptedWorkerInfo, WorkerTaskStatusUpdateRequest } from '../data/worker';
import { rsaEncrypt, rsaDecrypt } from '../utils/crypto/rsa';

declare module './base' {
    interface ZHTClientAPI {
        queryWorkers(privateKey: string): Promise<WorkerInfo[]>
        addWorkerTask(url: string, userPublicKey: string, worker: Exclude<WorkerInfo, 'title'>): Promise<void>
        queryWorkerTasks(userPrivateKey: string): Promise<WorkerTaskInfo[]>
        retryWorkerTask(taskId: number): Promise<void>
        deleteWorker(workerId: number): Promise<void>
    }
}

ZHTClientAPI.prototype.addWorkerTask = async function (url: string, userPublicKey: string, {id, publicKey}: Exclude<WorkerInfo, 'title'>): Promise<void> {
    const encryptedURLToWorker = await rsaEncrypt(url, publicKey)
    const encryptedURLToUser = await rsaEncrypt(url, userPublicKey)
    await this.http.post<void, WorkerAddTaskRequest>("/api/api/worker/task/add", {
        workerId: id,
        encryptedURLToWorker,
        encryptedURLToUser
    })
}

ZHTClientAPI.prototype.queryWorkers = async function (userPrivateKey: string): Promise<WorkerInfo[]> {
    const list = await this.http.get<EncryptedWorkerInfo[]>(`/api/api/worker/query`)
    return await Promise.all(list.map(async ({encryptedPublicKey, ...rest}) => ({
        publicKey: await rsaDecrypt(encryptedPublicKey, userPrivateKey),
        ...rest
    })))
}

ZHTClientAPI.prototype.queryWorkerTasks = async function (userPrivateKey: string): Promise<WorkerTaskInfo[]> {
    const list = await this.http.get<EncryptedWorkerTaskInfo[]>("/api/api/worker/task/query")
    return await Promise.all(list.map(async ({encryptedURL, ...rest}) => ({
        url: await rsaDecrypt(encryptedURL, userPrivateKey),
        ...rest
    })))
}

ZHTClientAPI.prototype.retryWorkerTask = async function (taskId: number): Promise<void> {
    await this.http.put<void, WorkerTaskStatusUpdateRequest>(`/api/api/worker/task/retry`, {taskId})
}

ZHTClientAPI.prototype.deleteWorker = async function (workerId: number): Promise<void> {
    await this.http.delete<void>(`/api/api/worker/delete/${workerId}`)
}


export default {}