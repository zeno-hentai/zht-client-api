import NodeWS from 'ws'

export function createWebSocketClient(url: string): ZHTWebSocketClient {
    if(globalThis.WebSocket){
        return new BrowserWSClient(url)
    }else{
        return new NodeWSClient(url)
    }
}

export interface ZHTWebSocketClient {
    onMessage(handler: (s: any) => void): void
    onConnection(handler: () => void): void
    send(s: string): void
    close(): void
}

class BrowserWSClient implements ZHTWebSocketClient {
    ws: WebSocket
    handlers: ((s: any) => void)[]
    constructor(url: string){
        this.ws = new WebSocket(url)
        this.handlers = []
    }
    onConnection(handler: () => void) {
        this.ws.onopen = handler
    }
    onMessage(handler: (s: any) => void): void {
        this.ws.onmessage = handler
    }
    send(s: string){
        this.ws.send(s)
    }
    close(){
        this.ws.close()
    }

}

class NodeWSClient implements ZHTWebSocketClient {
    ws: NodeWS
    private handler: (data: any) => void
    constructor(url: string){
        this.ws = new NodeWS(url)
        this.handler = () => {}
        this.ws.on('message', (ws: NodeWS , data: NodeWS.Data) => {
            this.handler(data)
        })
    }
    onConnection(handler: () => void) {
        this.ws.on('open', handler)
    }
    onMessage(handler: (s: any) => void): void {
        this.handler = handler
    }
    send(s: string){
        this.ws.send(s)
    }
    close(){
        this.ws.close()
    }

}