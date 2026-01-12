import type { TDataIndexURL } from '../../../types/user';
import { sessionStorageGetItem } from '../../../utils/session';
import { SCG_GAME, SCG_SOUND_KEYS } from '../constants/assets';
import { playSound } from './audio-play';
import { showCongratsModal } from './showCongratsModal';

type CheckPointOptions = {
    scene: Phaser.Scene;
    threshold?: number;   // ngưỡng điểm, mặc định 999_999
    deltaPoint?: number;  // số điểm hiển thị trong modal, mặc định 0
    onCancel?: () => void; // callback khi người dùng đóng modal
    onBeforeShow?: () => void; // callback thực hiện trước khi show modal
};

/**
 * Kiểm tra điểm user và hiển thị modal nếu >= threshold
 */
export function checkPointAndShowModal({
    scene,
    threshold = SCG_GAME.MAX_SCORE,
    deltaPoint = 0,
    onCancel,
    onBeforeShow
}: CheckPointOptions) {
    const user = sessionStorageGetItem('user') as TDataIndexURL | null;
    const currentPoint = user?.point ?? 0;

    if (currentPoint >= threshold) {
        // ✅ Thực hiện trước khi show modal
        if (onBeforeShow) onBeforeShow();

        // ✅ Hiển thị modal chúc mừng
        playSound(scene, SCG_SOUND_KEYS.WIN);
        showCongratsModal({ scene, deltaPoint, onCancel });
        return true; // có show modal
    }

    return false; // không show modal
}
