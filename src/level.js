/**
 * Level generator - 3D version
 * Creates platforms, obstacles, collectibles, and atmosphere
 */
import * as THREE from '../lib/three.module.js';
import * as CANNON from '../lib/cannon-es.js';
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
        // Level difficulty increases - longer levels for 20-30 second runs
        const length = 50 + (levelNum * 15);
        
        // Store current theme
        this.currentTheme = 'forest';
        this.isSlippery = false;
        this.isUnderwater = false;
        this.isLowGravity = false;
        
        this.enemies = [];
        this.powerups = [];
        
        // Start platform
        this.createPlatform(0, 0, 0, 4, 1, 4, 0x5a7d5a);
        this.startPoint = { x: 0, y: 1, z: 0 };
        
        // Theme-specific generation
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
        
        // Collectibles
        this.addCollectibles(length);
        
        // Goal
        this.createGoal(levelNum * 20, 0, 0);
    }
    
    generateLevel1(length) {
        // Simple stepping stones
        for (let i = 5; i < length; i += 5) {
            const height = Math.random() * 2 - 1;
            this.createPlatform(i, height, 0, 2, 0.5, 2, 0x7a9d7a);
            
            // Add coins above platforms
            this.createCollectible(i, height + 2, 0);
        }
        
        // Some hazards (spikes)
        for (let i = 8; i < length; i += 12) {
            this.createHazard(i, 0, Math.random() > 0.5 ? 1.5 : -1.5);
        }
    }
    
    generateLevel2(length) {
        // Platforms with gaps
        let x = 4;
        while (x < length) {
            const platformWidth = 2 + Math.random() * 2;
            const gap = 2 + Math.random() * 2;
            const height = (Math.random() - 0.5) * 3;
            const z = (Math.random() - 0.5) * 2;
            
            this.createPlatform(x, height, z, platformWidth, 0.5, 2, 0x8a9d7a);
            
            // Moving platforms (animated)
            if (Math.random() > 0.7) {
                this.createMovingPlatform(x + gap, height, z, 2, 0.5, 2);
            }
            
            x += platformWidth + gap;
            
            if (Math.random() > 0.5) {
                this.createCollectible(x - gap/2, height + 2.5, z);
            }
        }
    }
    
    generateLevel3(length) {
        // Complex layout
        for (let x = 5; x < length; x += 4) {
            const height = Math.sin(x * 0.5) * 2 + 1;
            const width = 2 + Math.random() * 3;
            
            this.createPlatform(x, height, 0, width, 0.5, 2, 0x9aad7a);
            
            // Vertical challenges
            if (Math.random() > 0.6) {
                this.createPlatform(x, height + 3, 0, 1, 0.5, 1, 0xaadd7a);
                this.createCollectible(x, height + 5, 0);
            }
            
            // More hazards
            if (x > 10 && Math.random() > 0.5) {
                this.createHazard(x - 1, height - 1, 0);
            }
        }
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
        // Goal house/tree/pole
        const geometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const pole = new THREE.Mesh(geometry, material);
        pole.position.set(x, y + 2, z);
        pole.castShadow = true;
        this.scene.add(pole);
        
        // Goal flag
        const flagGeo = new THREE.BoxGeometry(1.5, 1, 0.1);
        const flagMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(x + 0.75, y + 3, z);
        this.scene.add(flag);
        
        this.endPoint = { x, y: y + 1, z };
        
        // Add particle system for celebration
        this.createGoalParticles(x, y + 4, z);
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
    
    addForestDecorations(minX, maxX) {
        // Ground grass
        for (let x = minX; x < maxX; x += 1) {
            for (let z = -5; z <= 5; z += 1) {
                if (Math.random() > 0.7) {
                    const grass = this.createGrass(x, -0.4, z + (Math.random() - 0.5) * 3);
                    this.decorations.push({ type: 'grass', mesh: grass });
                }
            }
        }
        
        // Trees
        const treeCount = Math.floor((maxX - minX) / 5);
        for (let i = 0; i < treeCount; i++) {
            const tx = minX + i * 5 + Math.random() * 3;
            const tz = Math.random() > 0.5 ? 5 + Math.random() * 5 : -5 - Math.random() * 5;
            this.createTree(tx, -1, tz);
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
        // Additional coins scattered around - only on right side (positive x)
        for (let i = 0; i < 20; i++) {
            // Spawn coins only to the right of start position (x >= 2 to clear start platform)
            const x = 2 + Math.random() * (levelLength - 2);
            const z = (Math.random() - 0.5) * 4;
            const y = 1 + Math.random() * 3;
            
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
    generateLevel4(length) {
        // Cave theme
        this.currentTheme = 'cave';
        for (let x = 4; x < length; x += 3) {
            const height = Math.random() * 1.5;
            const z = (Math.random() - 0.5) * 1.5;
            this.createPlatform(x, height, z, 2.5, 0.5, 2, 0x4a4a5a);
            
            // Stalactites
            if (Math.random() > 0.7) {
                this.createDecoration(x, height + 5, z, 'stalactite');
            }
            
            // Bats
            if (x > 15 && Math.random() > 0.7) {
                this.createEnemy(x, height + 2, z, 'bat');
            }
            
            if (Math.random() > 0.6) {
                this.createCollectible(x, height + 2, z);
            }
        }
    }

    generateLevel5(length) {
        // Mountain theme
        this.currentTheme = 'mountain';
        let y = 0;
        for (let x = 4; x < length; x += 4) {
            y += Math.random() * 2;
            const z = (Math.random() - 0.5) * 3;
            this.createPlatform(x, y, z, 3, 0.5, 2.5, 0x8a8a7a);
            
            // Eagles
            if (x > 15 && Math.random() > 0.8) {
                this.createEnemy(x, y + 5, z, 'eagle');
            }
            
            this.createCollectible(x, y + 3, z);
        }
    }

    generateLevel6(length) {
        // Snow theme
        this.currentTheme = 'snow';
        this.isSlippery = true;
        for (let x = 4; x < length; x += 5) {
            const height = Math.sin(x * 0.3) * 1.5;
            const z = Math.sin(x * 0.5) * 2;
            this.createPlatform(x, height, z, 3, 0.5, 3, 0xeefefe);
            
            if (Math.random() > 0.6) {
                this.createCollectible(x, height + 2.5, z);
            }
        }
    }

    generateLevel7(length) {
        // Ruins theme
        this.currentTheme = 'ruins';
        for (let x = 4; x < length; x += 4) {
            const height = Math.random() > 0.5 ? 0 : 2;
            const z = (Math.random() - 0.5) * 2;
            this.createPlatform(x, height, z, 2.5, 0.5, 2, 0x9a8a6a);
            
            if (Math.random() > 0.5) {
                this.createCollectible(x, height + 3, z);
            }
        }
    }

    generateLevel8(length) {
        // Sky theme
        this.currentTheme = 'sky';
        for (let x = 5; x < length; x += 6) {
            const height = 3 + Math.random() * 4;
            const z = (Math.random() - 0.5) * 4;
            this.createPlatform(x, height, z, 3, 1, 3, 0x7addaa);
            this.createCollectible(x, height + 3, z);
        }
    }

    generateLevel9(length) {
        // Lava theme
        this.currentTheme = 'lava';
        for (let x = 4; x < length; x += 4) {
            const height = Math.random() * 3;
            const z = (Math.random() - 0.5) * 2;
            this.createPlatform(x, height, z, 2.5, 0.5, 2, 0x4a3a3a);
            
            if (Math.random() > 0.7) {
                this.createHazard(x, height + 1, z);
            }
            
            this.createCollectible(x, height + 3, z);
        }
    }

    generateLevel10(length) {
        // Underwater theme
        this.currentTheme = 'underwater';
        this.isUnderwater = true;
        for (let x = 4; x < length; x += 4) {
            const height = Math.sin(x * 0.4) * 2;
            const z = (Math.random() - 0.5) * 3;
            this.createPlatform(x, height, z, 3, 0.5, 2.5, 0x5a7a9a);
            
            // Fish enemies
            if (x > 10 && Math.random() > 0.6) {
                this.createEnemy(x, height + 2, z, 'fish');
            }
            
            this.createCollectible(x, height + 2.5, z);
        }
    }

    generateLevel11(length) {
        // Volcano theme
        this.currentTheme = 'volcano';
        for (let x = 4; x < length; x += 3) {
            const height = Math.random() * 2;
            const z = (Math.random() - 0.5) * 2;
            this.createPlatform(x, height, z, 2, 0.5, 2, 0x5a4a4a);
            this.createCollectible(x, height + 3, z);
        }
    }

    generateLevel12(length) {
        // Castle theme with foxes
        this.currentTheme = 'castle';
        for (let x = 5; x < length; x += 5) {
            const height = Math.random() > 0.5 ? 0 : 1.5;
            const z = (Math.random() - 0.5) * 2;
            this.createPlatform(x, height, z, 3, 0.5, 2.5, 0x7a7a8a);
            
            // Fox guards
            if (x > 10 && Math.random() > 0.75) {
                this.createEnemy(x, height + 1, z, 'fox');
            }
            
            this.createCollectible(x, height + 2.5, z);
        }
    }

    generateLevel13(length) {
        // Space theme
        this.currentTheme = 'space';
        this.isLowGravity = true;
        for (let x = 5; x < length; x += 6) {
            const height = 2 + Math.random() * 3;
            const z = (Math.random() - 0.5) * 4;
            this.createPlatform(x, height, z, 2.5, 0.5, 2.5, 0x3a3a5a);
            this.createCollectible(x, height + 3.5, z);
        }
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
    
    createCollectible(x, y, z) {
        const collectible = new Collectible(x, y, z, this.scene);
        this.collectibles.push(collectible);
        return collectible;
    }
    
    createDecoration(x, y, z, type) {
        // Basic decoration shapes
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
