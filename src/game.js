/**
 * Main game orchestrator - 3D version with Three.js + Cannon.js
 */
import * as THREE from '../lib/three.module.js';
import * as CANNON from '../lib/cannon-es.js';
import { Player } from './player.js';
import { InputHandler } from './input.js';
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
        
        // Active powerups
        this.activePowerups = [];
        
        // Load high scores
        this.highScores = this.loadHighScores();
        
        // Subsystems (mirroring 2D architecture)
        this.input = new InputHandler(this.canvas);
        this.level = new Level(this.scene, this.world);
        this.player = null;
        
        // Camera follow offset - positioned at RIGHT-FRONT-TOP
        // X is positive (right of player), Z is negative (front of player), Y is up
        this.cameraOffset = new THREE.Vector3(3, 5, -8);
        this.cameraTarget = new THREE.Vector3();
        
        // Orbit camera controls
        this.cameraDistance = 10;
        this.cameraYaw = -Math.PI / 4;  // 45 degrees to the right
        this.cameraPitch = 0.3;         // Slightly down from horizontal
        this.minPitch = -0.5;
        this.maxPitch = 1.0;
        this.minDistance = 5;
        this.maxDistance = 20;
        
        // Lighting
        this.setupLighting();
        
        // Initialize UI - hide loading when ready
        this.initUI();
        
        // Hide loading screen - safe now that we're constructed
        document.getElementById('loading').classList.add('hidden');
        
        // Auto-play / test mode for health monitoring
        this.autoPlay = false;

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
        
        // Auto-play mode for health monitoring
        if (this.autoPlay) {
            this.handleAutoPlay(dt);
        }
        
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
        
        // Orbit camera controls
        if (this.input && this.input.isRightMouseDown !== undefined) {
            const deltas = this.input.consumeCameraDeltas();
            this.cameraYaw -= deltas.yaw;
            this.cameraPitch += deltas.pitch;
            this.cameraDistance -= deltas.zoom;
            this.cameraPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.cameraPitch));
            this.cameraDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.cameraDistance));
        }
        
        const playerPos = this.player.mesh.position;
        const cosPitch = Math.cos(this.cameraPitch);
        const sinPitch = Math.sin(this.cameraPitch);
        const cosYaw = Math.cos(this.cameraYaw);
        const sinYaw = Math.sin(this.cameraYaw);
        
        const cameraX = playerPos.x + this.cameraDistance * cosPitch * sinYaw;
        const cameraY = playerPos.y + this.cameraDistance * sinPitch + 2;
        const cameraZ = playerPos.z + this.cameraDistance * cosPitch * cosYaw;
        
        this.camera.position.lerp(
            new THREE.Vector3(cameraX, cameraY, cameraZ),
            0.1
        );
        
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
            this.score += 100; // Level completion bonus
            
            // Regenerate level
            this.level.clear();
            this.level.generateLevel(this.currentLevel);

            // Re-add player body to physics world (was removed by clear())
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
}    // Auto-play / Health Monitoring Mode
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
        
        // Calculate distance to goal (only X matters since goal is at y=0, z=0)
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
        
        // Auto-move player toward goal
        const moveSpeed = this.player.runSpeed || 14;
        
        // Move right constantly
        if (dx > 2) {
            // Move right toward goal
            this.player.body.velocity.x = moveSpeed;
        } else if (dx < -2) {
            // Move left if somehow past goal
            this.player.body.velocity.x = -moveSpeed;
        } else {
            // Near goal - stop horizontal movement
            this.player.body.velocity.x = 0;
        }
        
        // Jump if there's a height difference or obstacle
        if (dy > 1 && this.player.isOnGround) {
            this.player.body.velocity.y = this.player.jumpForce || 12;
        }
        
        // Auto-collect coins (magnet-like behavior)
        this.level.collectibles.forEach(coin => {
            if (coin.active) {
                const coinDx = coin.mesh.position.x - playerPos.x;
                const coinDy = coin.mesh.position.y - playerPos.y;
                const coinDist = Math.sqrt(coinDx * coinDx + coinDy * coinDy);
                if (coinDist < 3 && playerPos.y < coin.mesh.position.y) {
                    // Jump to collect
                    if (this.player.isOnGround) {
                        this.player.body.velocity.y = this.player.jumpForce || 12;
                    }
                }
            }
        });
        
        // Check if reached goal
        if (distanceToGoal < 2.5 && !this.autoPlayReachedGoal) {
            this.autoPlayReachedGoal = true;
            window.autoPlayProgress.reachedGoal = true;
            console.log('[AUTO-PLAY] Level 1 completed successfully!');
            // Don't disable - let it keep playing through levels
        }
    }
    
    // Export auto-play status for health monitoring
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
        // Sort by score descending
        this.highScores.sort((a, b) => b.score - a.score);
        // Keep only top 10
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
