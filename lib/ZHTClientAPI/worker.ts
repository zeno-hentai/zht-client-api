import {ZHTClientAPI} from './base';
import { WorkerInfo, WorkerAddTaskRequest, EncryptedWorkerTaskInfo, WorkerTaskInfo, EncryptedWorkerInfo, WorkerTaskStatusUpdateRequest } from '../data/worker';
import { rsaEncrypt, rsaDecrypt } from '../utils/crypto/rsa';

declare module './base' {
    interface ZHTClientAPI {
        queryWorkers(userPrivateKey: string): Promise<WorkerInfo[]>
        getWorker(workerId: number, userPrivateKey: string): Promise<WorkerInfo>
        addWorkerTask(url: string, userPublicKey: string, worker: Pick<WorkerInfo, 'id' | 'publicKey'>): Promise<number>
        queryWorkerTasks(userPrivateKey: string): Promise<WorkerTaskInfo[]>
        getTask(taskId: number, userPrivateKey: string): Promise<WorkerTaskInfo>
        deleteTask(taskId: number): Promise<void>
        retryWorkerTask(taskId: number, userPrivateKey: string, userPublicKey: string): Promise<number>
        deleteWorker(workerId: number): Promise<void>
    }
}

ZHTClientAPI.prototype.addWorkerTask = async function (url: string, userPublicKey: string, {id, publicKey}: Pick<WorkerInfo, 'id' | 'publicKey'>): Promise<number> {
    const encryptedURLToWorker = await rsaEncrypt(url, publicKey)
    const encryptedURLToUser = await rsaEncrypt(url, userPublicKey)
    return await this.http.post<number, WorkerAddTaskRequest>("/api/api/worker/task/add", {
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

ZHTClientAPI.prototype.getWorker = async function (workerId: number, userPrivateKey: string): Promise<WorkerInfo> {
    const {encryptedPublicKey, ...rest} = await this.http.get<EncryptedWorkerInfo>(`/api/api/worker/get/${workerId}`)
    return {
        publicKey: await rsaDecrypt(encryptedPublicKey, userPrivateKey),
        ...rest
    }
}

ZHTClientAPI.prototype.queryWorkerTasks = async function (userPrivateKey: string): Promise<WorkerTaskInfo[]> {
    const list = await this.http.get<EncryptedWorkerTaskInfo[]>("/api/api/worker/task/query")
    return await Promise.all(list.map(async ({encryptedURL, ...rest}) => ({
        url: await rsaDecrypt(encryptedURL, userPrivateKey),
        ...rest
    })))
}

ZHTClientAPI.prototype.getTask = async function (taskId: number, userPrivateKey: string): Promise<WorkerTaskInfo> {
    const {encryptedURL, ...rest} = await this.http.get<EncryptedWorkerTaskInfo>(`/api/api/worker/task/get/${taskId}`)
    return {
        url: await rsaDecrypt(encryptedURL, userPrivateKey),
        ...rest
    }
}
ZHTClientAPI.prototype.deleteTask = async function (taskId: number): Promise<void> {
    await this.http.delete<void>(`/api/api/worker/task/delete/${taskId}`)
}

ZHTClientAPI.prototype.retryWorkerTask = async function (taskId: number, userPrivateKey: string, userPublicKey: string): Promise<number> {
    const {url, workerId} = await this.getTask(taskId, userPrivateKey)
    const {publicKey: workerPublicKey} = await this.getWorker(workerId, userPrivateKey)
    await this.deleteTask(taskId)
    return await this.addWorkerTask(url, userPublicKey, {
        id: workerId,
        publicKey: workerPublicKey
    })
}

ZHTClientAPI.prototype.deleteWorker = async function (workerId: number): Promise<void> {
    await this.http.delete<void>(`/api/api/worker/delete/${workerId}`)
}


export default {}