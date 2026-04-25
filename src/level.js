/**
 * Level generator - 3D version with large base platform
 * Each level has a ground platform you can't fall off,
 * with climbing platforms and structures leading to an elevated exit.
 * The goal is UP, not forward.
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
        // Level difficulty increases
        const length = 50 + (levelNum * 15);
        
        // Store current theme
        this.currentTheme = 'forest';
        this.isSlippery = false;
        this.isUnderwater = false;
        this.isLowGravity = false;
        this.baseY = -1; // Base platform top surface Y
        
        this.enemies = [];
        this.powerups = [];
        
        // === LARGE BASE PLATFORM — you can't fall off ===
        const baseColor = this.getBaseColor(levelNum);
        const baseSize = 60 + levelNum * 5; // Gets wider with levels
        this.createPlatform(0, this.baseY - 0.5, 0, baseSize, 1, baseSize, baseColor);
        
        // Ground decorations (grass, etc on the base)
        this.addBaseDecorations(baseSize, levelNum);
        
        // Start marker on the base
        this.startPoint = { x: 0, y: this.baseY + 1, z: 0 };
        this.createStartMarker(0, this.baseY + 1, 0);
        
        // Theme-specific generation: climbing platforms, enemies, hazards
        switch(levelNum) {
            case 1: this.generateLevel1(length); break;
            case 2: this.generateLevel2(length); break;
            case 3: this.generateLevel3(length); break;
            case 4: this.generateLevel4(length); break;
            case 5: this.generateLevel5(length); break;
            case 6: this.generateLevel6(length); break;
            case 7: this.generateLevel7(length); break;
            case 8: this.generateLevel8(length); break;
            case 9: this.generateLevel9(length); break;
            case 10: this.generateLevel10(length); break;
            case 11: this.generateLevel11(length); break;
            case 12: this.generateLevel12(length); break;
            case 13: this.generateLevel13(length); break;
            default: this.generateLevel1(length); break;
        }
        
        // Collectibles scattered on and around platforms
        this.addCollectibles(length);
        
        // Goal — elevated, requiring climbing
        const goalHeight = 8 + levelNum * 2;
        this.createGoal(0, this.baseY + goalHeight, 0);
    }
    
    getBaseColor(levelNum) {
        const colors = [
            0x5a7d5a, // 1 forest
            0x6a8d6a, // 2 deeper forest
            0x4a6a4a, // 3 dark forest
            0x4a4a5a, // 4 cave
            0x8a8a7a, // 5 mountain
            0xd0e8e8, // 6 snow
            0x8a7a6a, // 7 ruins
            0x7acce8, // 8 sky
            0x5a2a1a, // 9 lava
            0x3a5a7a, // 10 underwater
            0x6a3a2a, // 11 volcano
            0x7a7a8a, // 12 castle
            0x2a2a4a, // 13 space
        ];
        return colors[Math.min(levelNum - 1, colors.length - 1)];
    }
    
    // Level 1: Forest — gentle introduction, wide platforms, slow ramp up
    generateLevel1(length) {
        this.currentTheme = 'forest';
        // Stepped pyramid — easy to climb
        const steps = 6;
        for (let i = 1; i <= steps; i++) {
            const size = 10 - i * 1.2;
            const y = this.baseY + i * 1.5;
            this.createPlatform(0, y, 0, size, 0.5, size, 0x7a9d7a);
            // Coins on each step
            this.createCollectible(0, y + 2, 0);
        }
        // Side platforms with coins
        this.createPlatform(8, this.baseY + 3, 0, 4, 0.5, 4, 0x8aad7a);
        this.createCollectible(8, this.baseY + 5, 0);
        this.createPlatform(-8, this.baseY + 5, 0, 4, 0.5, 4, 0x8aad7a);
        this.createCollectible(-8, this.baseY + 7, 0);
    }
    
    // Level 2: Wider forest — platforms spread out, some jumping required
    generateLevel2(length) {
        this.currentTheme = 'forest';
        // Staircase along Z axis
        for (let i = 1; i <= 7; i++) {
            const x = (i % 2 === 0 ? 5 : -3) * (i > 4 ? 0.8 : 1);
            const z = (i - 1) * 4 - 8;
            const y = this.baseY + i * 1.8;
            this.createPlatform(x, y, z, 4, 0.5, 4, 0x8a9d7a);
            this.createCollectible(x, y + 2, z);
        }
        // Moving platform challenge
        this.createMovingPlatform(0, this.baseY + 8, 0, 3, 0.5, 3);
        // Side reward platform
        this.createPlatform(12, this.baseY + 6, 5, 3, 0.5, 3, 0x6a8d6a);
        this.createCollectible(12, this.baseY + 8, 5);
    }
    
    // Level 3: Dense forest — tighter jumps, vertical towers
    generateLevel3(length) {
        this.currentTheme = 'forest';
        // Central tower
        this.createPlatform(0, this.baseY + 3, 0, 5, 0.5, 5, 0x9aad7a);
        this.createPlatform(0, this.baseY + 6, 0, 4, 0.5, 4, 0x8a9d6a);
        this.createPlatform(0, this.baseY + 9, 0, 3, 0.5, 3, 0x7a8d5a);
        // Branch platforms
        const branches = [
            [6, this.baseY + 4, -5], [-6, this.baseY + 4, -3],
            [5, this.baseY + 7, 5], [-5, this.baseY + 7, 4],
            [8, this.baseY + 10, 0], [-7, this.baseY + 10, -2]
        ];
        branches.forEach(([x, y, z]) => {
            this.createPlatform(x, y, z, 3, 0.5, 3, 0xaadd7a);
            this.createCollectible(x, y + 2, z);
        });
    }
    
    // Level 4: Cave — darker, tighter, with stalactites
    generateLevel4(length) {
        this.currentTheme = 'cave';
        // Stone pillars rising from the ground
        const pillarPositions = [
            [0, 4], [5, 3], [-5, -2], [8, -4], [-8, 0],
            [3, -6], [-3, 5], [0, -3]
        ];
        pillarPositions.forEach(([x, z], i) => {
            const h = 2 + i * 0.8;
            const y = this.baseY + h;
            const size = 3 - i * 0.1;
            this.createPlatform(x, y, z, size, 0.5, size, 0x4a4a5a);
            if (i % 2 === 0) {
                this.createCollectible(x, y + 2, z);
            }
            // Stalactites from ceiling (visual)
            if (Math.random() > 0.5) {
                this.createDecoration(x + 1, y + 5, z, 'stalactite');
            }
        });
        // Bat enemies
        this.createEnemy(3, this.baseY + 5, -2, 'bat');
        this.createEnemy(-5, this.baseY + 6, 2, 'bat');
    }
    
    // Level 5: Mountain — ascending switchback path
    generateLevel5(length) {
        this.currentTheme = 'mountain';
        // Switchback path going up
        const heights = [2, 3.5, 5, 6.5, 8, 9.5, 11, 13];
        heights.forEach((h, i) => {
            const side = i % 2 === 0 ? 1 : -1;
            const x = side * (5 + (i % 3) * 2);
            const z = (i - 3) * 3;
            this.createPlatform(x, this.baseY + h, z, 5, 0.5, 3, 0x8a8a7a);
            this.createCollectible(x, this.baseY + h + 2, z);
            if (i % 3 === 2) {
                this.createEnemy(x, this.baseY + h + 1, z, 'eagle');
            }
        });
    }
    
    // Level 6: Snow — slippery surfaces
    generateLevel6(length) {
        this.currentTheme = 'snow';
        this.isSlippery = true;
        // Wide icy platforms
        this.createPlatform(0, this.baseY + 2, 0, 8, 0.5, 8, 0xeefefe);
        this.createPlatform(0, this.baseY + 4, 0, 7, 0.5, 7, 0xdde8e8);
        this.createPlatform(0, this.baseY + 6, 0, 6, 0.5, 6, 0xccdada);
        // Icy stepping stones off to the sides
        for (let i = 1; i <= 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const x = Math.cos(angle) * 10;
            const z = Math.sin(angle) * 10;
            this.createPlatform(x, this.baseY + 3 + i * 1.5, z, 3, 0.5, 3, 0xeefefe);
            this.createCollectible(x, this.baseY + 5 + i * 1.5, z);
        }
    }
    
    // Level 7: Ruins — crumbled pillars and gaps
    generateLevel7(length) {
        this.currentTheme = 'ruins';
        // Scattered ruined pillars
        const ruins = [
            [0, 2.5, 0], [4, 4, -4], [-4, 3, 4], [6, 5.5, 2],
            [-6, 4, -3], [0, 7, 6], [3, 6, 5], [-5, 6, -5],
            [8, 8, 0], [-3, 9, -6], [0, 10.5, 0]
        ];
        ruins.forEach(([x, y, z], i) => {
            const size = 2 + Math.random() * 2;
            this.createPlatform(x, this.baseY + y, z, size, 0.5, size, 0x9a8a6a);
            if (i % 2 === 1) {
                this.createCollectible(x, this.baseY + y + 2, z);
            }
            // Columns as decoration
            if (Math.random() > 0.5) {
                this.createDecoration(x + 1, this.baseY + y, z + 1, 'column');
            }
        });
    }
    
    // Level 8: Sky — floating islands
    generateLevel8(length) {
        this.currentTheme = 'sky';
        // Floating islands at various heights
        const islands = [
            [0, 3, 0, 6], [6, 5, -3, 4], [-6, 5, 3, 4],
            [0, 8, 6, 5], [8, 7, 0, 3], [-8, 7, -5, 3],
            [4, 10, -6, 4], [-4, 11, 6, 4],
            [0, 13, 0, 5]
        ];
        islands.forEach(([x, y, z, size]) => {
            this.createPlatform(x, this.baseY + y, z, size, 0.5, size, 0x7addaa);
            this.createCollectible(x, this.baseY + y + 2, z);
        });
        // Eagle patrollers
        this.createEnemy(5, this.baseY + 8, 0, 'eagle');
        this.createEnemy(-5, this.baseY + 10, 0, 'eagle');
    }
    
    // Level 9: Lava — platforms over danger
    generateLevel9(length) {
        this.currentTheme = 'lava';
        // Lava pools on the base (hazards)
        for (let i = 0; i < 4; i++) {
            const x = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 20;
            this.createHazard(x, this.baseY + 1.5, z);
        }
        // Rising platforms
        const climbs = [
            [0, 3, 0, 5], [4, 5, 3, 3], [-4, 5, -3, 3],
            [0, 7, 0, 4], [6, 9, -2, 3], [-5, 9, 4, 3],
            [0, 11, 0, 4], [3, 13, 3, 3], [-2, 14, 0, 5]
        ];
        climbs.forEach(([x, y, z, size]) => {
            this.createPlatform(x, this.baseY + y, z, size, 0.5, size, 0x4a3a3a);
            this.createCollectible(x, this.baseY + y + 2, z);
        });
        this.createEnemy(0, this.baseY + 8, 0, 'bat');
    }
    
    // Level 10: Underwater
    generateLevel10(length) {
        this.currentTheme = 'underwater';
        this.isUnderwater = true;
        // Coral-like platforms
        const platforms = [
            [0, 2, 0, 6], [5, 3.5, -4, 4], [-5, 4, 4, 4],
            [0, 6, -6, 5], [7, 7, 0, 3], [-7, 7, -2, 3],
            [3, 9, 5, 4], [-3, 9, -5, 4],
            [0, 11, 0, 5], [6, 13, 3, 3], [-5, 13, -4, 3],
            [0, 15, 0, 4]
        ];
        platforms.forEach(([x, y, z, size]) => {
            this.createPlatform(x, this.baseY + y, z, size, 0.5, size, 0x5a7a9a);
            this.createCollectible(x, this.baseY + y + 2, z);
        });
        this.createEnemy(4, this.baseY + 5, -3, 'fish');
        this.createEnemy(-4, this.baseY + 6, 3, 'fish');
    }
    
    // Level 11: Volcano
    generateLevel11(length) {
        this.currentTheme = 'volcano';
        // Volcanic rock formations
        const rocks = [
            [0, 2, 0, 6], [4, 3, -4, 3], [-4, 3.5, 4, 3],
            [6, 5, 0, 3], [-6, 5.5, -3, 3], [0, 7, 5, 4],
            [5, 9, -5, 3], [-5, 9.5, 5, 3],
            [3, 11, 0, 3], [-3, 12, -4, 3],
            [0, 14, 0, 5]
        ];
        rocks.forEach(([x, y, z, size]) => {
            this.createPlatform(x, this.baseY + y, z, size, 0.5, size, 0x5a4a4a);
            this.createCollectible(x, this.baseY + y + 2, z);
            if (Math.random() > 0.7) {
                this.createHazard(x + 1, this.baseY + y + 1, z);
            }
        });
        this.createEnemy(0, this.baseY + 8, 0, 'bat');
    }
    
    // Level 12: Castle — guard foxes
    generateLevel12(length) {
        this.currentTheme = 'castle';
        // Castle tower structure
        this.createPlatform(0, this.baseY + 2, 0, 8, 0.5, 8, 0x7a7a8a);
        // Corner turrets
        const corners = [[6, 6], [6, -6], [-6, 6], [-6, -6]];
        corners.forEach(([x, z], i) => {
            this.createPlatform(x, this.baseY + 4, z, 3, 0.5, 3, 0x8a8a9a);
            this.createPlatform(x, this.baseY + 7, z, 2, 0.5, 2, 0x7a7a8a);
            this.createCollectible(x, this.baseY + 9, z);
            // Fox guard
            this.createEnemy(x, this.baseY + 5, z, 'fox');
        });
        // Central tower
        this.createPlatform(0, this.baseY + 6, 0, 5, 0.5, 5, 0x8a8a9a);
        this.createPlatform(0, this.baseY + 9, 0, 4, 0.5, 4, 0x7a7a8a);
        this.createPlatform(0, this.baseY + 12, 0, 3, 0.5, 3, 0x6a6a7a);
        // Battlement connections
        this.createPlatform(3, this.baseY + 7.5, 0, 2, 0.5, 8, 0x8a8a9a);
        this.createPlatform(-3, this.baseY + 7.5, 0, 2, 0.5, 8, 0x8a8a9a);
        this.createPlatform(0, this.baseY + 7.5, 3, 8, 0.5, 2, 0x8a8a9a);
        this.createPlatform(0, this.baseY + 7.5, -3, 8, 0.5, 2, 0x8a8a9a);
    }
    
    // Level 13: Space — low gravity, big jumps
    generateLevel13(length) {
        this.currentTheme = 'space';
        this.isLowGravity = true;
        // Floating asteroid platforms
        const asteroids = [
            [0, 3, 0, 5], [5, 5, -5, 3], [-5, 5, 5, 3],
            [0, 8, 7, 4], [7, 7, 3, 3], [-7, 9, -5, 3],
            [3, 11, -8, 3], [-3, 12, 8, 3],
            [8, 14, -3, 4], [-8, 13, 3, 4],
            [0, 16, 0, 4], [5, 18, 0, 3], [-4, 19, 0, 3],
            [0, 21, 0, 5]
        ];
        asteroids.forEach(([x, y, z, size]) => {
            this.createPlatform(x, this.baseY + y, z, size, 0.5, size, 0x3a3a5a);
            this.createCollectible(x, this.baseY + y + 2, z);
        });
        this.createEnemy(5, this.baseY + 7, 0, 'asteroid');
        this.createEnemy(-5, this.baseY + 12, 0, 'asteroid');
    }
    
    createStartMarker(x, y, z) {
        // Glowing start pad on the base
        const geo = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16);
        const mat = new THREE.MeshLambertMaterial({ color: 0x4ecdc4, emissive: 0x2a7a70, emissiveIntensity: 0.5 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y - 0.1, z);
        this.scene.add(mesh);
        this.decorations.push({ type: 'startMarker', mesh });
    }
    
    createPlatform(x, y, z, width, height, depth, color) {
        // Visual mesh
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshLambertMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        
        // Physics body
        const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
        const body = new CANNON.Body({
            mass: 0, // Static
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
        
        // Add animation data
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
        // Visual spike
        const geometry = new THREE.ConeGeometry(0.3, 1, 4);
        const material = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y + 0.5, z);
        mesh.castShadow = true;
        this.scene.add(mesh);
        
        // Invisible physics body for collision
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
        // Glowing portal/doorway
        // Arc frame
        const frameGeo = new THREE.TorusGeometry(1.5, 0.15, 8, 16, Math.PI);
        const frameMat = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0xaa8800, emissiveIntensity: 0.6 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(x, y + 1.5, z);
        frame.rotation.y = 0;
        this.scene.add(frame);
        
        // Glowing inner portal
        const portalGeo = new THREE.CircleGeometry(1.3, 16);
        const portalMat = new THREE.MeshBasicMaterial({ 
            color: 0x4ecdc4, 
            transparent: true, 
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const portal = new THREE.Mesh(portalGeo, portalMat);
        portal.position.set(x, y + 1.5, z);
        this.scene.add(portal);
        
        // Base platform for the goal
        this.createPlatform(x, y - 0.25, z, 4, 0.5, 4, 0x5a7d5a);
        
        this.endPoint = { x, y: y + 0.5, z };
        
        // Portal particles
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
                    (Math.random() - 0.5) * 2,
                    Math.random() * 2,
                    (Math.random() - 0.5) * 2
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
        const halfSize = baseSize / 2;
        
        // Scatter grass/flowers on the base
        for (let i = 0; i < 40; i++) {
            const x = (Math.random() - 0.5) * baseSize * 0.6;
            const z = (Math.random() - 0.5) * baseSize * 0.6;
            this.createGrass(x, this.baseY + 0.5, z);
        }
        
        // Trees around the edges
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const radius = halfSize * 0.7 + Math.random() * halfSize * 0.2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            this.createTree(x, this.baseY + 0.5, z);
        }
    }
    
    addForestDecorations(minX, maxX) {
        // Kept for compatibility but unused in new design
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
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 2, 8);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, y + 1, z);
        trunk.castShadow = true;
        this.scene.add(trunk);
        
        // Leaves
        const leavesGeo = new THREE.ConeGeometry(2, 4, 8);
        const leavesMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.set(x, y + 4, z);
        leaves.castShadow = true;
        this.scene.add(leaves);
        
        this.decorations.push({ type: 'tree', meshes: [trunk, leaves] });
    }
    
    addCollectibles(levelLength) {
        // Additional coins scattered around the base and on platforms
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 20;
            const y = this.baseY + 2 + Math.random() * 2;
            this.createCollectible(x, y, z);
        }
    }
    
    update(dt) {
        // Update moving platforms
        this.platforms.forEach(platform => {
            if (platform.isMoving) {
                const time = Date.now() / 1000;
                const newY = platform.originalY + Math.sin(time * platform.speed) * platform.moveRange;
                platform.body.position.y = newY;
                platform.mesh.position.y = newY;
            }
        });
        
        // Update collectibles animation
        this.collectibles.forEach(coin => {
            if (coin.active) {
                coin.update(dt);
            }
        });
        
        // Update particles
        this.decorations.forEach(dec => {
            if (dec.type === 'particles' && dec.mesh) {
                dec.mesh.children.forEach(p => {
                    if (p.userData) {
                        p.position.add(p.userData.velocity.clone().multiplyScalar(dt));
                        p.userData.velocity.y -= 9.8 * dt; // Gravity
                        p.userData.life -= dt;
                        
                        if (p.userData.life <= 0 || p.position.y < -5) {
                            p.position.set(
                                (Math.random() - 0.5) * 2,
                                4 + Math.random(),
                                (Math.random() - 0.5) * 2
                            );
                            p.userData.velocity.set(
                                (Math.random() - 0.5) * 2,
                                Math.random() * 2,
                                (Math.random() - 0.5) * 2
                            );
                            p.userData.life = 2;
                        }
                    }
                });
            }
        });
    }
    
    clear() {
        // Remove all platforms
        this.platforms.forEach(p => {
            this.scene.remove(p.mesh);
            if (p.mesh.geometry) p.mesh.geometry.dispose();
            if (p.mesh.material) p.mesh.material.dispose();
            this.world.removeBody(p.body);
        });
        this.platforms = [];
        
        // Remove collectibles
        this.collectibles.forEach(c => c.dispose());
        this.collectibles = [];
        
        // Remove hazards
        this.hazards.forEach(h => {
            this.scene.remove(h.mesh);
            if (h.mesh.geometry) h.mesh.geometry.dispose();
            if (h.mesh.material) h.mesh.material.dispose();
            this.world.removeBody(h.body);
        });
        this.hazards = [];
        
        // Remove enemies
        if (this.enemies) {
            this.enemies.forEach(e => e.dispose());
            this.enemies = [];
        }
        
        // Remove powerups
        if (this.powerups) {
            this.powerups.forEach(p => {
                if (p.mesh) this.scene.remove(p.mesh);
            });
            this.powerups = [];
        }
        
        // Remove decorations
        this.decorations.forEach(d => {
            if (d.type === 'tree') {
                d.meshes.forEach(m => {
                    this.scene.remove(m);
                    if (m.geometry) m.geometry.dispose();
                    if (m.material) m.material.dispose();
                });
            } else if (d.type === 'grass') {
                this.scene.remove(d.mesh);
                if (d.mesh.geometry) d.mesh.geometry.dispose();
                if (d.mesh.material) d.mesh.material.dispose();
            } else if (d.type === 'particles') {
                this.scene.remove(d.mesh);
            } else {
                this.scene.remove(d.mesh);
            }
        });
        this.decorations = [];
        
        // Clear remaining meshes from scene (preserve lights and camera)
        const toRemove = [];
        this.scene.children.forEach(child => {
            if (child.isMesh && !child.isCamera) {
                toRemove.push(child);
            }
        });
        toRemove.forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
        
        // Clear bodies from world
        const bodies = this.world.bodies.slice();
        bodies.forEach(body => {
            this.world.removeBody(body);
        });
    }
    
    // Helper methods for level generation
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
        
        if (mesh) {
            this.decorations.push({ type: type, mesh: mesh });
        }
        return mesh;
    }
}

/**
 * Collectible coin class
 */
class Collectible {
    constructor(x, y, z, scene) {
        this.scene = scene;
        this.active = true;
        this.baseY = y;
        this.time = Math.random() * Math.PI * 2;
        
        const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xffd700,
            emissive: 0xaa8800,
            emissiveIntensity: 0.3
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.castShadow = true;
        
        this.scene.add(this.mesh);
    }
    
    update(dt) {
        this.time += dt * 3;
        
        // Bob up and down
        this.mesh.position.y = this.baseY + Math.sin(this.time) * 0.3;
        
        // Rotate
        this.mesh.rotation.z += dt * 2;
    }
    
    collect() {
        if (!this.active) return;
        this.active = false;
        
        // Scale down animation
        const animate = () => {
            this.mesh.scale.multiplyScalar(0.9);
            if (this.mesh.scale.x > 0.1) {
                requestAnimationFrame(animate);
            } else {
                this.dispose();
            }
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