export function formatNumber(num: unknown): string {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }
    return num.toLocaleString('en-US');
}
