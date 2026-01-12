export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type OS =
    | 'iOS'
    | 'Android'
    | 'Windows'
    | 'macOS'
    | 'Linux'
    | 'Unknown';

export type DeviceBrand =
    | 'Apple'
    | 'Samsung'
    | 'Xiaomi'
    | 'Oppo'
    | 'Vivo'
    | 'Huawei'
    | 'Realme'
    | 'Google'
    | 'Microsoft'
    | 'Unknown';

export interface DeviceInfo {
    type: DeviceType;
    os: OS;
    brand: DeviceBrand;
    isTouchDevice: boolean;

    screen: {
        width: number;
        height: number;
        availWidth: number;
        availHeight: number;
        pixelRatio: number;
        orientation: 'portrait' | 'landscape';
    };

    browser: {
        userAgent: string;
        language: string;
        languages: readonly string[];
        online: boolean;
        cookiesEnabled: boolean;
    };

    hardware: {
        deviceMemory?: number;
        hardwareConcurrency?: number;
    };

    time: {
        timezone: string;
        timezoneOffset: number;
    };
}