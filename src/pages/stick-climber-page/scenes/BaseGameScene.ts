import Phaser from 'phaser';

import { MusicScene } from './MusicScene';
import type { BirdSprite } from '../types/stick-climber-page';
import { SCG_SCENES } from '../constants/scene';
import { SCG_IMAGE_KEYS } from '../constants/assets';

export abstract class BaseGameScene extends Phaser.Scene {
    birds: Phaser.GameObjects.Sprite[] = [];
    soundControl!: Phaser.GameObjects.Image;

    protected createBirds(width: number, height: number) {
        const configs = [
            { speed: 30, yMin: 0.2, yMax: 0.4 },
            { speed: 15, yMin: 0.2, yMax: 0.3 },
            { speed: 20, yMin: 0.2, yMax: 0.4 },
        ];

        configs.forEach((cfg, index) => {
            const bird = this.add.sprite(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(cfg.yMin * height, cfg.yMax * height),
                SCG_IMAGE_KEYS.BIRD_WINGS_SPREAD
            );

            bird.setDisplaySize(60, bird.height * (60 / bird.width));

            const key = `birdFlap${index}`;
            if (!this.anims.exists(key)) {
                this.anims.create({
                    key,
                    frames: [
                        { key: SCG_IMAGE_KEYS.BIRD_WINGS_SPREAD },
                        { key: SCG_IMAGE_KEYS.BIRD_WINGS_FOLDED },
                    ],
                    frameRate: 6,
                    repeat: -1,
                });
            }
            bird.setDepth(1);
            bird.play(key);
            (bird as BirdSprite).speed = cfg.speed;

            this.birds.push(bird);
        });
    }

    protected updateBirds(delta: number) {
        const { width, height } = this.scale;

        this.birds.forEach((bird) => {
            const b = bird as BirdSprite;
            b.x -= (b.speed * delta) / 1000;

            if (b.x < -50) {
                b.x = width + 50;
                b.y = Phaser.Math.Between(0.1 * height, 0.35 * height);
            }
        });
    }

    get music(): MusicScene | null {
        const scene = this.scene.get(SCG_SCENES.MUSIC_SCENE);
        return scene instanceof MusicScene ? scene : null;
    }

    protected updateSoundIcon() {
        if (!this.music) return;
        this.soundControl.setTexture(
            this.music.isSoundOn ? SCG_IMAGE_KEYS.SOUND_ON : SCG_IMAGE_KEYS.SOUND_OFF
        );
    }
}
