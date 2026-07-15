import { sessionStorageGetItem, sessionStorageSaveItem } from '../../../utils/session';
import type { TDataIndexURL } from '../../../types/user';
import { BaseGameScene } from './BaseGameScene';
import { showCloseConfirmModal } from '../helpers/showCloseConfirmModal';
import { showPlayConfirmModal } from '../helpers/showPlayConfirmModal';
import { SCG_GAME, SCG_IMAGE_KEYS, SCG_SOUND_KEYS } from '../constants/assets';
import { BRIDGE_EVENT_KEYS } from '../constants/event';
import { playSound } from '../helpers/audio-play';
import { SCG_SCENES } from '../constants/scene';
import { createImage, createText } from '../helpers/phaser-ui';
import { formatNumber } from '../helpers/help';
import { checkPointAndShowModal } from '../helpers/checkPointAndShowModal';

export class MainMenuScene extends BaseGameScene {

    currentPoint: number = 0;
    private onMessageHandler?: (event: MessageEvent) => void;

    constructor() {
        super({ key: SCG_SCENES.MAIN_MENU_SCENE });
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
        this.createBottomUI(width, height);

        // remove cũ trước khi add mới
        if (this.onMessageHandler) {
            window.removeEventListener('message', this.onMessageHandler);
        }

        // viết lắng nghe RN ở đây
        this.onMessageHandler = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case BRIDGE_EVENT_KEYS.RN_TO_WEB.START_GAME_OKE: {
                        this.addPoint(-5);
                        this.scene.start(SCG_SCENES.PLAY_GAME_SCENE);
                        break;
                    }
                    case BRIDGE_EVENT_KEYS.RN_TO_WEB.START_GAME_FAILED: {
                        alert('Start game failed');
                        break;
                    }
                    default:
                        console.log('Message không xác định:', data.type);
                }
            } catch (err) {
                console.error('Lỗi parse message từ React Native', err);
            }
        };

        window.addEventListener('message', this.onMessageHandler);

        // cleanup khi scene shutdown
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (this.onMessageHandler) {
                window.removeEventListener('message', this.onMessageHandler);
                this.onMessageHandler = undefined;
            }
        });

        // viết lắng nghe RN ở đây
        this.onMessageHandler = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case BRIDGE_EVENT_KEYS.RN_TO_WEB.START_GAME_OKE: {
                        this.addPoint(-5);
                        this.scene.start(SCG_SCENES.PLAY_GAME_SCENE);
                        break;
                    }
                    case BRIDGE_EVENT_KEYS.RN_TO_WEB.START_GAME_FAILED: {
                        alert('Start game failed');
                        break;
                    }
                    default:
                        console.log('Message không xác định:', data.type);
                }
            } catch (err) {
                console.error('Lỗi parse message từ React Native', err);
            }
        };

        window.addEventListener('message', this.onMessageHandler);
    }

    update(_time: number, delta: number) {
        this.updateBirds(delta);
    }

    shutdown() {
        if (this.onMessageHandler) {
            window.removeEventListener('message', this.onMessageHandler);
            this.onMessageHandler = undefined;
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
        this.currentPoint = user ? user.point : 0;

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
        createText(
            this,
            btnAddCoin.x - 4, btnAddCoin.y,
            formatNumber(this.currentPoint),
            {
                origin: { x: 1, y: 0.5 },
            }
        );

        const totalShowCoinWidth = imgCoin.displayWidth + bgShowCoin.displayWidth + btnAddCoin.displayWidth;
        const btnInstructions = createImage(
            this,
            centerX - totalShowCoinWidth / 2 - 16, topY,
            SCG_IMAGE_KEYS.INSTRUCTIONS, 50,
            {
                interactive: true,
                onClick: () => {
                    playSound(this)
                    this.scene.start(SCG_SCENES.INSTRUCTION_SCENE);
                },
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

        this.soundControl = createImage(
            this,
            btnInstructions.x, btnInstructions.y + btnInstructions.displayHeight / 2 + 8 + 25,
            SCG_IMAGE_KEYS.SOUND_OFF, 50,
            {
                interactive: true,
                onClick: () => {
                    const music = this.music;
                    if (!music) return;

                    music.toggle();
                    this.updateSoundIcon();
                },
            }
        );

        createImage(
            this,
            centerX, this.soundControl.y + this.soundControl.displayHeight / 2 + 56,
            SCG_IMAGE_KEYS.GAME_TITLE, 280
        );

        this.updateSoundIcon();
    }

    createBottomUI(width: number, height: number) {
        const poleHeight = 240;
        const centerX = width / 2;

        const imgPoleStand = createImage(
            this,
            centerX, height,
            SCG_IMAGE_KEYS.MAIN_POLE_STAND, poleHeight * 0.52,
            {
                origin: { x: 0.5, y: 1 }, // neo dưới tâm ngang
            }
        );

        createImage(
            this,
            centerX, imgPoleStand.y - imgPoleStand.displayHeight + 1,
            SCG_IMAGE_KEYS.MAIN_DOORIAN, 80,
            {
                origin: { x: 0.5, y: 1 },
            }
        );

        createImage(
            this,
            centerX, imgPoleStand.y - imgPoleStand.displayHeight / 2,
            SCG_IMAGE_KEYS.MAIN_BTN_PLAY, 140,
            {
                origin: { x: 0.5, y: 0.5 },
                interactive: true,
                depth: 2,
                onClick: () => this.onPlayButtonPressed(),
            }
        );
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
                        type: BRIDGE_EVENT_KEYS.WEB_TO_RN.QUIT_GAME,
                        data: null,
                    })
                );
            },
        });
    }

    private onPlayButtonPressed() {
        playSound(this);
        playSound(this, SCG_SOUND_KEYS.OPEN_MODAL);

        const didShowCongrats = checkPointAndShowModal({
            scene: this, threshold: SCG_GAME.MAX_SCORE + SCG_GAME.COSTS_PLAY
        });
        if (didShowCongrats) return;

        showPlayConfirmModal({
            scene: this,
            title: '5 DSP로 게임을 시작할까요?',
            subTitle: 'PERFECT 달성 시마다 1 DSP가 지급됩니다',
            iconKey: SCG_IMAGE_KEYS.COIN,
            confirmText: '게임 시작',
            cancelText: '취소',
            cost: 5,
            onConfirm: () => {
                console.log('Gọi api trừ DSP!');
                console.log('Chuyển qua màn game!');
                // this.addPoint(-5);
                // this.scene.start(SCG_SCENES.PLAY_GAME_SCENE);

                // nhắn lên RN là start game
                window.ReactNativeWebView?.postMessage(
                    JSON.stringify({
                        type: BRIDGE_EVENT_KEYS.WEB_TO_RN.START_GAME,
                        data: { pointOfUse: -5 },
                    })
                );
            }
        });
    }

    async addPoint(delta: number) {
        // 1️⃣ Cập nhật biến điểm ngay lập tức
        this.currentPoint += delta;
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