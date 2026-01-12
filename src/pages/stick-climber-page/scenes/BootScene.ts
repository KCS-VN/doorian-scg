import Phaser from 'phaser';
import { SCG_IMAGE_KEYS, SCG_SOURCES } from '../constants/assets';
import { SCG_SCENES } from '../constants/scene';
import { createImage } from '../helpers/phaser-ui';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: SCG_SCENES.BOOT_SCENE });
    }

    preload() {
        Object.values(SCG_IMAGE_KEYS).forEach((key) => {
            if (!this.textures.exists(key)) {
                this.load.image(
                    key,
                    `${SCG_SOURCES.IMAGE}/${key}.png`
                );
            }
        });
    }

    create() {
        this.cameras.main.setBackgroundColor('#ffffff');

        const titleImage = createImage(
            this,
            this.cameras.main.centerX, this.cameras.main.centerY,
            SCG_IMAGE_KEYS.GAME_TITLE, this.cameras.main.width * 0.6,
            {
                origin: { x: 0.5, y: 0.5 },
            }
        );

        this.time.delayedCall(1000, () => {
            this.tweens.add({
                targets: titleImage,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    this.scene.launch(SCG_SCENES.MUSIC_SCENE);
                    this.scene.start(SCG_SCENES.MAIN_MENU_SCENE);
                    // this.scene.start(SCG_SCENES.INSTRUCTION_SCENE);
                }
            });
        });
    }
}
