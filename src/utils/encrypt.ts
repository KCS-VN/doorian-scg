import CryptoJS from 'crypto-js';

const SECRET_KEY = 'key-cuc-manh';
const IV = CryptoJS.enc.Utf8.parse('1234567890123456'); // 16 bytes cố định

export type Encryptable = string | object;

export function encrypt(data: Encryptable): string {
    const strData = typeof data === 'string' ? data : JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(strData, CryptoJS.enc.Utf8.parse(SECRET_KEY), { iv: IV }).toString();
    return encodeURIComponent(encrypted);
}

export function decrypt<T extends Encryptable>(encryptedStr: string, validateFn?: (data: unknown) => data is T): T {
    try {
        const decoded = decodeURIComponent(encryptedStr);
        const bytes = CryptoJS.AES.decrypt(decoded, CryptoJS.enc.Utf8.parse(SECRET_KEY), { iv: IV });
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedStr) throw new Error('Decrypted string is empty or invalid');

        let result: unknown;
        if (decryptedStr.startsWith('{') || decryptedStr.startsWith('[')) {
            result = JSON.parse(decryptedStr);
        } else {
            result = decryptedStr;
        }

        if (validateFn && !validateFn(result)) {
            throw new Error('Decrypted value failed validation');
        }

        return result as T;
    } catch (err) {
        console.error('Decrypt error:', err);
        throw err;
    }
}
