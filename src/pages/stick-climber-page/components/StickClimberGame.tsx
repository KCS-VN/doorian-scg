import Phaser from 'phaser';
import { useEffect, useRef, useState } from 'react';
import { BootScene } from '../scenes/BootScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { PlayGameScene } from '../scenes/PlayGameScene';
import { MusicScene } from '../scenes/MusicScene';
import { SCG_SOURCES } from '../constants/assets';
import { InstructionScene } from '../scenes/InstructionScene';

const StickClimberGame = () => {
    const gameRef = useRef<HTMLDivElement>(null);
    const gameInstance = useRef<Phaser.Game | null>(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!started || !gameRef.current) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: window.innerWidth,
            height: window.innerHeight,
            parent: gameRef.current,
            scene: [
                BootScene,
                MusicScene,
                MainMenuScene,
                PlayGameScene,
                InstructionScene,
            ],
            backgroundColor: '#FFFFFF',
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
        };

        gameInstance.current = new Phaser.Game(config);

        // 🔥 UNLOCK AUDIO SAU USER CLICK
        gameInstance.current.sound.unlock();

        // 🔥 START GLOBAL MUSIC SCENE
        gameInstance.current.scene.start('MusicScene');

        return () => {
            gameInstance.current?.destroy(true);
            gameInstance.current = null;
        };
    }, [started]);

    return (
        <>
            {!started && (
                <div
                    onClick={() => setStarted(true)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16,
                        cursor: 'pointer',
                        zIndex: 9999,
                    }}
                >
                    <img
                        src={`${SCG_SOURCES.IMAGE}/tutorial_hand.png`}
                        alt="Tap tutorial"
                        style={{
                            width: 120,
                            height: 'auto',
                            animation: 'tapPulse 1.2s infinite',
                        }}
                    />

                    <p style={{ fontSize: 24 }}>
                        Tap to Start
                    </p>
                </div>
            )}

            <div ref={gameRef}
                style={{
                    width: `${window.innerWidth}px`,
                    height: `${window.innerHeight}px`,
                    margin: '0 auto',
                }}
            />
        </>
    );
};

export default StickClimberGame;
