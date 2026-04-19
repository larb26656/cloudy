export interface ProxyResult {
    body: ReadableStream | string | null;
    contentType: string;
    isStreaming: boolean;
}

export class Proxy {
    async proxy(request: Request, opencodeApiBase: string): Promise<ProxyResult> {
        const incomingUrl = new URL(request.url)
        const targetPath = incomingUrl.pathname.replace(/^\/oc/, '')
        const url = new URL(targetPath + incomingUrl.search, opencodeApiBase)

        const headers = new Headers(request.headers)

        const response = await fetch(url.toString(), {
            method: request.method,
            headers,
            body: request.body,
            signal: request.signal,
        } as RequestInit)

        const contentType = response.headers.get('content-type') || ''
        const isStreaming =
            contentType.includes('text/event-stream') ||
            contentType.includes('stream')

        if (isStreaming) {
            return { body: response.body, contentType, isStreaming }
        }

        const data = await response.text()
        return { body: data, contentType, isStreaming }
    }
}
