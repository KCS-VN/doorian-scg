import Phaser from 'phaser';

export type CreateImageOptions = {
    interactive?: boolean;
    origin?: { x: number; y: number };
    depth?: number;
    onClick?: () => void;
    height?: number;
    pressScale?: number;
};
export function createImage(
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    width?: number,
    options: CreateImageOptions = {},
) {
    const {
        interactive = false,
        origin = { x: 0.5, y: 0.5 },
        depth = 1,
        onClick,
        pressScale = 0.96,
        height: fixedHeight,
    } = options;

    // Lấy texture gốc
    const texture = scene.textures.get(key);
    const source = texture.getSourceImage() as HTMLImageElement;

    // --- Tính width & height linh hoạt ---
    let finalWidth: number;
    let finalHeight: number;

    if (width !== undefined && fixedHeight !== undefined) {
        // Nếu truyền cả width lẫn height → dùng nguyên
        finalWidth = width;
        finalHeight = fixedHeight;
    } else if (width !== undefined) {
        // Nếu chỉ truyền width → tính height theo tỉ lệ gốc
        finalWidth = width;
        finalHeight = source.height * (width / source.width);
    } else if (fixedHeight !== undefined) {
        // Nếu chỉ truyền height → tính width theo tỉ lệ gốc
        finalHeight = fixedHeight;
        finalWidth = source.width * (fixedHeight / source.height);
    } else {
        // Nếu không truyền gì → dùng size gốc
        finalWidth = source.width;
        finalHeight = source.height;
    }

    // --- Tạo image ---
    const img = scene.add
        .image(x, y, key)
        .setOrigin(origin.x, origin.y)
        .setDisplaySize(finalWidth, finalHeight)
        .setDepth(depth);

    // --- Interactive ---
    if (interactive) {
        img.setInteractive({ useHandCursor: true });

        const baseScaleX = img.scaleX;
        const baseScaleY = img.scaleY;

        img.on('pointerdown', () => {
            img.setScale(baseScaleX * pressScale, baseScaleY * pressScale);
        });

        img.on('pointerup', () => {
            img.setScale(baseScaleX, baseScaleY);
            onClick?.();
        });

        img.on('pointerout', () => {
            img.setScale(baseScaleX, baseScaleY);
        });
    }

    return img;
}

export type CreateTextOptions = {
    origin?: { x: number; y: number };
    depth?: number;
    style?: Phaser.Types.GameObjects.Text.TextStyle;
};
export function createText(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    options: CreateTextOptions = {}
) {
    const {
        origin = { x: 0.5, y: 0.5 },
        depth = 1,
        style = {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
        },
    } = options;

    return scene.add
        .text(x, y, text, style)
        .setOrigin(origin.x, origin.y)
        .setDepth(depth);
}

export type CreateButtonOptions = {
    radius?: number;
    color?: number; // Phaser Graphics chỉ hỗ trợ number, gradient nếu muốn phải dùng sprite
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
    interactive?: boolean; // default true
    onClick?: () => void;
    depth?: number;
};
export function createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    options: CreateButtonOptions = {}
) {
    const { radius = 12, color = 0xffb916, textColor = '#ffffff', fontSize = 16, interactive = true, onClick, depth = 1 } = options;

    const container = scene.add.container(x, y).setDepth(depth);

    const btnBg = scene.add.graphics();
    btnBg.fillStyle(color, 1);
    btnBg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    container.add(btnBg);

    const btnText = scene.add.text(0, 0, text, { fontSize: `${fontSize}px`, color: textColor }).setOrigin(0.5);
    container.add(btnText);

    if (interactive) {
        const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        container.on('pointerdown', () => container.setScale(0.96));
        container.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            container.setScale(1);
            if (hitArea.contains(pointer.x - container.x, pointer.y - container.y)) {
                if (onClick) onClick();
            }
        });
        container.on('pointerout', () => container.setScale(1));
    }

    return container;
}
