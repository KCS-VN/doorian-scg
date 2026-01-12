import { useSearchParams } from 'react-router';
import { decrypt } from '../../utils/encrypt';
import { DataIndexURLSchema, type TDataIndexURL } from '../../types/user';
import { getDeviceInfo } from '../../utils/device';
import StickClimberGame from './components/StickClimberGame';
import { sessionStorageGetItem, sessionStorageSaveItem } from '../../utils/session';
import { EVENT_KEYS } from './constants/event';

const PARAM_KEYS = {
    DATA: 'data',
}
const StickClimberPage = () => {
    const [searchParams] = useSearchParams();
    const dataURL = searchParams.get(PARAM_KEYS.DATA);

    try {
        if (!dataURL) throw new Error('No player data available');
        const decrypted = decrypt(dataURL);

        const user: TDataIndexURL = DataIndexURLSchema.parse(decrypted);
        const deviceInfo = getDeviceInfo();

        if (user.point < 0) throw new Error('The player did not have enough points');

        const sessionUser = sessionStorageGetItem('user');
        if (!sessionUser) {
            sessionStorageSaveItem('user', user);
        }
        sessionStorageSaveItem('device', deviceInfo);

        return (
            <StickClimberGame />
        );
    } catch {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                columnGap: 12, width: '100%', height: '100vh'
            }}>
                <p
                    style={{
                        marginBottom: 16,
                        fontSize: 16,
                        opacity: 0.7,
                        textAlign: 'center',
                    }}
                >
                    Error: Invalid data or device info
                </p>

                <button
                    style={{
                        padding: '12px 24px',
                        borderRadius: 12,
                        border: 'none',
                        background: 'linear-gradient(135deg, #FFB916, #FF9F0A)',
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                    }}
                    onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'scale(0.96)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
                    }}
                    onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';

                        window.ReactNativeWebView?.postMessage(
                            JSON.stringify({
                                type: EVENT_KEYS.QUIT_GAME,
                                data: null,
                            })
                        );
                    }}
                >
                    Exit
                </button>
            </div>
        );
    }
};

export default StickClimberPage;
