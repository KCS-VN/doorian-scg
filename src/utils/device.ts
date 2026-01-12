import type { DeviceBrand, DeviceInfo, DeviceType, OS } from "../types/device";

interface NavigatorExtended extends Navigator {
    deviceMemory?: number;
}

function getOS(ua: string): OS {
    if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
    if (/android/i.test(ua)) return 'Android';
    if (/windows/i.test(ua)) return 'Windows';
    if (/mac os/i.test(ua)) return 'macOS';
    if (/linux/i.test(ua)) return 'Linux';
    return 'Unknown';
}

function getDeviceType(ua: string): DeviceType {
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|iphone|android/i.test(ua)) return 'mobile';
    return 'desktop';
}

function getBrand(ua: string): DeviceBrand {
    if (/iphone|ipad|mac/i.test(ua)) return 'Apple';
    if (/samsung/i.test(ua)) return 'Samsung';
    if (/xiaomi|redmi/i.test(ua)) return 'Xiaomi';
    if (/oppo/i.test(ua)) return 'Oppo';
    if (/vivo/i.test(ua)) return 'Vivo';
    if (/huawei/i.test(ua)) return 'Huawei';
    if (/realme/i.test(ua)) return 'Realme';
    if (/pixel/i.test(ua)) return 'Google';
    if (/windows/i.test(ua)) return 'Microsoft';
    return 'Unknown';
}

export function getDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const width = window.screen.width;
    const height = window.screen.height;

    const navigatorExt = navigator as NavigatorExtended; // <-- cast ở đây

    return {
        type: getDeviceType(ua),
        os: getOS(ua),
        brand: getBrand(ua),
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,

        screen: {
            width,
            height,
            availWidth: window.innerWidth,
            availHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: width > height ? 'landscape' : 'portrait',
        },

        browser: {
            userAgent: ua,
            language: navigator.language,
            languages: navigator.languages,
            online: navigator.onLine,
            cookiesEnabled: navigator.cookieEnabled,
        },

        hardware: {
            deviceMemory: navigatorExt.deviceMemory,
            hardwareConcurrency: navigator.hardwareConcurrency,
        },

        time: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
        },
    };
}
