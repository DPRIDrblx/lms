"use client";

import React, { useEffect, useRef } from "react";
import MainScene from "./scenes/MainScene";
import UIOverlay from "./UIOverlay";

interface PhaserGameProps {
  matchId: string;
  profileId: string;
  avatarUrl?: string;
  zoneName?: string;
}

export default function PhaserGame({ matchId, profileId, avatarUrl, zoneName }: PhaserGameProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !gameInstance.current && gameRef.current) {
      // Dynamic import of phaser to avoid SSR issues
      import("phaser").then((Phaser) => {
        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          width: "100%",
          height: "100%",
          parent: gameRef.current!,
          physics: {
            default: "arcade",
            arcade: {
              gravity: { x: 0, y: 0 },
              debug: false,
            },
          },
          scene: [MainScene],
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
        };

        gameInstance.current = new Phaser.Game(config);
        
        // Pass the matchId and profileId to the scene
        gameInstance.current.scene.start("MainScene", { matchId, profileId, avatarUrl, zoneName });
      });
    }

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, [matchId, profileId]);

  return (
    <div className="relative w-full h-full">
      {/* Container for the Phaser Canvas */}
      <div ref={gameRef} className="absolute inset-0" />
      
      {/* Overlay for React-based UI (Scoreboard, Modals) */}
      <UIOverlay matchId={matchId} profileId={profileId} />
    </div>
  );
}
