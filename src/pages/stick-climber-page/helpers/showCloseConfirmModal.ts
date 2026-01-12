import { playSound } from "./audio-play";
import { createButton, createText } from "./phaser-ui";

type ConfirmModalOptions = {
    scene: Phaser.Scene;
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: number;
    cancelColor?: number;
    onConfirm: () => void;
    onCancel?: () => void;
};

export function showCloseConfirmModal({
    scene,
    title,
    confirmText = 'Xác nhận',
    cancelText = 'Huỷ bỏ',
    confirmColor = 0xf2b500,
    cancelColor = 0xe0e0e0,
    onConfirm,
    onCancel,
}: ConfirmModalOptions) {
    const { width, height } = scene.scale;

    // === Overlay ===
    const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5).setInteractive();

    // === Box chính ===
    const boxWidth = 320;
    const boxHeight = 132;
    const boxRadius = 16;

    const boxBg = scene.add.graphics();
    boxBg.fillStyle(0xffffff, 1);
    boxBg.lineStyle(2, 0xcccccc);
    boxBg.fillRoundedRect(width / 2 - boxWidth / 2, height / 2 - boxHeight / 2, boxWidth, boxHeight, boxRadius);
    boxBg.strokeRoundedRect(width / 2 - boxWidth / 2, height / 2 - boxHeight / 2, boxWidth, boxHeight, boxRadius);

    // === Text ===
    const txtTitle = createText(scene, width / 2, height / 2 - 20, title, {
        style: {
            font: '18px Arial',
            color: '#000000',
            align: 'center',
            wordWrap: { width: boxWidth - 40 },
        },
        origin: { x: 0.5, y: 0.5 },
    });

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

    const modal = scene.add.container(0, 0, [
        overlay,
        boxBg,
        txtTitle,
        btnCancel,
        btnConfirm,
    ]).setDepth(999);
}
