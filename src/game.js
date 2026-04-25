/**
 * Main game orchestrator - 3D version with Fortnite-style controls
 * - Pointer lock for free mouse look
 * - Camera-relative movement
 * - Smooth character rotation
 */
import * as THREE from '../vendor/three.module.js';
import * as CANNON from '../vendor/cannon-es.js';
import { Player } from './player.js';
import { InputHandler } from './input.js';
import { VERSION } from './version.js';
import { Level } from './level.js';
import { Enemy } from './enemy.js';
import { PowerUp, ActivePowerUp } from './powerup.js';

// Helper to hide loading even on error
function safeHideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
}

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Game state
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
        this.world.gravity.set(0, -30, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        
        // Active powerups
        this.activePowerups = [];
        
        // Load high scores
        this.highScores = this.loadHighScores();
        
        // Subsystems
        this.input = new InputHandler(this.canvas);
        this.level = new Level(this.scene, this.world);
        this.player = null;
        
        // Camera target for smooth follow
        this.cameraTarget = new THREE.Vector3();
        
        // Lighting
        this.setupLighting();
        
        // Initialize UI
        this.initUI();
        
        // Hide loading screen
        document.getElementById('loading').classList.add('hidden');
        
        // Auto-play / test mode for health monitoring
        this.autoPlay = false;

        // Animation loop
        this.lastTime = 0;
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }
    
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404080, 0.3);
        this.scene.add(ambientLight);
        
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
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.startGame();
            });
        }
        
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.startGame());
        }
        
        const playAgainBtn = document.getElementById('playAgainBtn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.startGame());
        }
        
        // Keyboard shortcut to start game
        const checkStartKey = (e) => {
            if (this.gameState === 'MENU' && (e.code === 'Space' || e.code === 'Enter')) {
                e.preventDefault();
                this.startGame();
            }
        };
        window.addEventListener('keydown', checkStartKey);
        
        // Populate version display
        const versionStr = `v${VERSION}`;
        const versionTag = document.getElementById('version-tag');
        if (versionTag) versionTag.textContent = versionStr;
        const hudVersion = document.getElementById('hud-version');
        if (hudVersion) hudVersion.textContent = versionStr;
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
        
        // Reset camera yaw to face forward
        this.input.cameraYaw = 0;
        this.input.cameraPitch = 0.3;
        this.input.cameraDistance = 10;
        
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
        const lockPrompt = document.getElementById('lock-prompt');
        if (lockPrompt) lockPrompt.classList.add('hidden');
    }
    
    showScreen(id) {
        document.getElementById(id).classList.remove('hidden');
    }
    
    onResize() {
        this.camera.aspect = this.canvas.width / canvas.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(canvas.width, canvas.height);
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
        
        // Show/hide pointer lock prompt during gameplay
        const lockPrompt = document.getElementById('lock-prompt');
        if (lockPrompt) {
            if (!this.input.isPointerLocked) {
                lockPrompt.classList.remove('hidden');
            } else {
                lockPrompt.classList.add('hidden');
            }
        }
        
        // Auto-play mode for health monitoring
        if (this.autoPlay) {
            this.handleAutoPlay(dt);
        }
        
        // Step physics world
        this.world.step(1/60);
        
        // Update player (now uses camera-relative movement from input)
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
        
        // Update camera (Fortnite-style: orbits based on input's yaw/pitch)
        this.updateCamera();
        
        // Update HUD
        this.updateHUD();
    }
    
    updateCamera() {
        if (!this.player) return;
        
        const playerPos = this.player.mesh.position;
        
        // Use input handler's camera angles (driven by mouse with pointer lock)
        const yaw = this.input.cameraYaw;
        const pitch = this.input.cameraPitch;
        const distance = this.input.cameraDistance;
        
        // Calculate camera position using spherical coordinates
        const cosPitch = Math.cos(pitch);
        const sinPitch = Math.sin(pitch);
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);
        
        // Camera orbits behind the player based on yaw
        // Negative sin/cos so that when yaw=0, camera is behind the cat (positive Z)
        const cameraX = playerPos.x - distance * cosPitch * sinYaw;
        const cameraY = playerPos.y + distance * sinPitch + 2;
        const cameraZ = playerPos.z - distance * cosPitch * cosYaw;
        
        // Smooth follow with lerp
        this.camera.position.lerp(
            new THREE.Vector3(cameraX, cameraY, cameraZ),
            0.1
        );
        
        // Look at player (slightly above center)
        this.cameraTarget.lerp(
            new THREE.Vector3(playerPos.x, playerPos.y + 1, playerPos.z),
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
            const lockPrompt = document.getElementById('lock-prompt');
            if (lockPrompt) lockPrompt.classList.add('hidden');
            // Release pointer lock on game over
            if (document.pointerLockElement) document.exitPointerLock();
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
            // Next level
            this.currentLevel++;
            this.score += 100;
            
            // Regenerate level
            this.level.clear();
            this.level.generateLevel(this.currentLevel);
            
            // Re-add player body to physics world
            this.world.addBody(this.player.body);
            
            // Respawn player
            this.player.reset(
                this.level.startPoint.x,
                this.level.startPoint.y + 2,
                this.level.startPoint.z
            );
        }
    }
    
    animate(time) {
        requestAnimationFrame(this.animate);
        
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;
        
        this.update(dt);
        
        this.renderer.render(this.scene, this.camera);
    }
    
    // Auto-play / Health Monitoring Mode
    enableAutoPlay() {
        this.autoPlay = true;
        this.autoPlayStartTime = Date.now();
        this.autoPlayReachedGoal = false;
        console.log('[AUTO-PLAY] Enabled - will complete Level 1 automatically');
    }
    
    disableAutoPlay() {
        this.autoPlay = false;
        console.log('[AUTO-PLAY] Disabled');
    }
    
    handleAutoPlay(dt) {
        if (!this.player) return;
        
        const playerPos = this.player.body.position;
        const goalPos = this.level.endPoint;
        
        const dx = goalPos.x - playerPos.x;
        const dy = goalPos.y - playerPos.y;
        const distanceToGoal = Math.sqrt(dx * dx + dy * dy);
        
        // Track progress for health monitoring
        if (!window.autoPlayProgress) {
            window.autoPlayProgress = {
                startTime: this.autoPlayStartTime,
                maxX: playerPos.x,
                reachedGoal: false
            };
        }
        window.autoPlayProgress.maxX = Math.max(window.autoPlayProgress.maxX, playerPos.x);
        
        // Auto-move player directly (bypasses input since we control velocity directly)
        const moveSpeed = this.player.runSpeed || 14;
        
        if (dx > 2) {
            this.player.body.velocity.x = moveSpeed;
        } else if (dx < -2) {
            this.player.body.velocity.x = -moveSpeed;
        } else {
            this.player.body.velocity.x = 0;
        }
        
        // Jump if there's height difference or obstacle
        if (dy > 1 && this.player.isOnGround) {
            this.player.body.velocity.y = this.player.jumpForce || 12;
        }
        
        // Keep Z velocity at 0 for auto-play (simple forward movement)
        this.player.body.velocity.z = 0;
        
        // Rotate cat to face movement direction
        if (Math.abs(dx) > 0.5) {
            const targetRot = dx > 0 ? 0 : Math.PI;
            let diff = targetRot - this.player.mesh.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.player.mesh.rotation.y += diff * this.player.rotationSpeed;
        }
        
        // Check if reached goal
        if (distanceToGoal < 2.5 && !this.autoPlayReachedGoal) {
            this.autoPlayReachedGoal = true;
            window.autoPlayProgress.reachedGoal = true;
            console.log('[AUTO-PLAY] Level completed successfully!');
        }
    }
    
    getAutoPlayStatus() {
        return {
            enabled: this.autoPlay,
            reachedGoal: this.autoPlayReachedGoal,
            progress: window.autoPlayProgress || null,
            level: this.currentLevel,
            score: this.score,
            lives: this.lives,
            playerPosition: this.player ? {
                x: this.player.body.position.x,
                y: this.player.body.position.y,
                z: this.player.body.position.z
            } : null
        };
    }

    // Save/Load System
    saveProgress() {
        const saveData = {
            currentLevel: this.currentLevel,
            score: this.score,
            lives: this.lives,
            timestamp: Date.now()
        };
        localStorage.setItem('catWoodsSave', JSON.stringify(saveData));
    }
    
    loadProgress() {
        try {
            const saveData = localStorage.getItem('catWoodsSave');
            if (saveData) {
                return JSON.parse(saveData);
            }
        } catch (e) {
            console.error('Failed to load progress:', e);
        }
        return null;
    }
    
    clearProgress() {
        localStorage.removeItem('catWoodsSave');
    }
    
    // High Score System
    loadHighScores() {
        try {
            const scores = localStorage.getItem('catWoodsHighScores');
            if (scores) {
                return JSON.parse(scores);
            }
        } catch (e) {
            console.error('Failed to load high scores:', e);
        }
        return [];
    }
    
    saveHighScore(name, score, time, level) {
        const entry = {
            name: name || 'Anonymous',
            score: score,
            time: time,
            level: level,
            date: new Date().toISOString()
        };
        
        this.highScores.push(entry);
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 10);
        
        try {
            localStorage.setItem('catWoodsHighScores', JSON.stringify(this.highScores));
        } catch (e) {
            console.error('Failed to save high score:', e);
        }
        
        return entry;
    }
    
    isHighScore(score) {
        if (this.highScores.length < 10) return true;
        return score > this.highScores[this.highScores.length - 1].score;
    }
    
    getHighScores() {
        return this.highScores;
    }
}