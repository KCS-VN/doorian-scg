import Phaser from 'phaser';
import { createButton, createImage, createText } from './phaser-ui';
import { playSound } from './audio-play';

interface ShowConfirmModalOptions {
    scene: Phaser.Scene;
    title: string;
    subTitle?: string;
    iconKey?: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: number;
    cancelColor?: number;
    cost?: number;
    onConfirm: () => void;
    onCancel?: () => void;
}

export function showPlayConfirmModal({
    scene,
    title,
    subTitle,
    iconKey,
    confirmText = 'Xác nhận',
    cancelText = 'Huỷ bỏ',
    confirmColor = 0xf2b500,
    cancelColor = 0xe0e0e0,
    cost,
    onConfirm,
    onCancel,
}: ShowConfirmModalOptions) {
    const { width, height } = scene.scale;
    const boxWidth = 320;
    const boxHeight = 200;
    const boxRadius = 16;

    // Overlay
    const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5).setInteractive();

    // Box chính
    const boxBg = scene.add.graphics()
        .fillStyle(0xffffff, 1)
        .lineStyle(2, 0xcccccc)
        .fillRoundedRect(width / 2 - boxWidth / 2, height / 2 - boxHeight / 2, boxWidth, boxHeight, boxRadius)
        .strokeRoundedRect(width / 2 - boxWidth / 2, height / 2 - boxHeight / 2, boxWidth, boxHeight, boxRadius);
    // Icon nếu có
    let icon: Phaser.GameObjects.Image | undefined;
    if (iconKey) {
        icon = createImage(
            scene,
            width / 2, height / 2 - boxHeight / 2 + 32,
            iconKey, 40,
            {
                origin: { x: 0.5, y: 0.5 },
            }
        );
    }
    // Text chính
    const txtTitleY = icon ? icon.y + 40 + 8 : height / 2 - boxHeight / 2 + 32;
    const txtTitle = createText(scene, width / 2, txtTitleY, cost ? `${title}` : title, {
        style: {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#000000',
            align: 'center',
            wordWrap: { width: boxWidth - 40 }
        },
        origin: { x: 0.5, y: 0.5 },
    });
    // Text phụ
    let txtTitleSub: Phaser.GameObjects.Text | undefined;
    if (subTitle) {
        txtTitleSub = createText(scene, width / 2, txtTitle.y + txtTitle.height + 8, subTitle, {
            style: {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#666666',
                align: 'center',
                wordWrap: { width: boxWidth - 40 },
            },
            origin: { x: 0.5, y: 0.5 },
        });
    }
    // Container modal
    const modal = scene.add.container(0, 0).setDepth(999);
    modal.add([overlay, boxBg, txtTitle]);
    if (icon) modal.add(icon);
    if (txtTitleSub) modal.add(txtTitleSub);

    const btnCancel = createButton(
        scene,
        width / 2 - 70, height / 2 + boxHeight / 2 - 36,
        100, 40,
        cancelText,
        {
            radius: 10,
            color: cancelColor,
            textColor: '#000000',
            onClick: () => {
                playSound(scene);
                onCancel?.();
                modal.destroy(true);
            }
        }
    );

    const btnConfirm = createButton(
        scene,
        width / 2 + 70, height / 2 + boxHeight / 2 - 36,
        120, 40,
        confirmText,
        {
            radius: 10,
            color: confirmColor,
            textColor: '#ffffff',
            onClick: () => {
                playSound(scene);
                onConfirm();
                modal.destroy(true);
            }
        }
    );

    modal.add([btnCancel, btnConfirm]);
}
