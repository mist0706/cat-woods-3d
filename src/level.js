/**
 * Level generator - 3D version with large base platform
 * Each level has a ground platform you can't fall off,
 * with climbing platforms leading up to an elevated exit portal.
 * 
 * KEY CONSTRAINT: Max jump height = 2.4 units (v0=12, g=30)
 * Platform vertical gaps must be <= 2.0 units for reachable jumps.
 */
import * as THREE from '../vendor/three.module.js';
import * as CANNON from '../vendor/cannon-es.js';
import { Enemy } from './enemy.js';
import { PowerUp } from './powerup.js';

export class Level {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        
        this.platforms = [];
        this.collectibles = [];
        this.hazards = [];
        this.decorations = [];
        
        this.startPoint = { x: 0, y: 0, z: 0 };
        this.endPoint = { x: 10, y: 0, z: 0 };
    }
    
    generateLevel(levelNum) {
        // Store current theme
        this.currentTheme = 'forest';
        this.isSlippery = false;
        this.isUnderwater = false;
        this.isLowGravity = false;
        this.baseY = -1; // Base platform top surface Y
        this.levelNum = levelNum;
        
        this.enemies = [];
        this.powerups = [];
        
        // === LARGE BASE PLATFORM — you can't fall off ===
        const baseColor = this.getBaseColor(levelNum);
        const baseSize = 50 + levelNum * 4;
        this.createPlatform(0, this.baseY - 0.5, 0, baseSize, 1, baseSize, baseColor);
        
        // Ground decorations
        this.addBaseDecorations(baseSize, levelNum);
        
        // Start marker on the base
        this.startPoint = { x: 0, y: this.baseY + 1, z: 0 };
        this.createStartMarker(0, this.baseY + 1, 0);
        
        // Theme-specific generation: climbing platforms
        switch(levelNum) {
            case 1: this.generateLevel1(); break;
            case 2: this.generateLevel2(); break;
            case 3: this.generateLevel3(); break;
            case 4: this.generateLevel4(); break;
            case 5: this.generateLevel5(); break;
            case 6: this.generateLevel6(); break;
            case 7: this.generateLevel7(); break;
            case 8: this.generateLevel8(); break;
            case 9: this.generateLevel9(); break;
            case 10: this.generateLevel10(); break;
            case 11: this.generateLevel11(); break;
            case 12: this.generateLevel12(); break;
            case 13: this.generateLevel13(); break;
            default: this.generateLevel1(); break;
        }
        
        // Collectibles scattered around
        this.addCollectibles();
        
        // Goal portal — elevated, at the top of the climb
        const goalY = this.goalHeight;
        this.createGoal(0, this.baseY + goalY, 0);
    }
    
    // Each level sets this.goalHeight so createGoal knows where to place the exit
    get goalHeight() {
        return this._goalHeight || 8;
    }
    set goalHeight(h) {
        this._goalHeight = h;
    }
    
    getBaseColor(levelNum) {
        const colors = [
            0x5a7d5a, 0x6a8d6a, 0x4a6a4a, // 1-3 forest
            0x4a4a5a, 0x8a8a7a, 0xd0e8e8, // 4-6 cave, mountain, snow
            0x8a7a6a, 0x7acce8, 0x5a2a1a, // 7-9 ruins, sky, lava
            0x3a5a7a, 0x6a3a2a, 0x7a7a8a, // 10-12 underwater, volcano, castle
            0x2a2a4a  // 13 space
        ];
        return colors[Math.min(levelNum - 1, colors.length - 1)];
    }
    
    // Helper: platform relative to baseY
    plat(x, yOff, z, w, h, d, color) {
        return this.createPlatform(x, this.baseY + yOff, z, w, h, d, color);
    }
    
    // Helper: collectible at offset from baseY
    coin(x, yOff, z) {
        return this.createCollectible(x, this.baseY + yOff, z);
    }
    
    // Helper: hazard at offset from baseY
    hazard(x, yOff, z) {
        this.createHazard(x, this.baseY + yOff, z);
    }
    
    // Helper: enemy at offset from baseY
    enemy(x, yOff, z, type) {
        this.createEnemy(x, this.baseY + yOff, z, type);
    }
    
    // ═══════════════════════════════════════════
    // LEVEL DESIGNS — all platforms reachable (gaps ≤ 2 units)
    // ═══════════════════════════════════════════
    
    // Level 1: Gentle staircase pyramid — tutorial
    generateLevel1() {
        this.currentTheme = 'forest';
        this.goalHeight = 8;
        const c = 0x7a9d7a; // green
        
        // Wide steps spiraling up
        this.plat(0, 2, 0, 10, 0.5, 10, c);
        this.coin(0, 4, 0);
        this.plat(0, 4, 0, 8, 0.5, 8, c);
        this.plat(5, 4, 0, 3, 0.5, 3, c);
        this.coin(5, 6, 0);
        this.plat(5, 6, 0, 4, 0.5, 4, c);
        this.plat(0, 6, -5, 4, 0.5, 4, c);
        this.coin(0, 8, -5);
        this.plat(0, 8, -2, 5, 0.5, 5, c); // reaches goal height
    }
    
    // Level 2: Zigzag staircase
    generateLevel2() {
        this.currentTheme = 'forest';
        this.goalHeight = 10;
        const c = 0x8aad7a;
        
        // Zigzag path
        this.plat(6, 2, 0, 4, 0.5, 4, c);
        this.coin(6, 4, 0);
        this.plat(6, 4, -5, 4, 0.5, 4, c);
        this.plat(0, 4, -8, 4, 0.5, 4, c);
        this.plat(-6, 4, -5, 4, 0.5, 4, c);
        this.coin(-6, 6, -5);
        this.plat(-6, 6, 0, 4, 0.5, 4, c);
        this.plat(-6, 8, 5, 4, 0.5, 4, c);
        this.coin(-6, 10, 5);
        this.plat(0, 8, 5, 4, 0.5, 4, c);
        this.plat(0, 10, 0, 5, 0.5, 5, c); // goal
    }
    
    // Level 3: Central tower with branches
    generateLevel3() {
        this.currentTheme = 'forest';
        this.goalHeight = 10;
        const c1 = 0x9aad7a;
        const c2 = 0xaadd7a;
        
        // Stepped central tower (each step ≤2 units)
        this.plat(0, 2, 0, 6, 0.5, 6, c1);
        this.coin(0, 4, 0);
        this.plat(0, 4, 0, 5, 0.5, 5, c1);
        this.plat(0, 6, 0, 4, 0.5, 4, c1);
        this.coin(0, 8, 0);
        this.plat(0, 8, 0, 4, 0.5, 4, c2); // reachable from y=6
        
        // Branch platforms from y=4 and y=6
        this.plat(6, 4, 0, 3, 0.5, 3, c2);
        this.coin(6, 6, 0);
        this.plat(-6, 4, 0, 3, 0.5, 3, c2);
        this.plat(6, 6, -5, 3, 0.5, 3, c2);
        this.plat(-6, 6, 5, 3, 0.5, 3, c2);
        
        // Top level reaching goal
        this.plat(0, 10, 0, 4, 0.5, 4, c2); // goal platform
    }
    
    // Level 4: Cave — pillars rising up
    generateLevel4() {
        this.currentTheme = 'cave';
        this.goalHeight = 8;
        const c = 0x4a4a5a;
        
        // Stone pillars
        this.plat(0, 2, 0, 4, 0.5, 4, c);
        this.plat(5, 2, 4, 3, 0.5, 3, c);
        this.coin(5, 4, 4);
        this.plat(5, 4, 4, 3, 0.5, 3, c);
        this.plat(-3, 4, -4, 3, 0.5, 3, c);
        this.coin(-3, 6, -4);
        this.plat(-3, 6, -4, 3, 0.5, 3, c);
        this.plat(0, 6, 0, 4, 0.5, 4, c);
        this.plat(0, 8, 0, 4, 0.5, 4, c); // goal
        
        // Bats
        this.enemy(4, 5, 2, 'bat');
        this.enemy(-2, 7, -3, 'bat');
    }
    
    // Level 5: Mountain — ascending switchbacks
    generateLevel5() {
        this.currentTheme = 'mountain';
        this.goalHeight = 12;
        const c = 0x8a8a7a;
        
        // Switchback path going up
        this.plat(0, 2, -3, 5, 0.5, 4, c);
        this.plat(5, 2, -1, 4, 0.5, 4, c);
        this.coin(5, 4, -1);
        this.plat(5, 4, 3, 4, 0.5, 4, c);
        this.plat(0, 4, 3, 4, 0.5, 4, c);
        this.plat(-5, 4, 1, 4, 0.5, 4, c);
        this.coin(-5, 6, 1);
        this.plat(-5, 6, -3, 4, 0.5, 4, c);
        this.plat(0, 6, -3, 4, 0.5, 4, c);
        this.plat(5, 8, -1, 4, 0.5, 4, c);
        this.coin(5, 10, -1);
        this.plat(5, 10, 3, 4, 0.5, 4, c);
        this.plat(0, 10, 3, 4, 0.5, 4, c);
        this.plat(0, 12, 0, 5, 0.5, 5, c); // goal
        
        this.enemy(4, 6, -2, 'eagle');
    }
    
    // Level 6: Snow — icy stepped pyramid
    generateLevel6() {
        this.currentTheme = 'snow';
        this.isSlippery = true;
        this.goalHeight = 8;
        const c = 0xdde8e8;
        
        this.plat(0, 2, 0, 8, 0.5, 8, 0xeefefe);
        this.coin(0, 4, 0);
        this.plat(0, 4, 0, 7, 0.5, 7, c);
        this.plat(6, 4, 0, 3, 0.5, 3, c);
        this.coin(6, 6, 0);
        this.plat(-6, 4, 0, 3, 0.5, 3, c);
        this.plat(0, 6, 0, 6, 0.5, 6, c);
        this.plat(0, 8, 0, 5, 0.5, 5, c); // goal
    }
    
    // Level 7: Ruins — crumbled pillars at varying heights
    generateLevel7() {
        this.currentTheme = 'ruins';
        this.goalHeight = 10;
        const c = 0x9a8a6a;
        
        // Pillars and broken walls
        this.plat(3, 2, 0, 3, 0.5, 3, c);
        this.plat(3, 4, 0, 3, 0.5, 3, c);
        this.coin(3, 6, 0);
        this.plat(-3, 2, 3, 3, 0.5, 3, c);
        this.plat(-3, 4, 3, 3, 0.5, 3, c);
        this.plat(0, 6, 0, 4, 0.5, 4, c);
        this.plat(5, 6, -4, 3, 0.5, 3, c);
        this.coin(5, 8, -4);
        this.plat(5, 8, -4, 3, 0.5, 3, c);
        this.plat(0, 8, 0, 4, 0.5, 4, c);
        this.plat(0, 10, 0, 5, 0.5, 5, c); // goal
    }
    
    // Level 8: Sky — floating islands at various heights
    generateLevel8() {
        this.currentTheme = 'sky';
        this.goalHeight = 10;
        const c = 0x7addaa;
        
        this.plat(0, 2, 0, 5, 0.5, 5, c);
        this.plat(5, 4, -3, 3, 0.5, 3, c);
        this.coin(5, 6, -3);
        this.plat(-5, 4, 3, 3, 0.5, 3, c);
        this.plat(0, 6, 5, 4, 0.5, 4, c);
        this.plat(6, 6, 2, 3, 0.5, 3, c);
        this.plat(-4, 8, -4, 3, 0.5, 3, c);
        this.coin(-4, 10, -4);
        this.plat(0, 8, 0, 4, 0.5, 4, c);
        this.plat(0, 10, 0, 5, 0.5, 5, c); // goal
        
        this.enemy(4, 6, -2, 'eagle');
    }
    
    // Level 9: Lava — platforms over hazards
    generateLevel9() {
        this.currentTheme = 'lava';
        this.goalHeight = 10;
        const c = 0x4a3a3a;
        
        // Lava pools on base
        for (let i = 0; i < 4; i++) {
            const hx = (Math.random() - 0.5) * 20;
            const hz = (Math.random() - 0.5) * 20;
            this.hazard(hx, 1.5, hz);
        }
        
        this.plat(0, 2, 0, 5, 0.5, 5, c);
        this.plat(5, 2, -4, 4, 0.5, 4, c);
        this.plat(5, 4, -4, 3, 0.5, 3, c);
        this.coin(5, 6, -4);
        this.plat(-4, 4, 4, 3, 0.5, 3, c);
        this.plat(-4, 6, 0, 3, 0.5, 3, c);
        this.plat(0, 6, 0, 4, 0.5, 4, c);
        this.plat(0, 8, 0, 4, 0.5, 4, c);
        this.plat(0, 10, 0, 5, 0.5, 5, c); // goal
    }
    
    // Level 10: Underwater — coral shelves
    generateLevel10() {
        this.currentTheme = 'underwater';
        this.isUnderwater = true;
        this.goalHeight = 10;
        const c = 0x5a7a9a;
        
        this.plat(0, 2, 0, 6, 0.5, 6, c);
        this.coin(0, 4, 0);
        this.plat(5, 2, -4, 4, 0.5, 4, c);
        this.plat(5, 4, 0, 4, 0.5, 4, c);
        this.plat(-5, 4, 4, 4, 0.5, 4, c);
        this.coin(-5, 6, 4);
        this.plat(-5, 6, 0, 4, 0.5, 4, c);
        this.plat(0, 6, 5, 4, 0.5, 4, c);
        this.plat(0, 8, 2, 4, 0.5, 4, c);
        this.plat(0, 10, 0, 5, 0.5, 5, c); // goal
        
        this.enemy(4, 4, -3, 'fish');
        this.enemy(-4, 5, 2, 'fish');
    }
    
    // Level 11: Volcano — rock formations
    generateLevel11() {
        this.currentTheme = 'volcano';
        this.goalHeight = 12;
        const c = 0x5a4a4a;
        
        this.plat(0, 2, 0, 6, 0.5, 6, c);
        this.plat(4, 2, -4, 3, 0.5, 3, c);
        this.hazard(5, 1.5, -5);
        this.plat(4, 4, -4, 3, 0.5, 3, c);
        this.coin(4, 6, -4);
        this.plat(-4, 4, 4, 3, 0.5, 3, c);
        this.plat(-4, 6, 4, 3, 0.5, 3, c);
        this.plat(0, 6, 0, 5, 0.5, 5, c);
        this.plat(5, 6, 0, 3, 0.5, 3, c);
        this.plat(0, 8, -5, 4, 0.5, 4, c);
        this.plat(0, 8, 0, 4, 0.5, 4, c);
        this.coin(0, 10, 0);
        this.plat(0, 10, 0, 4, 0.5, 4, c);
        this.plat(0, 12, 0, 5, 0.5, 5, c); // goal
    }
    
    // Level 12: Castle — turrets and walls
    generateLevel12() {
        this.currentTheme = 'castle';
        this.goalHeight = 12;
        const c = 0x7a7a8a;
        const cw = 0x8a8a9a;
        
        // Ground floor
        this.plat(0, 2, 0, 8, 0.5, 8, c);
        // Corner turrets
        this.plat(6, 2, 6, 3, 0.5, 3, cw);
        this.plat(6, 4, 6, 2, 0.5, 2, cw);
        this.coin(6, 6, 6);
        this.plat(-6, 2, 6, 3, 0.5, 3, cw);
        this.plat(-6, 4, 6, 2, 0.5, 2, cw);
        this.plat(6, 2, -6, 3, 0.5, 3, cw);
        this.enemy(6, 4, -6, 'fox');
        this.plat(-6, 2, -6, 3, 0.5, 3, cw);
        this.plat(-6, 4, -6, 2, 0.5, 2, cw);
        
        // Central tower
        this.plat(0, 4, 0, 5, 0.5, 5, c);
        this.plat(0, 6, 0, 4, 0.5, 4, c);
        this.plat(0, 8, 0, 3, 0.5, 3, c);
        this.coin(0, 10, 0);
        this.plat(0, 10, 0, 4, 0.5, 4, c);
        this.plat(0, 12, 0, 4, 0.5, 4, c); // goal
    }
    
    // Level 13: Space — low gravity, big jumps
    generateLevel13() {
        this.currentTheme = 'space';
        this.isLowGravity = true;
        this.goalHeight = 14;
        const c = 0x3a3a5a;
        
        // Wider gaps allowed with low gravity (jump height ~4.8 units)
        this.plat(0, 2, 0, 5, 0.5, 5, c);
        this.plat(6, 4, -4, 3, 0.5, 3, c);
        this.coin(6, 6, -4);
        this.plat(-6, 4, 4, 3, 0.5, 3, c);
        this.plat(0, 6, 0, 4, 0.5, 4, c);
        this.plat(7, 8, 2, 3, 0.5, 3, c);
        this.plat(-5, 8, -4, 3, 0.5, 3, c);
        this.coin(-5, 10, -4);
        this.plat(0, 10, 0, 4, 0.5, 4, c);
        this.plat(5, 12, -3, 3, 0.5, 3, c);
        this.plat(-4, 12, 3, 3, 0.5, 3, c);
        this.plat(0, 14, 0, 5, 0.5, 5, c); // goal
        
        this.enemy(5, 6, 0, 'asteroid');
        this.enemy(-5, 10, 0, 'asteroid');
    }
    
    // ═══════════════════════════════════════════
    // SHARED INFRASTRUCTURE
    // ═══════════════════════════════════════════
    
    createStartMarker(x, y, z) {
        const geo = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16);
        const mat = new THREE.MeshLambertMaterial({ color: 0x4ecdc4, emissive: 0x2a7a70, emissiveIntensity: 0.5 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y - 0.1, z);
        this.scene.add(mesh);
        this.decorations.push({ type: 'startMarker', mesh });
    }
    
    createPlatform(x, y, z, width, height, depth, color) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshLambertMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        
        const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(x, y, z),
            shape: shape
        });
        body.material = new CANNON.Material({ friction: 0.5 });
        this.world.addBody(body);
        
        this.platforms.push({ mesh, body });
        return { mesh, body };
    }
    
    createMovingPlatform(x, y, z, width, height, depth) {
        const platform = this.createPlatform(x, y, z, width, height, depth, 0x9966ff);
        platform.originalY = y;
        platform.moveRange = 2;
        platform.speed = 2;
        platform.timeOffset = Math.random() * Math.PI * 2;
        this.platforms[this.platforms.length - 1].isMoving = true;
    }
    
    createCollectible(x, y, z) {
        const coin = new Collectible(x, y, z, this.scene);
        this.collectibles.push(coin);
        return coin;
    }
    
    createHazard(x, y, z) {
        const geometry = new THREE.ConeGeometry(0.3, 1, 4);
        const material = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y + 0.5, z);
        mesh.castShadow = true;
        this.scene.add(mesh);
        
        const shape = new CANNON.Box(new CANNON.Vec3(0.3, 0.5, 0.3));
        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(x, y + 0.5, z),
            shape: shape,
            isTrigger: true
        });
        this.world.addBody(body);
        
        this.hazards.push({ mesh, body, x, y, z });
    }
    
    createGoal(x, y, z) {
        // Glowing portal arch
        const frameGeo = new THREE.TorusGeometry(1.5, 0.15, 8, 16, Math.PI);
        const frameMat = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0xaa8800, emissiveIntensity: 0.6 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(x, y + 1.5, z);
        this.scene.add(frame);
        
        // Glowing inner portal
        const portalGeo = new THREE.CircleGeometry(1.3, 16);
        const portalMat = new THREE.MeshBasicMaterial({ 
            color: 0x4ecdc4, transparent: true, opacity: 0.6, side: THREE.DoubleSide
        });
        const portal = new THREE.Mesh(portalGeo, portalMat);
        portal.position.set(x, y + 1.5, z);
        this.scene.add(portal);
        
        // Goal landing platform
        this.createPlatform(x, y - 0.25, z, 4, 0.5, 4, 0x5a7d5a);
        
        this.endPoint = { x, y: y + 0.5, z };
        this.createGoalParticles(x, y + 1.5, z);
    }
    
    createGoalParticles(x, y, z) {
        const particleCount = 20;
        const particles = new THREE.Group();
        for (let i = 0; i < particleCount; i++) {
            const geo = new THREE.SphereGeometry(0.1, 4, 4);
            const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 1, 0.5)
            });
            const p = new THREE.Mesh(geo, mat);
            p.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2
                ),
                life: Math.random() * 2
            };
            particles.add(p);
        }
        particles.position.set(x, y, z);
        this.scene.add(particles);
        this.decorations.push({ type: 'particles', mesh: particles });
    }
    
    addBaseDecorations(baseSize, levelNum) {
        // Scatter grass on the base
        for (let i = 0; i < 40; i++) {
            const x = (Math.random() - 0.5) * baseSize * 0.6;
            const z = (Math.random() - 0.5) * baseSize * 0.6;
            this.createGrass(x, this.baseY + 0.5, z);
        }
        // Trees around the edges
        const halfSize = baseSize / 2;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const radius = halfSize * 0.7 + Math.random() * halfSize * 0.2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            this.createTree(x, this.baseY + 0.5, z);
        }
    }
    
    addCollectibles() {
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 20;
            const y = this.baseY + 2 + Math.random() * 2;
            this.createCollectible(x, y, z);
        }
    }
    
    createGrass(x, y, z) {
        const geometry = new THREE.ConeGeometry(0.1, 0.3, 3);
        const material = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        this.scene.add(mesh);
        return mesh;
    }
    
    createTree(x, y, z) {
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 2, 8);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, y + 1, z);
        trunk.castShadow = true;
        this.scene.add(trunk);
        
        const leavesGeo = new THREE.ConeGeometry(2, 4, 8);
        const leavesMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.set(x, y + 4, z);
        leaves.castShadow = true;
        this.scene.add(leaves);
        
        this.decorations.push({ type: 'tree', meshes: [trunk, leaves] });
    }
    
    update(dt) {
        this.platforms.forEach(platform => {
            if (platform.isMoving) {
                const time = Date.now() / 1000;
                const newY = platform.originalY + Math.sin(time * platform.speed) * platform.moveRange;
                platform.body.position.y = newY;
                platform.mesh.position.y = newY;
            }
        });
        
        this.collectibles.forEach(coin => {
            if (coin.active) coin.update(dt);
        });
        
        this.decorations.forEach(dec => {
            if (dec.type === 'particles' && dec.mesh) {
                dec.mesh.children.forEach(p => {
                    if (p.userData) {
                        p.position.add(p.userData.velocity.clone().multiplyScalar(dt));
                        p.userData.velocity.y -= 9.8 * dt;
                        p.userData.life -= dt;
                        if (p.userData.life <= 0 || p.position.y < -5) {
                            p.position.set((Math.random() - 0.5) * 2, 4 + Math.random(), (Math.random() - 0.5) * 2);
                            p.userData.velocity.set((Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2);
                            p.userData.life = 2;
                        }
                    }
                });
            }
        });
    }
    
    clear() {
        this.platforms.forEach(p => {
            this.scene.remove(p.mesh);
            if (p.mesh.geometry) p.mesh.geometry.dispose();
            if (p.mesh.material) p.mesh.material.dispose();
            this.world.removeBody(p.body);
        });
        this.platforms = [];
        
        this.collectibles.forEach(c => c.dispose());
        this.collectibles = [];
        
        this.hazards.forEach(h => {
            this.scene.remove(h.mesh);
            if (h.mesh.geometry) h.mesh.geometry.dispose();
            if (h.mesh.material) h.mesh.material.dispose();
            this.world.removeBody(h.body);
        });
        this.hazards = [];
        
        if (this.enemies) {
            this.enemies.forEach(e => e.dispose());
            this.enemies = [];
        }
        
        if (this.powerups) {
            this.powerups.forEach(p => { if (p.mesh) this.scene.remove(p.mesh); });
            this.powerups = [];
        }
        
        this.decorations.forEach(d => {
            if (d.type === 'tree') {
                d.meshes.forEach(m => {
                    this.scene.remove(m);
                    if (m.geometry) m.geometry.dispose();
                    if (m.material) m.material.dispose();
                });
            } else if (d.type === 'particles') {
                this.scene.remove(d.mesh);
            } else {
                this.scene.remove(d.mesh);
            }
        });
        this.decorations = [];
        
        const toRemove = [];
        this.scene.children.forEach(child => {
            if (child.isMesh && !child.isCamera) toRemove.push(child);
        });
        toRemove.forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
        
        const bodies = this.world.bodies.slice();
        bodies.forEach(body => this.world.removeBody(body));
    }
    
    createEnemy(x, y, z, type) {
        const enemy = new Enemy(type, x, y, z, this.scene, this.world);
        if (!this.enemies) this.enemies = [];
        this.enemies.push(enemy);
        return enemy;
    }
    
    createPowerUp(x, y, z, type) {
        const powerup = new PowerUp(type, x, y, z, this.scene);
        if (!this.powerups) this.powerups = [];
        this.powerups.push(powerup);
        return powerup;
    }
    
    createDecoration(x, y, z, type) {
        let mesh;
        if (type === 'tree') {
            mesh = this.createTree(x, y, z);
        } else if (type === 'rock') {
            const geometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5);
            const material = new THREE.MeshLambertMaterial({ color: 0x666666 });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y + 0.5, z);
            this.scene.add(mesh);
        } else if (type === 'stalactite') {
            const geometry = new THREE.ConeGeometry(0.15, 2, 6);
            const material = new THREE.MeshLambertMaterial({ color: 0x777777 });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y + 3, z);
            this.scene.add(mesh);
        } else if (type === 'column') {
            const geometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
            const material = new THREE.MeshLambertMaterial({ color: 0x9a9a9a });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y + 1.5, z);
            this.scene.add(mesh);
        }
        if (mesh) this.decorations.push({ type, mesh });
        return mesh;
    }
}

class Collectible {
    constructor(x, y, z, scene) {
        this.scene = scene;
        this.active = true;
        this.baseY = y;
        this.time = Math.random() * Math.PI * 2;
        
        const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xffd700, emissive: 0xaa8800, emissiveIntensity: 0.3
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
    }
    
    update(dt) {
        this.time += dt * 3;
        this.mesh.position.y = this.baseY + Math.sin(this.time) * 0.3;
        this.mesh.rotation.z += dt * 2;
    }
    
    collect() {
        if (!this.active) return;
        this.active = false;
        const animate = () => {
            this.mesh.scale.multiplyScalar(0.9);
            if (this.mesh.scale.x > 0.1) requestAnimationFrame(animate);
            else this.dispose();
        };
        animate();
    }
    
    dispose() {
        this.active = false;
        this.scene.remove(this.mesh);
        this.mesh.geometry?.dispose();
        this.mesh.material?.dispose();
    }
}