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
    send(s: string): void
    close(): void
}

class BrowserWSClient implements ZHTWebSocketClient {
    ws: WebSocket
    handlers: ((s: any) => void)[]
    constructor(url: string){
        this.ws = new WebSocket(url)
        this.handlers = []
        this.ws.onmessage = (evt) => {
            for(let h of this.handlers){
                h(evt.data)
            }
        }
    }
    onMessage(handler: (s: any) => void): void {
        this.handlers.push(handler)
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
    handlers: ((s: any) => void)[]
    constructor(url: string){
        this.ws = new NodeWS(url)
        this.handlers = []
        this.ws.on('message', (ws: NodeWS , data: NodeWS.Data) => {
            for(let h of this.handlers){
                h(data)
            }
        })
    }
    onMessage(handler: (s: any) => void): void {
        this.handlers.push(handler)
    }
    send(s: string){
        this.ws.send(s)
    }
    close(){
        this.ws.close()
    }

}