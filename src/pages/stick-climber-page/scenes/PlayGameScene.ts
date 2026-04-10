import { sessionStorageGetItem, sessionStorageSaveItem } from '../../../utils/session';
import type { TDataIndexURL } from '../../../types/user';
import { BaseGameScene } from './BaseGameScene';
import { showCloseConfirmModal } from '../helpers/showCloseConfirmModal';
import { SCG_IMAGE_KEYS, SCG_SOUND_KEYS } from '../constants/assets';
import { EVENT_KEYS, MESSAGE_KEYS } from '../constants/event';
import { pauseAllSounds, playSound, resumeAllSounds } from '../helpers/audio-play';
import { SCG_SCENES } from '../constants/scene';
import { createImage, createText } from '../helpers/phaser-ui';
import { checkPointAndShowModal } from '../helpers/checkPointAndShowModal';
import { formatNumber } from '../helpers/help';

export type Point = { x: number; y: number };

export class PlayGameScene extends BaseGameScene {

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
    currentPoint: number = 0;
    basePoint: number = 0;

    perfectEffect?: Phaser.GameObjects.Image;
    isInputBlocked: boolean = false;

    private modalContainer?: Phaser.GameObjects.Container;

    private onMessageHandler?: (event: MessageEvent) => void;

    constructor() {
        super({ key: SCG_SCENES.PLAY_GAME_SCENE });
    }

    preload() { }

