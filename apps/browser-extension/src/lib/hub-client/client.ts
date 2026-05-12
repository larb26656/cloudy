import { HubPayload, SendSelectionData } from "./type";

export const createHubClient = (baseUrl: string) => {

    const send = async <T extends SendSelectionData>(payload: HubPayload<T>): Promise<any> => {
        try {
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Hub Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Hub Client Error:', error);
            throw error;
        }
    };

    return {
        sendSelection: async (selectionData: SendSelectionData) => {
            // TODO replace with utils lib
            const url = `${selectionData.url.slice(0, 10)}${selectionData.selection.length > 10 ? "..." : ""}`;
            const selection = `${selectionData.selection.slice(0, 50)}${selectionData.selection.length > 50 ? "..." : ""}`;

            const data = {
                ...selectionData,
                label: `Browser text (${url}): ${selection} `,
                timestamp: new Date().toISOString(),
                replace: false
            }

            return await send({ type: 'browser-selection', data, replace: true })
        },
    };
};