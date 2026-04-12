/**
 * Main game orchestrator - 3D version with Three.js + Cannon.js
 */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Player } from './player.js';
import { InputHandler } from './input.js';
import { Level } from './level.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Game state (same as 2D version)
        this.score = 0;
        this.gameState = 'MENU';
        this.currentLevel = 1;
        this.startTime = 0;
        this.lives = 9;
        
        // Three.js setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 20, 100);
        
        this.camera = new THREE.PerspectiveCamera(
            75, 
            canvas.width / canvas.height, 
            0.1, 
            1000
        );
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(canvas.width, canvas.height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Cannon.js physics world
        this.world = new CANNON.World();
        this.world.gravity.set(0, -30, 0); // Stronger gravity for platformer feel
        this.world.broadphase = new CANNON.NaiveBroadphase();
        
        // Subsystems (mirroring 2D architecture)
        this.input = new InputHandler(this.canvas);
        this.level = new Level(this.scene, this.world);
        this.player = null;
        
        // Camera follow offset
        this.cameraOffset = new THREE.Vector3(0, 5, 10);
        this.cameraTarget = new THREE.Vector3();
        
        // Lighting
        this.setupLighting();
        
        // Initialize UI
        this.initUI();
        
        // Hide loading screen
        document.getElementById('loading').classList.add('hidden');
        
        // Animation loop
        this.lastTime = 0;
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }
    
    setupLighting() {
        // Ambient light (moonlight feel)
        const ambientLight = new THREE.AmbientLight(0x404080, 0.3);
        this.scene.add(ambientLight);
        
        // Directional light (sun/moon)
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(-20, 50, -20);
        dirLight.castShadow = true;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);
        
        this.dirLight = dirLight;
    }
    
    initUI() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.startGame());
    }
    
    startGame() {
        this.gameState = 'PLAYING';
        this.score = 0;
        this.currentLevel = 1;
        this.lives = 9;
        this.startTime = Date.now();
        
        // Clear existing level
        this.level.clear();
        
        // Generate new level
        this.level.generateLevel(1);
        
        // Create player at start position
        if (this.player) {
            this.player.dispose();
        }
        this.player = new Player(
            this.level.startPoint.x,
            this.level.startPoint.y + 2,
            this.level.startPoint.z,
            this.scene,
            this.world
        );
        
        // Update UI
        this.hideScreens();
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('controls-hint').classList.remove('hidden');
        this.updateHUD();
    }
    
    hideScreens() {
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('victory').classList.add('hidden');
    }
    
    showScreen(id) {
        document.getElementById(id).classList.remove('hidden');
    }
    
    onResize() {
        this.camera.aspect = this.canvas.width / this.canvas.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.width, this.canvas.height);
    }
    
    updateHUD() {
        document.getElementById('lives-display').textContent = this.lives;
        document.getElementById('score-display').textContent = this.score;
        document.getElementById('level-display').textContent = this.currentLevel;
        
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('time-display').textContent = `${minutes}:${seconds}`;
    }
    
    update(dt) {
        if (this.gameState !== 'PLAYING') return;
        
        // Step physics world
        this.world.step(1/60);
        
        // Update player
        this.player.update(this.input, dt);
        
        // Update level animations
        this.level.update(dt);
        
        // Check for hazards (falling off)
        if (this.player.body.position.y < -20) {
            this.onPlayerDeath();
        }
        
        // Check for collectibles
        this.checkCollectibles();
        
        // Check level completion
        this.checkLevelComplete();
        
        // Update camera to follow player
        this.updateCamera();
        
        // Update HUD
        this.updateHUD();
    }
    
    updateCamera() {
        if (!this.player) return;

        const playerPos = this.player.mesh.position;
        const isFacingRight = this.player.facingRight;
        
        // FIX: Better camera angle showing more front of character
        // Camera positioned behind player (in direction they're running from)
        // so player faces camera more, showing front/side instead of rear
        const cameraOffsetX = isFacingRight ? -12 : 12; // Further behind when facing right
        const targetX = playerPos.x + cameraOffsetX;
        const targetY = Math.max(playerPos.y + 5, 3); // Higher up for better angle
        const targetZ = playerPos.z + 8; // More to the side for better forward visibility

        this.camera.position.lerp(
            new THREE.Vector3(targetX, targetY, targetZ),
            0.08 // Slightly slower lerp for smoother follow
        );

        // Look slightly ahead of player to show where they're going
        const lookAheadX = playerPos.x + (isFacingRight ? 5 : -5);
        this.cameraTarget.lerp(
            new THREE.Vector3(lookAheadX, playerPos.y + 1, playerPos.z),
            0.1
        );
        this.camera.lookAt(this.cameraTarget);
    }
    
    checkCollectibles() {
        const playerPos = this.player.body.position;
        
        this.level.collectibles.forEach((coin, index) => {
            const distance = playerPos.distanceTo(coin.mesh.position);
            if (distance < 1.5 && coin.active) {
                coin.collect();
                this.score += 10;
            }
        });
    }
    
    checkLevelComplete() {
        const playerPos = this.player.body.position;
        const goalPos = this.level.endPoint;
        
        const dx = playerPos.x - goalPos.x;
        const dz = playerPos.z - goalPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < 2 && playerPos.y > goalPos.y - 1) {
            this.onLevelComplete();
        }
    }
    
    onPlayerDeath() {
        this.lives--;
        
        if (this.lives <= 0) {
            this.gameState = 'GAMEOVER';
            document.getElementById('final-score').textContent = `Final Score: ${this.score}`;
            this.showScreen('game-over');
            document.getElementById('hud').classList.add('hidden');
            document.getElementById('controls-hint').classList.add('hidden');
        } else {
            // Respawn at start
            this.player.reset(
                this.level.startPoint.x,
                this.level.startPoint.y + 2,
                this.level.startPoint.z
            );
        }
    }
    
    onLevelComplete() {
        if (this.currentLevel >= 3) {
            // Victory!
            this.gameState = 'VICTORY';
            document.getElementById('victory-score').textContent = `Final Score: ${this.score}`;

            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            document.getElementById('victory-time').textContent = `Time: ${minutes}:${seconds}`;

            this.showScreen('victory');
            document.getElementById('hud').classList.add('hidden');
            document.getElementById('controls-hint').classList.add('hidden');
        } else {
            // Next level - first show level complete notification
            this.score += 100; // Level completion bonus

            // Store next level number before clearing
            const nextLevel = this.currentLevel + 1;

            // Regenerate level
            this.level.clear();
            this.level.generateLevel(nextLevel);

            // Update current level after successful generation
            this.currentLevel = nextLevel;

            // Respawn player - make sure player mesh is visible
            if (this.player) {
                this.player.reset(
                    this.level.startPoint.x,
                    this.level.startPoint.y + 2,
                    this.level.startPoint.z
                );
                // Ensure player mesh is visible after reset
                if (this.player.mesh) {
                    this.player.mesh.visible = true;
                }
            }

            // Update HUD to show new level
            this.updateHUD();
        }
    }
    
    animate(time) {
        requestAnimationFrame(this.animate);
        
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;
        
        this.update(dt);
        
        this.renderer.render(this.scene, this.camera);
    }
}