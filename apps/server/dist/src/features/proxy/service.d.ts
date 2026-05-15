export interface ProxyResult {
    body: ReadableStream | string | null;
    contentType: string;
    isStreaming: boolean;
}
export declare class Proxy {
    proxy(request: Request, opencodeApiBase: string): Promise<ProxyResult>;
}
