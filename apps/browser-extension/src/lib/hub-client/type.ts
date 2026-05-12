
export interface HubPayload<T extends SendSelectionData> {
    type: string;
    data: T;
    replace: boolean;
}

export interface BaseData {
    label: string;
    text: string;
    timestamp: string;
}

export interface SendSelectionData {
    url: string;
    selection: string;
}


export interface HubResponse {
    success: boolean;
    result?: any;
    error?: string;
}