import Phaser from 'phaser';
import { SCG_IMAGE_KEYS } from '../constants/assets';
import { BaseGameScene } from './BaseGameScene';
import { SCG_SCENES } from '../constants/scene';
import { createImage, createText } from '../helpers/phaser-ui';
import { formatNumber } from '../helpers/help';
import { sessionStorageGetItem } from '../../../utils/session';
import type { TDataIndexURL } from '../../../types/user';
import { playSound } from '../helpers/audio-play';

export class InstructionScene extends BaseGameScene {

    currentPoint: number = 0;

    private stepIndex: number = 0;
    private steps: { text: string; imgKey?: string }[] = [];
    private stepImage?: Phaser.GameObjects.Image;
    private btnNext!: Phaser.GameObjects.Image;
    private btnBack!: Phaser.GameObjects.Image;

    leftColumn!: Phaser.GameObjects.Image;
    rightColumn!: Phaser.GameObjects.Image;
    doorian!: Phaser.GameObjects.Sprite;
    redZone!: Phaser.GameObjects.Rectangle;

    stick!: Phaser.GameObjects.Rectangle;
    stickLength: number = 0;
    isHolding: boolean = false;
    isDropping: boolean = false;

    dropTween?: Phaser.Tweens.Tween;
    didHitRedZone: boolean = false;

    pointText!: Phaser.GameObjects.Text;
    basePoint: number = 0;

    perfectEffect?: Phaser.GameObjects.Image;
    isInputBlocked: boolean = false;

    tutorialHand?: Phaser.GameObjects.Image;

    constructor() {
        super({ key: SCG_SCENES.INSTRUCTION_SCENE });
    }

    preload() { }

    create() {
        const { width, height } = this.scale;

        this.steps = [
            { text: '화면을 눌러 막대기를 만들어 보세요.', imgKey: SCG_IMAGE_KEYS.STEP_1 },
            { text: '손을 떼면 막대기 길이만큼 이동할 수 있어요.', imgKey: SCG_IMAGE_KEYS.STEP_2 },
            { text: '막대기 끝이 빨간 칸에 범위에 들어가면 1 DSP를 받아요.', imgKey: SCG_IMAGE_KEYS.STEP_3 },
            { text: '길이를 조절해 다음 절벽까지 가보세요.', imgKey: SCG_IMAGE_KEYS.STEP_4 },
        ];

        this.stick = undefined!;
        this.dropTween = undefined;
        this.perfectEffect = undefined;
        this.tutorialHand = undefined;
        this.isInputBlocked = false;

        createImage(
            this,
            width / 2, height / 2,
            SCG_IMAGE_KEYS.MAIN_MENU_BG, width,
            { height, origin: { x: 0.5, y: 0.5 } }
        );

        this.createTopUI(width, height);
        this.createGameUI(width, height);

        // ✅ BÂY GIỜ MỚI CHẠY STEP 0
        this.setStepIndex(0);
    }