    create() {
        const { width, height } = this.scale;

        createImage(
            this,
            width / 2, height / 2,
            SCG_IMAGE_KEYS.MAIN_MENU_BG, width,
            {
                height,
                origin: { x: 0.5, y: 0.5 },
            }
        );
        this.createBirds(width, height);
        this.createTopUI(width, height);
        this.createGameUI(width, height);

        // Nhận sự kiện từ React Native
        // window.addEventListener('message', (event) => {
        //     try {
        //         const data = JSON.parse(event.data);

        //         switch (data.type) {
        //             case MESSAGE_KEYS.WATCH_ADS_GET_MORE_PLAY_OKE:
        //                 console.log('Người chơi xem ads thành công ✅');
        //                 this.modalContainer?.destroy();
        //                 this.restartGame();
        //                 resumeAllSounds(this);
        //                 break;

        //             case MESSAGE_KEYS.WATCH_ADS_GET_MORE_PLAY_FAILED:
        //                 console.log('Người chơi xem ads thất bại ❌');
        //                 resumeAllSounds(this);
        //                 break;
        //             case MESSAGE_KEYS.PAUSE_SOUND:
        //                 pauseAllSounds(this);
        //                 break;

        //             default:
        //                 console.log('Message không xác định:', data.type);
        //         }
        //     } catch (err) {
        //         console.error('Lỗi parse message từ React Native', err);
        //     }
        // });
        this.onMessageHandler = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case MESSAGE_KEYS.WATCH_ADS_GET_MORE_PLAY_OKE:
                        console.log('Người chơi xem ads thành công ✅');
                        this.modalContainer?.destroy();
                        this.modalContainer = undefined;
                        this.restartGame();
                        resumeAllSounds(this);
                        break;

                    case MESSAGE_KEYS.WATCH_ADS_GET_MORE_PLAY_FAILED:
                        console.log('Người chơi xem ads thất bại ❌');
                        resumeAllSounds(this);
                        break;

                    case MESSAGE_KEYS.PAUSE_SOUND:
                        pauseAllSounds(this);
                        break;

                    default:
                        console.log('Message không xác định:', data.type);
                }
            } catch (err) {
                console.error('Lỗi parse message từ React Native', err);
            }
        };

        window.addEventListener('message', this.onMessageHandler);

        this.isInputBlocked = false;
        this.isHolding = false;
        this.isDropping = false;

        this.input.enabled = true;
    }

    update(_time: number, delta: number) {
        this.updateBirds(delta);

        if (this.isHolding) {
            this.stickLength += delta * 0.8;
            this.stick.scaleY = this.stickLength;
            // giữ chân stick tại đỉnh cột
            this.stick.y =
                this.leftColumn.y - this.leftColumn.displayHeight;
        }
    }

    shutdown() {
        if (this.onMessageHandler) {
            window.removeEventListener('message', this.onMessageHandler);
            this.onMessageHandler = undefined;
        }
    }

    createTopUI(width: number, height: number) {
        const user = sessionStorageGetItem('user') as TDataIndexURL;

        const topY = height * 0.1;
        const centerX = width / 2;

        const bgShowCoin = createImage(
            this,
            centerX, topY,
            SCG_IMAGE_KEYS.TOP_COIN_BG, 180,
        );

        const imgCoinWidth = 36;
        const imgCoin = createImage(
            this,
            centerX - bgShowCoin.displayWidth / 2 + imgCoinWidth / 2, topY,
            SCG_IMAGE_KEYS.COIN, imgCoinWidth,
            {
                origin: { x: 1, y: 0.5 },
            }
        );

        const btnAddCoinWidth = 42;
        const btnAddCoinX = centerX + bgShowCoin.displayWidth / 2 - btnAddCoinWidth / 2;
        const btnAddCoin = createImage(
            this,
            btnAddCoinX, topY,
            SCG_IMAGE_KEYS.ADD_COIN, btnAddCoinWidth,
            {
                origin: { x: 0, y: 0.5 },
                interactive: true,
                onClick: () => playSound(this),
            }
        );

        const totalShowCoinWidth = imgCoin.displayWidth + bgShowCoin.displayWidth + btnAddCoin.displayWidth;

        this.currentPoint = user ? user.point : 0;
        this.basePoint = user ? user.point : 0;
        this.pointText = createText(
            this,
            btnAddCoin.x - 4, btnAddCoin.y,
            formatNumber(this.currentPoint),
            {
                origin: { x: 1, y: 0.5 },
            }
        );

        this.soundControl = createImage(
            this,
            centerX - totalShowCoinWidth / 2 - 16, topY,
            SCG_IMAGE_KEYS.SOUND_OFF, 50,
            {
                origin: { x: 0.5, y: 0.5 },
                depth: 1,
                interactive: true,
                onClick: () => {
                    const music = this.music;
                    if (!music) return;

                    music.toggle();
                    this.updateSoundIcon();
                }
            }
        );

        createImage(
            this,
            centerX + totalShowCoinWidth / 2 + 16, topY,
            SCG_IMAGE_KEYS.CLOSE, 48,
            {
                interactive: true,
                onClick: () => this.onClosePressed(),
            }
        );

        this.updateSoundIcon();
    }

    createGameUI(width: number, height: number) {
        const poleWidth = 100; // bề rộng cột

        // Left column
        this.leftColumn = createImage(
            this,
            poleWidth / 2, height,
            SCG_IMAGE_KEYS.MAIN_POLE_STAND,
            poleWidth,
            {
                height: height * 0.2,
                origin: { x: 0.5, y: 1 },
                depth: 1,
            }
        );

        // Doorian
        const doorianWidth = 80; // width mong muốn
        const doorianTexture = this.textures.get(SCG_IMAGE_KEYS.MAIN_DOORIAN).getSourceImage() as HTMLImageElement;
        const doorianScale = doorianWidth / doorianTexture.width;
        this.doorian = this.add.sprite(
            poleWidth / 2,                            // x
            this.leftColumn.y - this.leftColumn.displayHeight, // y
            SCG_IMAGE_KEYS.MAIN_DOORIAN               // key
        )
            .setOrigin(0.5, 1)                        // origin
            .setScale(doorianScale)                   // scale dựa trên width
            .setDepth(3);

        // Right column
        const rightColumnHeight = Phaser.Math.Between(height * 0.3, height * 0.5);
        const rightColumnX = Phaser.Math.Between(width / 2 + poleWidth / 2, width - poleWidth / 2);
        this.rightColumn = createImage(
            this,
            rightColumnX, height,
            SCG_IMAGE_KEYS.MAIN_POLE_STAND, poleWidth,
            {
                height: rightColumnHeight,
                origin: { x: 0.5, y: 1 },
                depth: 1,
            }
        );

        // Red zone
        this.redZone = this.add.rectangle(
            this.rightColumn.x - this.rightColumn.displayWidth / 2,
            this.rightColumn.y - this.rightColumn.displayHeight,
            8, 6,
            0xff0000
        ).setOrigin(0, 0).setDepth(2);

        // Stick
        const stickX = this.leftColumn.x + this.leftColumn.displayWidth / 2; // góc phải cột trái
        const stickY = this.leftColumn.y - this.leftColumn.displayHeight; // đỉnh cột trái
        this.stick = this.add.rectangle(
            stickX, stickY,
            4, 1, // ⚠️ phải là 1
            0x000000
        )
            .setOrigin(0.5, 1)
            .setDepth(3);
        this.stick.scaleY = 0;

        // Input zone
        const zone = this.add.zone(0, height * 0.25, width, height)
            .setOrigin(0)
            .setInteractive();

        zone.on('pointerdown', () => {
            if (this.isDropping || this.isInputBlocked) return; // ✅ block input
            this.stick.setVisible(true); // ✅ bật lại

            this.isHolding = true;
            this.stickLength = 0;
            this.stick.scaleY = 0;
            this.stick.angle = 0;

            // 🔊 BẮT ĐẦU ÂM THANH KÉO STICK
            playSound(this, SCG_SOUND_KEYS.STICK_LONG);
        });

        zone.on('pointerup', () => {
            if (!this.isHolding || this.isDropping) return;

            this.isHolding = false;
            this.isDropping = true;
            this.isInputBlocked = true; // ⬅️ block input ngay từ lúc thả tay

            // ⛔ DỪNG ÂM THANH KÉO STICK
            this.music?.stopSFX(SCG_SOUND_KEYS.STICK_LONG);

            // 🔊 ÂM THANH STICK ĐỔ
            playSound(this, SCG_SOUND_KEYS.STICK_FALL);

            let angle: number;
            this.didHitRedZone = false;

            const leftEdgeDist =
                this.rightColumn.getBounds().left - this.stick.x;

            // ❌ không chạm cột
            if (this.stickLength < leftEdgeDist) {
                angle = 90;
            } else {
                const hitRedAngle = this.getFirstHitAngle();

                if (hitRedAngle < 90) {
                    angle = hitRedAngle;
                    this.didHitRedZone = true; // ✅ QUAN TRỌNG
                } else {
                    angle = this.getAngleToLeftEdge();
                }
            }

            this.tweens.add({
                targets: this.stick,
                angle,
                duration: 600 * (angle / 90),
                ease: 'Linear',
                onComplete: () => {
                    this.isDropping = false;
                    this.moveDoorianAcrossStick();
                }
            });
        });


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

    private onClosePressed() {
        playSound(this);
        playSound(this, SCG_SOUND_KEYS.OPEN_MODAL);

        showCloseConfirmModal({
            scene: this,
            title: '게임을 종료할까요?',
            confirmText: '종료하기',
            cancelText: '취소',
            onConfirm: () => {
                playSound(this);
                window.ReactNativeWebView?.postMessage(
                    JSON.stringify({
                        type: EVENT_KEYS.QUIT_GAME,
                        data: null,
                    })
                );
            },
        });
    }
    /* ================= LOGIC ================= */

    getStickBase(): Point {
        return { x: this.stick.x, y: this.stick.y };
    }

    getStickTip(): Point {
        const rad = Phaser.Math.DegToRad(this.stick.angle);
        return {
            x: this.stick.x + Math.sin(rad) * this.stickLength,
            y: this.stick.y - Math.cos(rad) * this.stickLength
        };
    }

    isStickLongEnough(): boolean {
        const baseX = this.stick.x;
        const rightLeft = this.rightColumn.getBounds().left;
        return this.stickLength >= rightLeft - baseX;
    }

    isStickReachRightColumn(): boolean {
        const tip = this.getStickTip();
        const b = this.rightColumn.getBounds();
        return tip.x >= b.left && tip.x <= b.right;
    }

    /* ===== COLLISION ANGLE ===== */

    getFirstHitAngle(): number {
        const base = this.getStickBase();
        const edges = this.getRedZoneEdges();

        for (let a = 0; a <= 90; a += 0.5) {
            const rad = Phaser.Math.DegToRad(a);
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
                    return a;
                }
            }
        }
        return 90;
    }

    getAngleToLeftEdge(): number {
        const base = this.getStickBase();
        const leftEdgeX = this.rightColumn.getBounds().left;

        // Nếu stick không đủ dài để chạm mé trái → đổ 90
        if (this.stickLength < leftEdgeX - base.x) {
            return 90;
        }

        // Tính góc sao cho tip.x = leftEdgeX
        const dx = leftEdgeX - base.x;

        // sin(angle) = dx / length
        const sin = dx / this.stickLength;

        // clamp để tránh NaN
        const angleRad = Math.asin(Phaser.Math.Clamp(sin, 0, 1));
        const angleDeg = Phaser.Math.RadToDeg(angleRad);

        return angleDeg;
    }


    getRedZoneEdges(): [Point, Point][] {
        const b = this.redZone.getBounds();
        return [
            [{ x: b.left, y: b.top }, { x: b.right, y: b.top }],
            [{ x: b.left, y: b.bottom }, { x: b.right, y: b.bottom }],
            [{ x: b.left, y: b.top }, { x: b.left, y: b.bottom }],
            [{ x: b.right, y: b.top }, { x: b.right, y: b.bottom }]
        ];
    }

    /* ================= DOORIAN ================= */

    canLand(): boolean {
        if (!this.didHitRedZone) return false;
        if (this.isStickOvershootRightColumn()) return false;
        return true;
    }

    moveDoorianAcrossStick() {
        const base = this.getStickBase();
        const tip = this.getStickTip();

        const canLand = this.canLand();

        // 1️⃣ TELEPORT tới chân gậy
        this.doorian.setPosition(base.x, base.y);

        // ▶️ BẮT ĐẦU ĐI
        this.doorian.play('doorian-walk');

        // 2️⃣ Đi dọc theo gậy
        this.tweens.add({
            targets: this.doorian,
            x: tip.x,
            y: tip.y,
            duration: 800,
            ease: 'Linear',
            onComplete: () => {
                // ⏹️ DỪNG ĐI
                this.doorian.stop();
                this.doorian.setTexture(SCG_IMAGE_KEYS.MAIN_DOORIAN);

                if (canLand) {
                    this.landOnRightColumn();
                } else {
                    this.fallDown();
                }
            }
        });
    }

    landOnRightColumn() {
        const y =
            this.rightColumn.y - this.rightColumn.displayHeight;

        this.tweens.add({
            targets: this.doorian,
            x: Phaser.Math.Clamp(
                this.getStickTip().x,
                this.rightColumn.getBounds().left + 10,
                this.rightColumn.getBounds().right - 10
            ),
            y,
            duration: 150,
            onComplete: () => {
                this.hideStick();
                playSound(this, SCG_SOUND_KEYS.JUMP);
                if (this.didDoorianLandOnRedZone()) {
                    playSound(this, SCG_SOUND_KEYS.COLLECT);
                    this.celebratePerfectLanding();
                }

                // ⏱ đợi 300ms cho animation ổn định rồi mới shift
                this.time.delayedCall(300, () => {
                    this.shiftColumnsAfterLanding(() => {
                        // ⬅️ unblock input khi mọi thứ xong
                        this.isInputBlocked = false;
                    });
                });
            }
        });
    }

    fallDown() {
        this.tweens.add({
            targets: this.doorian,
            y: this.scale.height + 200,
            duration: 600,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.hideStick();
                console.log('GAME OVER');
                playSound(this, SCG_SOUND_KEYS.OPEN_MODAL);
                this.showGameOverModal(); // ✅ gọi modal
            }
        });
    }

    isStickOvershootRightColumn(): boolean {
        const tip = this.getStickTip();
        const b = this.rightColumn.getBounds();
        return tip.x > b.right;
    }

    didDoorianLandOnRedZone(): boolean {
        // 20% chiều ngang, mỗi bên 10%
        const footHalfWidth = this.doorian.displayWidth * 0.1;

        const footLeftX = this.doorian.x - footHalfWidth;
        const footRightX = this.doorian.x + footHalfWidth;

        const redBounds = this.redZone.getBounds();

        // chỉ cần overlap là OK
        const overlap =
            footRightX >= redBounds.left &&
            footLeftX <= redBounds.right;

        return overlap;
    }

    celebratePerfectLanding() {
        console.log('🎉 PERFECT! Doorian đậu trúng red zone');
        this.showPerfectEffect();
        this.addPoint(1);

        checkPointAndShowModal({
            scene: this,
            deltaPoint: this.currentPoint - this.basePoint,
            onCancel: () => {
                this.scene.start(SCG_SCENES.MAIN_MENU_SCENE);
            }
        });
    }

    showPerfectEffect() {
        const perfectWidth = 200;
        const offsetY = 12;

        this.perfectEffect = createImage(
            this,
            this.doorian.x, this.doorian.y - this.doorian.displayHeight - offsetY,
            SCG_IMAGE_KEYS.PERFECT, perfectWidth,
            {
                origin: { x: 0.5, y: 1 },
                depth: 10,
            }
        ).setAlpha(1);


        // 🔁 Nhấp nháy (blink)
        this.tweens.add({
            targets: this.perfectEffect,
            alpha: 0,
            duration: 150,
            yoyo: true,
            repeat: -1
        });

        // ⏱ Sau 2s thì xoá hẳn
        this.time.delayedCall(2000, () => {
            this.perfectEffect?.destroy();
            this.perfectEffect = undefined;
        });
    }

    hideStick() {
        this.stick.setVisible(false);
        this.stick.scaleY = 0;
        this.stickLength = 0;
        this.stick.angle = 0;

        // ✅ Ẩn luôn red zone
        if (this.redZone) {
            this.redZone.setVisible(false);
        }
    }

    shiftColumnsAfterLanding(onComplete?: () => void) {
        const { height } = this.scale;
        const oldLeftX = this.leftColumn.x;
        const targetHeight = height * 0.2;
        const deltaX = oldLeftX - this.rightColumn.x;

        // Lưu chiều cao cột hiện tại
        const startHeight = this.rightColumn.displayHeight;

        // Tween dịch sang trái cho leftColumn, rightColumn, doorian, perfectEffect
        const moveTargets: Phaser.GameObjects.GameObject[] = [this.leftColumn, this.rightColumn, this.doorian];
        if (this.perfectEffect) moveTargets.push(this.perfectEffect);

        this.tweens.add({
            targets: moveTargets,
            x: `+=${deltaX}`,
            duration: 400,
            ease: 'Cubic.easeInOut'
        });

        // Tween hạ chiều cao cột phải riêng
        this.tweens.addCounter({
            from: startHeight,
            to: targetHeight,
            duration: 400,
            ease: 'Cubic.easeInOut',
            onUpdate: (tween) => {
                const h = tween.getValue() ?? 0;
                this.rightColumn.displayHeight = h;
                this.rightColumn.y = height; // đáy chạm sàn

                // Doorian luôn đứng trên cột phải
                this.doorian.y = this.rightColumn.y - this.rightColumn.displayHeight;

                // PerfectEffect đi theo doorian
                if (this.perfectEffect) {
                    const offsetY = 12 + this.doorian.displayHeight;
                    this.perfectEffect.y = this.doorian.y - offsetY;
                    this.perfectEffect.x = this.doorian.x;
                }
            },
            onComplete: () => {
                this.leftColumn = this.rightColumn;
                this.spawnNewRightColumn();
                if (onComplete) onComplete();
            }
        });
    }

    spawnNewRightColumn() {
        const { width, height } = this.scale;
        const poleWidth = 100;

        const rightColumnHeight = Phaser.Math.Between(height * 0.3, height * 0.5);
        const rightColumnX = Phaser.Math.Between(
            width / 2 + poleWidth / 2,
            width - poleWidth / 2
        );

        this.rightColumn = createImage(
            this,
            rightColumnX, height,
            SCG_IMAGE_KEYS.MAIN_POLE_STAND, poleWidth,
            {
                height: rightColumnHeight,
                origin: { x: 0.5, y: 1 },
                depth: 1,
            }
        );


        // 🔴 Tạo lại red zone
        this.redZone.setPosition(
            this.rightColumn.x - this.rightColumn.displayWidth / 2,
            this.rightColumn.y - this.rightColumn.displayHeight
        );
        this.redZone.setVisible(true);
    }

    /* ================= GAME OVER MODAL ================= */

    showGameOverModal() {
        const { width, height } = this.scale;

        // === Overlay ===
        // const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5)
        //     .setInteractive();
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5)
            .setInteractive()
            .setDepth(998);

        // === Box nền chính ===
        const boxWidth = Math.min(Math.max(width * 0.8, 200), 320);
        const boxHeight = 320;

        const boxBg = createImage(
            this,
            width / 2, height / 2,
            SCG_IMAGE_KEYS.OVER_MODAL_BG,
            boxWidth,
            {
                height: boxHeight,
                origin: { x: 0.5, y: 0.5 },
            }
        );


        // === Title image ===
        const titleWidth = 200;
        const titleOffsetTop = 24;

        const texture = this.textures.get(SCG_IMAGE_KEYS.OVER_MODAL_TITLE).getSourceImage();
        const titleHeight = texture.height * (titleWidth / texture.width);

        const imgTitle = createImage(
            this,
            width / 2, height / 2 - boxHeight / 2 + titleOffsetTop + titleHeight / 2,
            SCG_IMAGE_KEYS.OVER_MODAL_TITLE, titleWidth,
            {
                height: titleHeight,
                origin: { x: 0.5, y: 0.5 },
            }
        );

        // === Nội dung container bên trong modal ===
        const padding = 16;
        const contentWidth = boxWidth - padding * 2;
        const contentHeight = boxHeight - (titleOffsetTop + titleHeight + padding * 2);
        const contentY = height / 2 - boxHeight / 2 + titleOffsetTop + titleHeight + padding + contentHeight / 2;

        const contentBg = this.add.graphics();
        contentBg.fillStyle(0x24293D, 1);
        contentBg.fillRoundedRect(width / 2 - contentWidth / 2, contentY - contentHeight / 2, contentWidth, contentHeight, 8);
        contentBg.strokeRoundedRect(width / 2 - contentWidth / 2, contentY - contentHeight / 2, contentWidth, contentHeight, 8);

        // === Container con cho nội dung ===
        const innerContentContainer = this.add.container(
            width / 2 - contentWidth / 2 + padding,
            contentY - contentHeight / 2 + padding
        );

        // --- Bonus image + text ---
        const bonusContainer = this.add.container(0, 0);
        const bonusTexture = this.textures.get(SCG_IMAGE_KEYS.OVER_MODAL_BONUS).getSourceImage();
        const bonusWidth = contentWidth - padding * 2;
        const bonusHeight = bonusTexture.height * (bonusWidth / bonusTexture.width);

        const imgBonus = createImage(
            this,
            0, 0,
            SCG_IMAGE_KEYS.OVER_MODAL_BONUS, bonusWidth,
            {
                height: bonusHeight,
                origin: { x: 0, y: 0 },
            }
        );

        bonusContainer.add(imgBonus);

        const txtBonus = createText(
            this,
            bonusWidth - 12, bonusHeight / 2,
            `${this.currentPoint - this.basePoint}`,
            {
                origin: { x: 1, y: 0.5 },
                style: { fontSize: '20px', fontFamily: 'Arial', color: '#ffffff' }
            }
        );

        bonusContainer.add(txtBonus);

        innerContentContainer.add(bonusContainer);

        // --- Container phía dưới bonusContainer ---
        const remainingY = bonusHeight + 12;
        const remainingHeight = contentHeight - remainingY - 12; // padding dưới 12

        const bottomContainer = this.add.container(0, remainingY);

        // --- Nút ADS full width ---
        const btnAds = createImage(
            this,
            (contentWidth - padding * 2) / 2, 24,
            SCG_IMAGE_KEYS.OVER_MODAL_CONTINUTE_ADS,
            contentWidth - padding * 2,
            {
                height: 48,
                origin: { x: 0.5, y: 0 },
                interactive: true,
                onClick: () => {
                    console.log('ADS button clicked');
                    playSound(this);

                    window.ReactNativeWebView?.postMessage(
                        JSON.stringify({
                            type: EVENT_KEYS.WATCH_ADS_GET_MORE_PLAY,
                            data: null,
                        })
                    );
                    // modalContainer.destroy();
                    // this.restartGame();
                }
            }
        )
            ;
        bottomContainer.add(btnAds);

        // --- Hai nút dưới cùng: CONTINUE DSP + EXIT ---
        // --- Hai nút dưới cùng: CONTINUE DSP + EXIT ---
        const buttonSpacing = 12;
        const buttonHeight = 48;
        const buttonWidth = ((contentWidth - padding * 2) - buttonSpacing) / 2;
        const buttonY = remainingHeight - buttonHeight - 12; // cách padding dưới 12

        const btnContinue = createImage(
            this,
            0, buttonY,
            SCG_IMAGE_KEYS.OVER_MODAL_CONTINUTE_DSP, buttonWidth,
            {
                height: buttonHeight,
                origin: { x: 0, y: 0 },
                interactive: true,
                onClick: () => {
                    console.log('Continue DSP clicked');
                    playSound(this);
                    this.addPoint(-1);

                    this.modalContainer?.destroy();
                    this.modalContainer = undefined;
                    this.restartGame();
                }
            }
        );

        bottomContainer.add(btnContinue);

        const btnExit = createImage(
            this,
            buttonWidth + buttonSpacing, buttonY,
            SCG_IMAGE_KEYS.OVER_MODAL_EXIT, buttonWidth,
            {
                height: buttonHeight,
                origin: { x: 0, y: 0 },
                interactive: true,
                onClick: () => {
                    playSound(this);
                    console.log('Exit button clicked');
                    this.modalContainer?.destroy();
                    this.modalContainer = undefined;
                    this.scene.start(SCG_SCENES.MAIN_MENU_SCENE);
                }
            }
        );

        bottomContainer.add(btnExit);

        // Thêm bottomContainer vào innerContentContainer
        innerContentContainer.add(bottomContainer);

        // === Container modal chính ===
        this.modalContainer = this.add.container(0, 0, [overlay, boxBg, imgTitle, contentBg, innerContentContainer])
            .setDepth(999);
    }

    restartGame() {
        // 1️⃣ Reset Doorian về cột trái
        this.doorian.setPosition(
            this.leftColumn.x,
            this.leftColumn.y - this.leftColumn.displayHeight
        );
        this.doorian.setTexture(SCG_IMAGE_KEYS.MAIN_DOORIAN);

        // 2️⃣ Reset stick
        this.hideStick();
        this.isHolding = false;
        this.isDropping = false;
        this.isInputBlocked = false;

        // 3️⃣ Reset cột phải
        const { width, height } = this.scale;
        const poleWidth = 100;
        const rightColumnHeight = Phaser.Math.Between(height * 0.3, height * 0.5);
        const rightColumnX = Phaser.Math.Between(width / 2 + poleWidth / 2, width - poleWidth / 2);

        this.rightColumn.setPosition(rightColumnX, height);
        this.rightColumn.setDisplaySize(poleWidth, rightColumnHeight);

        // 🔴 Reset red zone
        this.redZone.setPosition(
            this.rightColumn.x - this.rightColumn.displayWidth / 2,
            this.rightColumn.y - this.rightColumn.displayHeight
        );
        this.redZone.setVisible(true);

        // 4️⃣ Reset điểm (tuỳ bạn, hoặc giữ nguyên)
        // this.currentPoint = 0;
        // this.updatePoint(this.currentPoint);
    }

    async addPoint(delta: number) {
        // 1️⃣ Cập nhật biến điểm ngay lập tức
        this.currentPoint += delta;

        // 2️⃣ Cập nhật text hiển thị
        if (this.pointText) {
            this.pointText.setText(formatNumber(this.currentPoint));
        }

        // 3️⃣ Đồng bộ sessionStorage
        const user = sessionStorageGetItem('user') as TDataIndexURL;
        if (user) {
            user.point = this.currentPoint;
            sessionStorageSaveItem('user', user);
        }

        // 4️⃣ Gọi API server cập nhật điểm
    }
}

// 4️⃣ Gọi API server cập nhật điểm
// try {
//     const res = await fetch('/api/game/add-point', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ point: delta }) // gửi số điểm vừa cộng
//     });

//     const data = await res.json();

//     // Nếu server trả về điểm mới, đồng bộ lại
//     if (typeof data.point === 'number') {
//         this.currentPoint = data.point;

//         // Cập nhật lại text & sessionStorage
//         if (this.pointText) this.pointText.setText(this.currentPoint.toString());
//         if (user) {
//             user.point = this.currentPoint;
//             sessionStorageSaveItem('user', user);
//         }
//     }
// } catch (err) {
//     console.error('❌ Cập nhật điểm lên server thất bại', err);
// }