export type WorkerStatusType = "SUSPENDED" | "RUNNING" | "SUCCESS" | "FAILED"

export interface WorkerRegisterRequest {
    token: string
    encryptedPublicKey: string
}

export interface WorkerRegisterResult {
    privateKey: string
    getNotificationListener: (userPublicKey: string, onNotification: () => void) => Promise<ZHTWorkerNotificationListener>
}

export interface ZHTWorkerNotificationListenerConnectionRequest {
    token: string
    encryptedPublicKey: string
}

export interface ZHTWorkerNotificationListener {
    close(): void
}

export interface WorkerInfo {
    id: number
    title: string
    publicKey: string
    online: boolean
}

export interface EncryptedWorkerInfo {
    id: number
    title: string
    encryptedPublicKey: string
    online: boolean
}

export interface WorkerAddTaskRequest {
    workerId: number
    encryptedURLToWorker: string
    encryptedURLToUser: string
}

export interface WorkerTaskInfo {
    id: number
    workerId: number
    workerTitle: string
    url: string
    status: WorkerStatusType
}

export interface WorkerTaskStatusUpdateRequest {
    taskId: number
}

export interface EncryptedWorkerTaskInfo {
    id: number
    workerId: number
    workerTitle: string
    encryptedURL: string
    status: WorkerStatusType
}

export type PolledWorkerTask<T> = {hasTask: true, data: T} | {hasTask: false}