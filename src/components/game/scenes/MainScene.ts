import Phaser from "phaser";
import { createClient } from "@/lib/supabase";

export default class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private otherPlayers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private matchId!: string;
  private profileId!: string;
  private channel!: any;
  private supabase = createClient();
  private updateTimer: number = 0;

  constructor() {
    super({ key: "MainScene" });
  }

  init(data: { matchId: string; profileId: string }) {
    this.matchId = data.matchId;
    this.profileId = data.profileId;
  }

  preload() {
    // We will generate basic textures for players so we don't need external assets
    const graphics = this.add.graphics();
    
    // Generate Player Texture (Cyan square)
    graphics.fillStyle(0x06b6d4, 1);
    graphics.fillRoundedRect(0, 0, 32, 32, 8);
    graphics.generateTexture("player", 32, 32);
    graphics.clear();

    // Generate Enemy Texture (Rose square)
    graphics.fillStyle(0xe11d48, 1);
    graphics.fillRoundedRect(0, 0, 32, 32, 8);
    graphics.generateTexture("enemy", 32, 32);
    graphics.clear();
    
    // Generate Bullet Texture
    graphics.fillStyle(0xfde047, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture("bullet", 8, 8);
    graphics.destroy();
  }

  create() {
    // Draw Grid Background to look like a map
    this.add.grid(0, 0, 2000, 2000, 64, 64, 0x1e293b, 1, 0x334155, 1).setOrigin(0, 0);

    // Setup Physics bounds
    this.physics.world.setBounds(0, 0, 2000, 2000);

    // Create Local Player
    this.player = this.physics.add.sprite(400, 300, "player");
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(1000);
    this.player.setMaxVelocity(300);

    // Setup Camera
    this.cameras.main.setBounds(0, 0, 2000, 2000);
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

    // Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      // Add WASD
      this.input.keyboard.addKeys('W,A,S,D');
    }

    // Setup Supabase Realtime for Multiplayer
    this.setupMultiplayer();
  }

  setupMultiplayer() {
    this.channel = this.supabase.channel(`room_${this.matchId}`, {
      config: {
        broadcast: { ack: false }
      }
    });

    this.channel
      .on("broadcast", { event: "move" }, (payload: any) => {
        if (payload.payload.profileId === this.profileId) return;

        let other = this.otherPlayers.get(payload.payload.profileId);
        if (!other) {
           other = this.add.sprite(payload.payload.x, payload.payload.y, "enemy");
           this.otherPlayers.set(payload.payload.profileId, other);
        } else {
           // Smoothly interpolate position (in a real game we'd use physics velocity)
           this.tweens.add({
             targets: other,
             x: payload.payload.x,
             y: payload.payload.y,
             duration: 50
           });
        }
      })
      .subscribe((status: string) => {
         if (status === 'SUBSCRIBED') {
            console.log('Joined Game Room!');
         }
      });
  }

  update(time: number, delta: number) {
    if (!this.player) return;

    let moved = false;
    const speed = 300;
    
    const keys = this.input.keyboard.addKeys('W,A,S,D') as any;

    if (this.cursors.left.isDown || keys.A.isDown) {
      this.player.setVelocityX(-speed);
      moved = true;
    } else if (this.cursors.right.isDown || keys.D.isDown) {
      this.player.setVelocityX(speed);
      moved = true;
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown || keys.W.isDown) {
      this.player.setVelocityY(-speed);
      moved = true;
    } else if (this.cursors.down.isDown || keys.S.isDown) {
      this.player.setVelocityY(speed);
      moved = true;
    } else {
      this.player.setVelocityY(0);
    }

    // Broadcast position every ~50ms if moved
    if (moved && time > this.updateTimer) {
       this.channel.send({
          type: "broadcast",
          event: "move",
          payload: {
            profileId: this.profileId,
            x: this.player.x,
            y: this.player.y
          }
       });
       this.updateTimer = time + 50;
    }
  }
}
