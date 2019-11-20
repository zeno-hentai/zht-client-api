import ZHTClientAPI from "../../../lib/ZHTClientAPI"
import ZHTWorkerClientAPI from '../../../dist/lib/ZHTWorkerClientAPI/index';

function getBaseUrl(baseURL?: string): string {
    if(!baseURL && globalThis.process && globalThis.process.env['ZHT_SERVER_BASEURL']) {
        baseURL = globalThis.process.env['ZHT_SERVER_BASEURL']
    }
    if(!baseURL){
        baseURL = "http://localhost:8080"
    }
    return baseURL
}

export function getClient(baseURL?: string): ZHTClientAPI {
    baseURL = getBaseUrl(baseURL)
    return new ZHTClientAPI({
        baseURL,
        testHandleCookies: true
    })
}

export function getWorkerClient(apiToken: string, baseURL?: string): ZHTWorkerClientAPI {
    baseURL = getBaseUrl(baseURL)
    return new ZHTWorkerClientAPI({
        apiToken,
        baseURL,
        proxy: null
    })
}