export function createIdempotencyKey(action: string, id: number | string, detail = '') {
    const normalizedDetail = detail.trim();

    if (!normalizedDetail) {
        return `${action}:${id}`;
    }

    return `${action}:${id}:${encodeURIComponent(normalizedDetail)}`;
}