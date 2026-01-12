import Phaser from 'phaser';
import { SCG_SOUND_KEYS, SCG_SOURCES } from '../constants/assets';
import { SCG_SCENES } from '../constants/scene';

type PlaySFXOptions = {
    loop?: boolean;
    times?: number; // số lần phát (chỉ áp dụng khi loop = false)
    volume?: number;
};

export class MusicScene extends Phaser.Scene {
    bgMusic!: Phaser.Sound.BaseSound;

    // mỗi key chỉ giữ 1 sound instance
    sfxMap: Record<string, Phaser.Sound.BaseSound> = {};

    isSoundOn = false;

    constructor() {
        super({ key: SCG_SCENES.MUSIC_SCENE });
    }

    preload() {
        Object.values(SCG_SOUND_KEYS).forEach((key) => {
            if (!this.cache.audio.exists(key)) {
                this.load.audio(
                    key,
                    `${SCG_SOURCES.SOUND}/${key}.mp3`
                );
            }
        });
    }

    create() {
        // === BGM ===
        this.bgMusic = this.sound.add(SCG_SOUND_KEYS.SOUND_GAME_BG, {
            loop: true,
            volume: 0.5,
        });

        // === SFX ===
        Object.values(SCG_SOUND_KEYS).forEach((key) => {
            if (key === SCG_SOUND_KEYS.SOUND_GAME_BG) return;
            this.sfxMap[key] = this.sound.add(key);
        });
    }

    /* ================= TOGGLE ================= */

    toggle() {
        this.isSoundOn = !this.isSoundOn;

        if (this.isSoundOn) {
            this.playBGM();
        } else {
            this.stopAll();
        }
    }

    /* ================= BGM ================= */

    playBGM() {
        if (!this.isSoundOn) return;
        if (!this.bgMusic.isPlaying) {
            this.bgMusic.play();
        }
    }

    stopBGM() {
        if (this.bgMusic.isPlaying) {
            this.bgMusic.stop();
        }
    }

    /* ================= SFX ================= */

    playSFX(key: string, options?: PlaySFXOptions) {
        if (!this.isSoundOn) return;

        const sound = this.sfxMap[key];
        if (!sound) return;

        // nếu đang play loop thì không play lại
        if (sound.isPlaying && options?.loop) return;

        const times = options?.times ?? 1;
        let playedCount = 0;

        sound.off('complete'); // tránh chồng listener

        const playOnce = () => {
            if (!this.isSoundOn) return;

            playedCount++;

            sound.play({
                loop: options?.loop ?? false,
                volume: options?.volume ?? 1,
            });
        };

        sound.on('complete', () => {
            if (options?.loop) return;
            if (playedCount < times) {
                playOnce();
            }
        });

        playOnce();
    }

    stopSFX(key: string) {
        const sound = this.sfxMap[key];
        if (sound && sound.isPlaying) {
            sound.stop();
        }
    }

    /* ================= STOP ALL ================= */

    stopAll() {
        this.stopBGM();

        Object.values(this.sfxMap).forEach((sound) => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });
    }

    /* ================= PAUSE / RESUME ================= */

    /**
     * Tạm dừng tất cả âm thanh (BGM + SFX đang play)
     */
    pauseAll() {
        // Pause BGM
        if (this.bgMusic.isPlaying) {
            this.bgMusic.pause();
        }

        // Pause SFX đang play
        Object.values(this.sfxMap).forEach((sound) => {
            if (sound.isPlaying) {
                sound.pause();
            }
        });
    }

    /**
     * Tiếp tục phát tất cả âm thanh từ vị trí đang pause
     */
    resumeAll() {
        // Resume BGM
        if (this.bgMusic.isPaused) {
            this.bgMusic.resume();
        }

        // Resume SFX đang pause
        Object.values(this.sfxMap).forEach((sound) => {
            if (sound.isPaused) {
                sound.resume();
            }
        });
    }

}
