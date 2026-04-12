/**
 * Level generator - 3D version
 * Creates platforms, obstacles, collectibles, and atmosphere
 */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

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
        const length = 30 + (levelNum * 10);
        
        // Ground platform
        this.createPlatform(0, -1, 0, length * 2, 1, 6, 0x2d4a3e);
        
        // Start platform
        this.createPlatform(0, 0, 0, 4, 1, 4, 0x5a7d5a);
        this.startPoint = { x: 0, y: 1, z: 0 };
        
        // Add some trees around
        this.addForestDecorations(-length, length);
        
        if (levelNum === 1) {
            this.generateLevel1(length);
        } else if (levelNum === 2) {
            this.generateLevel2(length);
        } else {
            this.generateLevel3(length);
        }
        
        // Collectibles
        this.addCollectibles();
        
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
    
    addCollectibles() {
        // Additional coins scattered around
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 60;
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
            this.world.removeBody(h.mesh);
        });
        this.hazards = [];
        
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