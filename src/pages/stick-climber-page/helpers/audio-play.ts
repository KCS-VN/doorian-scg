import Phaser from 'phaser';
import { SCG_SOUND_KEYS } from '../constants/assets';
import { BaseGameScene } from '../scenes/BaseGameScene';

type SoundKey = typeof SCG_SOUND_KEYS[keyof typeof SCG_SOUND_KEYS];

/**
 * Phát SFX
 */
export function playSound(
    scene: Phaser.Scene,
    key: SoundKey = SCG_SOUND_KEYS.CLICK
) {
    if (scene instanceof BaseGameScene) {
        scene.music?.playSFX(key);
    }
}

/**
 * Tạm dừng SFX đang phát
 */
export function pauseSound(
    scene: Phaser.Scene,
    key: SoundKey = SCG_SOUND_KEYS.CLICK
) {
    if (scene instanceof BaseGameScene) {
        const sfx = scene.music?.sfxMap[key];
        if (sfx?.isPlaying) {
            sfx.pause();
        }
    }
}

/**
 * Tiếp tục phát SFX từ chỗ pause (resume)
 */
export function resumeSound(
    scene: Phaser.Scene,
    key: SoundKey = SCG_SOUND_KEYS.CLICK
) {
    if (scene instanceof BaseGameScene) {
        const sfx = scene.music?.sfxMap[key];
        if (sfx?.isPaused) {
            sfx.resume();
        }
    }
}

/**
 * Pause tất cả âm thanh (BGM + SFX)
 */
export function pauseAllSounds(scene: Phaser.Scene) {
    if (scene instanceof BaseGameScene) {
        // Pause BGM
        if (scene.music?.bgMusic?.isPlaying) {
            scene.music.bgMusic.pause();
        }

        // Pause tất cả SFX
        Object.values(scene.music?.sfxMap || {}).forEach((sfx) => {
            if (sfx.isPlaying) {
                sfx.pause();
            }
        });
    }
}

/**
 * Resume tất cả âm thanh (BGM + SFX)
 */
export function resumeAllSounds(scene: Phaser.Scene) {
    if (scene instanceof BaseGameScene) {
        // Resume BGM
        if (scene.music?.bgMusic?.isPaused) {
            scene.music.bgMusic.resume();
        }

        // Resume tất cả SFX
        Object.values(scene.music?.sfxMap || {}).forEach((sfx) => {
            if (sfx.isPaused) {
                sfx.resume();
            }
        });
    }
}