    createTopUI(width: number, height: number) {
        const user = sessionStorageGetItem('user') as TDataIndexURL;
        this.currentPoint = user ? user.point : 0;

        const topY = height * 0.1;
        const centerX = width / 2;

        // === Top coin UI ===
        const bgShowCoin = createImage(this, centerX, topY, SCG_IMAGE_KEYS.TOP_COIN_BG, 180);
        const imgCoinWidth = 36;
        createImage(this, centerX - bgShowCoin.displayWidth / 2 + imgCoinWidth / 2, topY, SCG_IMAGE_KEYS.COIN, imgCoinWidth, { origin: { x: 1, y: 0.5 } });
        const btnAddCoinWidth = 42;
        const btnAddCoinX = centerX + bgShowCoin.displayWidth / 2 - btnAddCoinWidth / 2;
        const btnAddCoin = createImage(this, btnAddCoinX, topY, SCG_IMAGE_KEYS.ADD_COIN, btnAddCoinWidth, { origin: { x: 0, y: 0.5 } });
        createText(this, btnAddCoin.x - 4, btnAddCoin.y, formatNumber(this.currentPoint), { origin: { x: 1, y: 0.5 } });

        // === Step Image ===
        const imgStepHeight = 120;
        this.stepImage = createImage(this, width / 2, bgShowCoin.y + bgShowCoin.displayHeight / 2 + imgStepHeight / 2 + 24, SCG_IMAGE_KEYS.STEP_1, Math.min(Math.floor(width - 2 * 32), 320), { height: imgStepHeight });

        // === Buttons Close / Next / Back ===
        const btnCloseSize = 32;
        createImage(this, this.stepImage.x + this.stepImage.displayWidth / 2 - btnCloseSize / 2 - 8, this.stepImage.y - this.stepImage.displayHeight / 2 + btnCloseSize / 2 + 8, SCG_IMAGE_KEYS.STEP_CLOSE, btnCloseSize, {
            height: btnCloseSize,
            interactive: true,
            onClick: () => {
                playSound(this);
                this.scene.start(SCG_SCENES.MAIN_MENU_SCENE);
            }
        });

        const btnNextSize = 40;
        this.btnNext = createImage(this, this.stepImage.x + this.stepImage.displayWidth / 2 - btnNextSize / 2, this.stepImage.y + this.stepImage.displayHeight / 2 - btnNextSize / 2 - 8, SCG_IMAGE_KEYS.STEP_NEXT, btnNextSize, {
            height: btnNextSize,
            interactive: true,
            onClick: () => {
                playSound(this);
                this.setStepIndex(this.stepIndex + 1);
            }
        });

        const btnBackSize = 40;
        this.btnBack = createImage(this, this.stepImage.x - this.stepImage.displayWidth / 2 + btnBackSize / 2, this.stepImage.y + this.stepImage.displayHeight / 2 - btnBackSize / 2 - 8, SCG_IMAGE_KEYS.STEP_BACK, btnBackSize, {
            height: btnBackSize,
            interactive: true,
            onClick: () => {
                playSound(this);
                this.setStepIndex(this.stepIndex - 1);
            }
        });
    }

    createGameUI(width: number, height: number) {
        const poleWidth = 100; // bề rộng cột

        // === Left column ===
        this.leftColumn = createImage(
            this,
            poleWidth / 2,           // x
            height,                  // y đáy cột chạm sàn
            SCG_IMAGE_KEYS.MAIN_POLE_STAND,
            poleWidth,
            {
                height: height * 0.2, // cao cột trái
                origin: { x: 0.5, y: 1 },
                depth: 1,
            }
        );

        // === Right column ===
        const rightColumnHeight = Phaser.Math.Between(height * 0.3, height * 0.5);
        const rightColumnX = Phaser.Math.Between(width / 2 + poleWidth / 2, width - poleWidth / 2);
        this.rightColumn = createImage(
            this,
            rightColumnX, height,
            SCG_IMAGE_KEYS.MAIN_POLE_STAND,
            poleWidth,
            {
                height: rightColumnHeight,
                origin: { x: 0.5, y: 1 },
                depth: 1,
            }
        );

        // === Doorian ===
        const doorianWidth = 80;
        const doorianTexture = this.textures.get(SCG_IMAGE_KEYS.MAIN_DOORIAN).getSourceImage() as HTMLImageElement;
        const doorianScale = doorianWidth / doorianTexture.width;

        this.doorian = this.add.sprite(
            this.leftColumn.x,                    // x đặt trên cột trái
            this.leftColumn.y - this.leftColumn.displayHeight, // y đỉnh cột trái
            SCG_IMAGE_KEYS.MAIN_DOORIAN
        )
            .setOrigin(0.5, 1)
            .setScale(doorianScale)
            .setDepth(2);

        this.redZone = this.add.rectangle(
            this.rightColumn.x - this.rightColumn.displayWidth / 2 + 8 / 2,
            this.rightColumn.y - this.rightColumn.displayHeight + 6,
            8, 6,
            0xff0000
        )
            .setOrigin(0.5, 1)
            .setDepth(5); //

        if (!this.anims.exists('doorian-walk')) {
            this.anims.create({
                key: 'doorian-walk',
                frames: [
                    { key: SCG_IMAGE_KEYS.DOORIAN_MOVE_1 },
                    { key: SCG_IMAGE_KEYS.DOORIAN_MOVE_2 },
                    { key: SCG_IMAGE_KEYS.DOORIAN_MOVE_3 },
                ],
                frameRate: 8,
                repeat: -1
            });
        }

    }

