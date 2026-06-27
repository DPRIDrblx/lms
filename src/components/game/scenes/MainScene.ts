import Phaser from "phaser";
import { createClient } from "@/lib/supabase";

export default class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: any;
  private otherPlayers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private matchId!: string;
  private profileId!: string;
  private channel!: any;
  private supabase = createClient();
  private updateTimer: number = 0;
  private avatarUrl?: string;
  private zoneName?: string;
  private joystickMove: { x: number, y: number } = { x: 0, y: 0 };

  constructor() {
    super({ key: "MainScene" });
  }

  init(data: { matchId: string; profileId: string; avatarUrl?: string; zoneName?: string }) {
    this.matchId = data.matchId;
    this.profileId = data.profileId;
    this.avatarUrl = data.avatarUrl;
    this.zoneName = data.zoneName;
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
    
    // Generate Textures for Avatar masks/borders
    const maskGraphics = this.add.graphics();
    maskGraphics.fillStyle(0x06b6d4, 1);
    maskGraphics.fillCircle(20, 20, 20);
    maskGraphics.generateTexture("avatarMask", 40, 40);
    maskGraphics.clear();
    
    // Load local player avatar if available
    if (this.avatarUrl) {
       this.load.image(`avatar_${this.profileId}`, this.avatarUrl);
    }
  }

  create() {
    // Dynamic Background text based on zone
    const bgName = this.zoneName || "Kantin Sekolah";
    this.add.grid(0, 0, 2000, 2000, 64, 64, 0x1e293b, 1, 0x334155, 1).setOrigin(0, 0);
    
    const zoneText = this.add.text(1000, 1000, bgName.toUpperCase(), {
       fontSize: '120px',
       fontStyle: 'bold',
       color: '#ffffff',
       alpha: 0.05
    }).setOrigin(0.5);

    // Setup Physics bounds
    this.physics.world.setBounds(0, 0, 2000, 2000);

    // Create Local Player
    const playerKey = this.avatarUrl ? `avatar_${this.profileId}` : "player";
    this.player = this.physics.add.sprite(400, 300, playerKey);
    // Mask to make it circular
    if (this.avatarUrl) {
       this.player.setDisplaySize(40, 40);
       const mask = this.add.sprite(400, 300, "avatarMask").setVisible(false);
       this.player.setMask(new Phaser.Display.Masks.BitmapMask(this, mask));
       // We need to update mask position manually in update loop, so simpler to just leave it as square for now or use rounded rectangle
       this.player.clearMask(true); // Revert mask for simplicity since physics sprite masks need updating
       this.player.setCrop(0,0,40,40); // Simple crop
    }
    
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
      this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D');
    }

    // Setup Joystick Listener
    window.addEventListener('joystickMove', ((e: CustomEvent) => {
       this.joystickMove = e.detail;
    }) as EventListener);
    
    window.addEventListener('joystickEnd', (() => {
       this.joystickMove = { x: 0, y: 0 };
    }) as EventListener);

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
           // Dynamically load enemy avatar
           const eAvatar = payload.payload.avatarUrl;
           if (eAvatar && !this.textures.exists(`avatar_${payload.payload.profileId}`)) {
              this.load.image(`avatar_${payload.payload.profileId}`, eAvatar);
              this.load.once('complete', () => {
                 if (this.otherPlayers.has(payload.payload.profileId)) {
                    this.otherPlayers.get(payload.payload.profileId)!.setTexture(`avatar_${payload.payload.profileId}`).setDisplaySize(40, 40);
                 }
              });
              this.load.start();
           }
           other = this.add.sprite(payload.payload.x, payload.payload.y, eAvatar ? `avatar_${payload.payload.profileId}` : "enemy");
           if (eAvatar && this.textures.exists(`avatar_${payload.payload.profileId}`)) {
               other.setDisplaySize(40, 40);
           }
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
    
    const keys = this.wasdKeys;
    const jx = this.joystickMove.x;
    const jy = this.joystickMove.y;

    if (jx !== 0 || jy !== 0) {
      this.player.setVelocityX(speed * jx);
      this.player.setVelocityY(speed * jy);
      moved = true;
    } else {
      if ((this.cursors && this.cursors.left.isDown) || (keys && keys.A.isDown)) {
      this.player.setVelocityX(-speed);
      moved = true;
    } else if ((this.cursors && this.cursors.right.isDown) || (keys && keys.D.isDown)) {
      this.player.setVelocityX(speed);
      moved = true;
    } else {
      this.player.setVelocityX(0);
    }

    if ((this.cursors && this.cursors.up.isDown) || (keys && keys.W.isDown)) {
      this.player.setVelocityY(-speed);
      moved = true;
      } else if ((this.cursors && this.cursors.down.isDown) || (keys && keys.S.isDown)) {
        this.player.setVelocityY(speed);
        moved = true;
      } else {
        this.player.setVelocityY(0);
      }
    }

    // Broadcast position every ~50ms if moved
    if (moved && time > this.updateTimer) {
       this.channel.send({
          type: "broadcast",
          event: "move",
          payload: {
            profileId: this.profileId,
            avatarUrl: this.avatarUrl,
            x: this.player.x,
            y: this.player.y
          }
       });
       this.updateTimer = time + 50;
    }
  }
}
