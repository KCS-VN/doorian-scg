import { createImage, createText } from '../helpers/phaser-ui';
import { SCG_IMAGE_KEYS } from '../constants/assets';
import { playSound } from '../helpers/audio-play';
import { formatNumber } from '../helpers/help';

type ShowCongratsModalOptions = {
    scene: Phaser.Scene;
    deltaPoint: number;       // số tiền chênh lệch
    onCancel?: () => void;    // callback khi nhấn exit
};

export function showCongratsModal({ scene, deltaPoint, onCancel }: ShowCongratsModalOptions) {
    const { width, height } = scene.scale;

    // === Overlay ===
    const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0).setInteractive();

    // === Box nền chính ===
    const imgBoxBgPadding = 16;
    const imgBoxBgWidth = Math.min(Math.max(width * 0.8, 200), 320);
    const imgBoxBgHeight = 260;
    const imgBoxBg = createImage(
        scene,
        width / 2, height / 2,
        SCG_IMAGE_KEYS.OVER_MODAL_BG, imgBoxBgWidth,
        { height: imgBoxBgHeight }
    );

    const imgCrownHeight = 120;
    const imgCrown = createImage(
        scene,
        width / 2, imgBoxBg.y - imgBoxBg.displayHeight / 2 - imgCrownHeight / 2,
        SCG_IMAGE_KEYS.CROWN, imgBoxBgWidth,
        { height: imgCrownHeight }
    );

    const imgTitleHeight = 40;
    const imgTitle = createImage(
        scene,
        width / 2, imgBoxBg.y - imgBoxBg.displayHeight / 2 + imgTitleHeight / 2 + imgBoxBgPadding,
        SCG_IMAGE_KEYS.CONGRATS_MODAL_TITLE, undefined,
        { height: imgTitleHeight }
    );

    const imgSub = createImage(
        scene,
        width / 2, imgTitle.y + imgTitle.displayHeight + 4,
        SCG_IMAGE_KEYS.CONGRATS_MODAL_SUB, undefined,
        { height: 20 }
    );

    // === BTN exit ===
    const btnExitHeight = 52;
    const btnExit = createImage(
        scene,
        width / 2, imgBoxBg.y + imgBoxBg.displayHeight / 2 - btnExitHeight / 2 - imgBoxBgPadding,
        SCG_IMAGE_KEYS.OVER_MODAL_EXIT, undefined,
        {
            height: btnExitHeight,
            interactive: true,
            onClick: () => {
                playSound(scene);
                onCancel?.();
                congratsModal.destroy();
            }
        }
    );

    // === Content ===
    const contentBgHeight = 60;
    const contentBgWidth = imgBoxBg.displayWidth - imgBoxBgPadding * 2;
    const contentBgX = width / 2 - imgBoxBg.displayWidth / 2 + imgBoxBgPadding;
    const contentBgY = btnExit.y - btnExit.displayHeight / 2 - contentBgHeight - 8;

    const contentBg = scene.add.graphics();
    contentBg.fillStyle(0x24293D, 1);
    contentBg.fillRoundedRect(contentBgX, contentBgY, contentBgWidth, contentBgHeight, 8);
    contentBg.strokeRoundedRect(contentBgX, contentBgY, contentBgWidth, contentBgHeight, 8);

    const imgContentText = createImage(
        scene,
        contentBgX + contentBgHeight / 2 + 16,
        contentBgY + contentBgHeight / 2,
        SCG_IMAGE_KEYS.CONGRATS_MODAL_TEXT,
        68,
    );

    const txtContentValue = createText(
        scene,
        contentBgX + contentBgWidth - 16,
        contentBgY + contentBgHeight / 2,
        formatNumber(deltaPoint),
        { origin: { x: 1, y: 0.5 } }
    );

    const imgContentXWidth = 12;
    const imgContentX = createImage(
        scene,
        txtContentValue.x - txtContentValue.displayWidth - imgContentXWidth / 2 - 8,
        contentBgY + contentBgHeight / 2,
        SCG_IMAGE_KEYS.X,
        imgContentXWidth,
    );

    const imgContentCoinWidth = 36;
    const imgContentCoin = createImage(
        scene,
        imgContentX.x - imgContentX.displayWidth / 2 - imgContentCoinWidth / 2 - 8,
        contentBgY + contentBgHeight / 2,
        SCG_IMAGE_KEYS.COIN,
        imgContentCoinWidth,
    );

    // === Container modal chính ===
    const congratsModal = scene.add.container(0, 0, [
        overlay, imgBoxBg, imgTitle, imgSub, btnExit,
        contentBg, imgContentText, txtContentValue, imgContentX, imgContentCoin, imgCrown
    ]).setDepth(999);

    return congratsModal;
}