    private setStepIndex(index: number) {
        const prevStep = this.stepIndex;

        this.stepIndex = Phaser.Math.Clamp(index, 0, this.steps.length - 1);

        if (this.stepImage && this.steps[this.stepIndex].imgKey) {
            this.stepImage.setTexture(this.steps[this.stepIndex].imgKey!);
        }

        // ✅ UPDATE NÚT
        this.updateStepButtons();

        // ⛔ Dừng tween
        this.dropTween?.stop();
        this.isInputBlocked = true;

        // 🔁 RESET THEO CHIỀU BACK
        if (this.stepIndex < prevStep) {
            this.resetDoorianToLeftColumn();
            this.resetStickState();
        }

        this.handleStep(this.stepIndex);
    }




    private handleStep(stepIndex: number) {
        switch (stepIndex) {
            case 0:
                // TODO: Step 0 - làm gì đó
                console.log('Step 0 triggered');
                this.runStep0();
                break;
            case 1:
                // TODO: Step 1 - làm gì đó
                console.log('Step 1 triggered');
                this.runStep1()
                break;
            case 2:
                // TODO: Step 2 - làm gì đó
                console.log('Step 2 triggered');
                this.runStep2();
                break;
            case 3:
                // TODO: Step 3 - làm gì đó
                console.log('Step 3 triggered');
                this.runStep3();
                break;
            default:
                console.log('Step index không hợp lệ');
        }
    }

