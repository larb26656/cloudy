export type SdkError = {
    message?: string;
    data?: unknown;
    errors?: Array<{ message?: string }>;
    name?: string;
};

export function getErrorMessage(error: SdkError): string {
    if (error.message) return error.message;
    if (error.errors && error.errors.length > 0 && error.errors[0].message) {
        return error.errors[0].message;
    }
    if (error.data && typeof error.data === 'object' && 'message' in error.data) {
        return String((error.data as { message: string }).message);
    }
    return 'Unknown error';
}



