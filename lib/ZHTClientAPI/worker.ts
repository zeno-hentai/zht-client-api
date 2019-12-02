import {ZHTClientAPI} from './base';
import { WorkerInfo, WorkerAddTaskRequest, EncryptedWorkerTaskInfo, WorkerTaskInfo, EncryptedWorkerInfo, WorkerTaskStatusUpdateRequest } from '../data/worker';
import { rsaEncrypt, rsaDecrypt, rsaEncryptWrapped, rsaDecryptWrapped } from '../utils/crypto/rsa';

declare module './base' {
    interface ZHTClientAPI {
        queryWorkers(userPrivateKey: string): Promise<WorkerInfo[]>
        getWorker(workerId: number, userPrivateKey: string): Promise<WorkerInfo>
        addWorkerTask(url: string, userPublicKey: string, workerId: number, workerPublicKey: string): Promise<number>
        queryWorkerTasks(userPrivateKey: string): Promise<WorkerTaskInfo[]>
        getTask(taskId: number, userPrivateKey: string): Promise<WorkerTaskInfo>
        deleteTask(taskId: number): Promise<void>
        retryWorkerTask(taskId: number, userPrivateKey: string, userPublicKey: string): Promise<number>
        deleteWorker(workerId: number): Promise<void>
    }
}

ZHTClientAPI.prototype.addWorkerTask = async function (url: string, userPublicKey: string, workerId: number, workerPublicKey: string): Promise<number> {
    const encryptedURLToWorker = await rsaEncryptWrapped(url, workerPublicKey)
    const encryptedURLToUser = await rsaEncryptWrapped(url, userPublicKey)
    return await this.http.post<number, WorkerAddTaskRequest>("/api/api/worker/task/add", {
        workerId,
        encryptedURLToWorker,
        encryptedURLToUser
    })
}

ZHTClientAPI.prototype.queryWorkers = async function (userPrivateKey: string): Promise<WorkerInfo[]> {
    const list = await this.http.get<EncryptedWorkerInfo[]>(`/api/api/worker/query`)
    return await Promise.all(list.map(async (res) => (res.online ? 
        {
        ...res,
        publicKey: await rsaDecryptWrapped(res.encryptedPublicKey, userPrivateKey)
    } : res )))
}

ZHTClientAPI.prototype.getWorker = async function (workerId: number, userPrivateKey: string): Promise<WorkerInfo> {
    const res = await this.http.get<EncryptedWorkerInfo>(`/api/api/worker/get/${workerId}`)
    return res.online ? {
        ...res,
        online: true,
        publicKey: await rsaDecryptWrapped(res.encryptedPublicKey, userPrivateKey),
    } : res
}

ZHTClientAPI.prototype.queryWorkerTasks = async function (userPrivateKey: string): Promise<WorkerTaskInfo[]> {
    const list = await this.http.get<EncryptedWorkerTaskInfo[]>("/api/api/worker/task/query")
    return await Promise.all(list.map(async ({encryptedURL, ...rest}) => ({
        url: await rsaDecryptWrapped(encryptedURL, userPrivateKey),
        ...rest
    })))
}

ZHTClientAPI.prototype.getTask = async function (taskId: number, userPrivateKey: string): Promise<WorkerTaskInfo> {
    const {encryptedURL, ...rest} = await this.http.get<EncryptedWorkerTaskInfo>(`/api/api/worker/task/get/${taskId}`)
    return {
        url: await rsaDecryptWrapped(encryptedURL, userPrivateKey),
        ...rest
    }
}
ZHTClientAPI.prototype.deleteTask = async function (taskId: number): Promise<void> {
    await this.http.delete<void>(`/api/api/worker/task/delete/${taskId}`)
}

ZHTClientAPI.prototype.retryWorkerTask = async function (taskId: number, userPrivateKey: string, userPublicKey: string): Promise<number> {
    const {url, workerId} = await this.getTask(taskId, userPrivateKey)
    const worker = await this.getWorker(workerId, userPrivateKey)
    if(worker.online){
        await this.deleteTask(taskId)
        return await this.addWorkerTask(url, userPublicKey, workerId, worker.publicKey)
    }else{
        throw new Error("Worker not online")
    }
}

ZHTClientAPI.prototype.deleteWorker = async function (workerId: number): Promise<void> {
    await this.http.delete<void>(`/api/api/worker/delete/${workerId}`)
}


export default {}