import axios, { AxiosInstance, AxiosPromise, AxiosResponse } from "axios";

export interface ZHTSuccessResponse<T> {
    success: true
    data: T
}

export interface ZHTErrorResponse {
    success: false
    error: string
}

export type ZHTResponse<T> = ZHTSuccessResponse<T> | ZHTErrorResponse

export interface ZHTHttpClientOptions {
    baseURL: string
    testHandleCookies?: boolean
}

export class ZHTHttpClient {
    private axios: AxiosInstance
    private options: ZHTHttpClientOptions
    private cookiesData: string | undefined
    constructor(options: ZHTHttpClientOptions) {
        this.options = options
        this.axios = axios.create({
            baseURL: options.baseURL,
            withCredentials: !!options.testHandleCookies
        })
        if(options.testHandleCookies){
            this.axios.interceptors.request.use((config) => {
                if(this.cookiesData){
                    config.headers['Cookie'] = this.cookiesData
                }
                return config
            }, (err: any) => Promise.reject(err))
        }
    }

    private error(message: string): never {
        throw new Error(message)
    }

    private async handleApiResponse<T>(response: AxiosResponse<ZHTResponse<T>>) {
        if(this.options.testHandleCookies){
            const cookieContent = response.headers['set-cookie']
            if(cookieContent){
                this.cookiesData = cookieContent[0] as string | undefined
            }
        }
        if(response.status != 200){
            this.error(`HTTP Status: ${response.status}`)
        }
        const body = response.data
        return body.success ? body.data : this.error(`${response.config.method} ${response.config.url}: ${body.error}`)
    }

    async get<R>(url: string): Promise<R> {
        const response = await this.axios.get<ZHTResponse<R>>(url)
        return await this.handleApiResponse(response)
    }

    async post<R, Q = any>(url: string, request: Q): Promise<R> {
        const response = await this.axios.post<ZHTResponse<R>>(url, request)
        return await this.handleApiResponse(response)
    }

    async delete<R>(url: string): Promise<R> {
        const response = await this.axios.delete<ZHTResponse<R>>(url)
        return await this.handleApiResponse(response)
    }
}