export type WorkerStatusType = "SUSPENDED" | "RUNNING" | "SUCCESS" | "FAILED"

export interface WorkerRegisterRequest {
    token: string
}

export interface ZHTWorkerNotificationListenerConnectionRequest {
    token: string
    encryptedPublicKey: string
}

export interface ZHTWorkerNotificationListener {
    close(): void
}

export type WorkerInfo = {
    id: number
    title: string
}  & (
    {
        publicKey: string
        online: true
    } | {
        online: false
    }
)

export type EncryptedWorkerInfo = {
    id: number
    title: string
} & (
    {
        encryptedPublicKey: string
        online: true
    } | {
        online: false
    }
)

export interface ConnectWorkerOptions {
    userPublicKey: string
    workerPublicKey: string
    onNotification: () => void
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