export function toDateString(value: unknown): string {
    if (value instanceof Date) {
        return value.toISOString();
    }
    return String(value);
}