    private runStep0() {
        const { width, height } = this.scale;

        this.ensureStick();
        this.resetStickState();

        this.tutorialHand?.destroy();

        this.tutorialHand = createImage(
            this,
            width / 2,
            height / 2,
            SCG_IMAGE_KEYS.TUTORIAL_HAND,
            80,
            { depth: 10 }
        );

        this.tweens.add({
            targets: this.tutorialHand,
            scale: 0.85,
            duration: 500,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.tutorialHand?.destroy();
                this.tutorialHand = undefined;

                this.extendStickToRedZone();
            }
        });
    }


    private extendStickToRedZone() {
        if (!this.redZone || !this.leftColumn || !this.stick) return;

        const stickY = this.leftColumn.y - this.leftColumn.displayHeight;

        const redBounds = this.redZone.getBounds();

        const baseX = this.stick.x;
        const baseY = stickY;

        const targetX = redBounds.left;
        const targetY = (redBounds.top + redBounds.bottom) / 2;

        const dx = targetX - baseX;
        const dy = baseY - targetY;

        const targetLength = Math.sqrt(dx * dx + dy * dy);

        this.stickLength = 0;
        this.stick.scaleY = 0;
        this.stick.angle = 0;

        this.tweens.add({
            targets: this,
            stickLength: targetLength,
            duration: 600,
            ease: 'Linear',
            onUpdate: () => {
                this.stick.scaleY = this.stickLength;
                this.stick.y = stickY;
            },
            onComplete: () => {
                this.isInputBlocked = false;
            }
        });
    }


    private getStickBase() {
        return {
            x: this.stick.x,
            y: this.stick.y
        };
    }

    private getStickTip() {
        const rad = Phaser.Math.DegToRad(this.stick.angle);
        return {
            x: this.stick.x + Math.sin(rad) * this.stickLength,
            y: this.stick.y - Math.cos(rad) * this.stickLength
        };
    }

    private getRedZoneEdges() {
        const b = this.redZone.getBounds();
        return [
            [{ x: b.left, y: b.top }, { x: b.right, y: b.top }],
            [{ x: b.left, y: b.bottom }, { x: b.right, y: b.bottom }],
            [{ x: b.left, y: b.top }, { x: b.left, y: b.bottom }],
            [{ x: b.right, y: b.top }, { x: b.right, y: b.bottom }]
        ];
    }

    private getFirstHitAngle(): number {
        const base = this.getStickBase();
        const edges = this.getRedZoneEdges();

        for (let angle = 0; angle <= 90; angle += 0.5) {
            const rad = Phaser.Math.DegToRad(angle);
            const tip = {
                x: base.x + Math.sin(rad) * this.stickLength,
                y: base.y - Math.cos(rad) * this.stickLength
            };

            for (const e of edges) {
                if (
                    Phaser.Geom.Intersects.LineToLine(
                        new Phaser.Geom.Line(base.x, base.y, tip.x, tip.y),
                        new Phaser.Geom.Line(e[0].x, e[0].y, e[1].x, e[1].y)
                    )
                ) {
                    return angle;
                }
            }
        }
        return 90;
    }

    private runStep1() {
        this.ensureStick();
        this.resetStickState();
        this.resetDoorianToLeftColumn();

        // ⚠️ Đảm bảo stick đã được kéo dài trước
        this.extendStickToRedZone();

        // Sau khi stick dài xong → mới cho đổ
        this.time.delayedCall(650, () => {
            if (!this.stick || !this.redZone) return;

            const hitAngle = this.getFirstHitAngle();

            this.dropTween?.stop();
            this.dropTween = this.tweens.add({
                targets: this.stick,
                angle: hitAngle,
                duration: 600 * (hitAngle / 90),
                ease: 'Linear',
                onComplete: () => {
                    this.isInputBlocked = false;
                }
            });
        });
    }

    private ensureStick() {
        if (this.stick) return;

        const stickX = this.leftColumn.x + this.leftColumn.displayWidth / 2;
        const stickY = this.leftColumn.y - this.leftColumn.displayHeight;

        this.stick = this.add.rectangle(
            stickX,
            stickY,
            4,
            1,
            0x000000
        )
            .setOrigin(0.5, 1)
            .setDepth(5);

        this.stickLength = 0;
        this.stick.scaleY = 0;
        this.stick.angle = 0;
    }

    private resetStickState() {
        this.dropTween?.stop();
        this.dropTween = undefined;

        if (!this.stick) return;

        this.stickLength = 0;
        this.stick.scaleY = 0;
        this.stick.angle = 0;

        this.isHolding = false;
        this.isDropping = false;
    }

    private runStep2() {
        this.isInputBlocked = true;

        this.prepareStickForStep2(() => {
            if (!this.stick || !this.doorian) return;

            const base = this.getStickBase();
            const tip = this.getStickTip();

            // 1️⃣ TELEPORT doorian về chân gậy
            this.doorian.setPosition(base.x, base.y);
            this.doorian.play('doorian-walk');

            // 2️⃣ ĐI DỌC THEO GẬY
            this.tweens.add({
                targets: this.doorian,
                x: tip.x,
                y: tip.y,
                duration: 800,
                ease: 'Linear',
                onComplete: () => {
                    this.doorian.stop();
                    this.doorian.setTexture(SCG_IMAGE_KEYS.MAIN_DOORIAN);

                    // 3️⃣ ĐÁP XUỐNG RED ZONE
                    this.landDoorianOnRedZone();
                }
            });
        });
    }

    private landDoorianOnRedZone() {
        const redBounds = this.redZone.getBounds();

        const landX = (redBounds.left + redBounds.right) / 2;
        const landY =
            this.rightColumn.y - this.rightColumn.displayHeight;

        this.tweens.add({
            targets: this.doorian,
            x: landX,
            y: landY,
            duration: 150,
            ease: 'Quad.easeOut',
            onComplete: () => {
                playSound(this);

                // ✅ HIỆU ỨNG NHẬN THƯỞNG
                this.showPerfectEffect();

                // Step 2 kết thúc tại đây
                this.isInputBlocked = false;
            }
        });
    }

    private showPerfectEffect() {
        const { width, height } = this.scale;

        // Nếu effect cũ còn → destroy
        this.perfectEffect?.destroy();

        this.perfectEffect = this.add.image(
            width / 2,
            height * 0.35,
            SCG_IMAGE_KEYS.PERFECT
        )
            .setDepth(20)
            .setScale(0);

        // Scale + blink
        this.tweens.add({
            targets: this.perfectEffect,
            scale: 1,
            duration: 200,
            ease: 'Back.easeOut',
            yoyo: true,
            hold: 400,
            onComplete: () => {
                this.perfectEffect?.destroy();
                this.perfectEffect = undefined;
            }
        });
    }


    private resetDoorianToLeftColumn() {
        const landX = this.leftColumn.x;
        const landY = this.leftColumn.y - this.leftColumn.displayHeight;

        this.doorian.stop();
        this.doorian.setTexture(SCG_IMAGE_KEYS.MAIN_DOORIAN);
        this.doorian.setPosition(landX, landY);
    }

    private runStep3() {
        this.isInputBlocked = true;

        // 1️⃣ ẨN stick + red zone TRƯỚC
        this.hideStickAndRedZone();

        // ⏱ đợi perfect effect xong
        this.time.delayedCall(300, () => {
            // 2️⃣ DỊCH CỘT
            this.shiftColumnsForTutorial(() => {
                // 3️⃣ RESET DOORIAN + STICK
                this.resetDoorianToLeftColumn();
                this.resetStickState();

                // 4️⃣ HIỆN LẠI stick + red zone cho vòng mới
                this.showStickAndRedZone();

                this.isInputBlocked = false;
            });
        });
    }

    private shiftColumnsForTutorial(onComplete?: () => void) {
        const { height } = this.scale;
        const oldLeftX = this.leftColumn.x;
        const deltaX = oldLeftX - this.rightColumn.x;
        const targetHeight = height * 0.2;

        const startHeight = this.rightColumn.displayHeight;

        const moveTargets: Phaser.GameObjects.GameObject[] = [
            this.leftColumn,
            this.rightColumn,
            this.doorian,
        ];

        this.tweens.add({
            targets: moveTargets,
            x: `+=${deltaX}`,
            duration: 400,
            ease: 'Cubic.easeInOut'
        });

        this.tweens.addCounter({
            from: startHeight,
            to: targetHeight,
            duration: 400,
            ease: 'Cubic.easeInOut',
            onUpdate: (tween) => {
                const h = tween.getValue() ?? 0;

                this.rightColumn.displayHeight = h;
                this.rightColumn.y = height;

                // Doorian đứng trên cột
                this.doorian.y =
                    this.rightColumn.y - this.rightColumn.displayHeight;
            },
            onComplete: () => {
                // ✅ Cột phải trở thành cột trái
                this.leftColumn = this.rightColumn;

                // ✅ Spawn cột phải mới
                this.spawnNewRightColumnForTutorial();

                onComplete?.();
            }
        });
    }

    private spawnNewRightColumnForTutorial() {
        const { width, height } = this.scale;
        const poleWidth = 100;

        const rightColumnHeight = Phaser.Math.Between(
            height * 0.3,
            height * 0.5
        );

        const rightColumnX = Phaser.Math.Between(
            width / 2 + poleWidth / 2,
            width - poleWidth / 2
        );

        this.rightColumn = createImage(
            this,
            rightColumnX,
            height,
            SCG_IMAGE_KEYS.MAIN_POLE_STAND,
            poleWidth,
            {
                height: rightColumnHeight,
                origin: { x: 0.5, y: 1 },
                depth: 1,
            }
        );

        // 🔴 Reset red zone
        this.redZone.setPosition(
            this.rightColumn.x - this.rightColumn.displayWidth / 2 + 8 / 2,
            this.rightColumn.y - this.rightColumn.displayHeight + 6,
        );
        this.redZone.setVisible(true);
    }


    private hideStickAndRedZone() {
        if (this.stick) {
            this.stick.setVisible(false);
        }

        if (this.redZone) {
            this.redZone.setVisible(false);
        }
    }


    private showStickAndRedZone() {
        if (this.stick) {
            this.stick.setVisible(true);
            this.stick.scaleY = 0;
            this.stick.angle = 0;
            this.stickLength = 0;
        }

        if (this.redZone) {
            this.redZone.setVisible(true);
        }
    }

    private updateStepButtons() {
        // Step 0 → không cho back
        if (this.stepIndex === 0) {
            this.btnBack.setVisible(false);
        } else {
            this.btnBack.setVisible(true);
        }

        // Step cuối → không cho next
        if (this.stepIndex === this.steps.length - 1) {
            this.btnNext.setVisible(false);
        } else {
            this.btnNext.setVisible(true);
        }
    }

    private prepareStickForStep2(onReady?: () => void) {
        this.ensureStick();
        this.resetStickState();
        this.resetDoorianToLeftColumn();

        // 1️⃣ Kéo dài stick
        this.extendStickToRedZone();

        // 2️⃣ Sau khi dài xong → đổ stick
        this.time.delayedCall(650, () => {
            if (!this.stick) return;

            const hitAngle = this.getFirstHitAngle();

            this.dropTween?.stop();
            this.dropTween = this.tweens.add({
                targets: this.stick,
                angle: hitAngle,
                duration: 600 * (hitAngle / 90),
                ease: 'Linear',
                onComplete: () => {
                    onReady?.();
                }
            });
        });
    }
}
