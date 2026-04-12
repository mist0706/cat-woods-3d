/**
 * Enemy AI system - Foxes, Owls, and other hazards
 */
import * as THREE from '../vendor/three.module.js';
import * as CANNON from '../vendor/cannon-es.js';

export class Enemy {
    constructor(type, x, y, z, scene, world) {
        this.type = type;
        this.scene = scene;
        this.world = world;
        this.active = true;
        
        // Position
        this.startPos = { x, y, z };
        this.position = { x, y, z };
        
        // AI state
        this.state = 'patrol';
        this.patrolDistance = 5;
        this.patrolSpeed = 2;
        this.chaseSpeed = 6;
        this.detectionRange = 8;
        
        // Animation
        this.animTime = 0;
        this.direction = 1;
        
        this.createMesh();
        this.createPhysics();
    }
    
    createMesh() {
        switch(this.type) {
            case 'fox':
                this.createFoxMesh();
                break;
            case 'owl':
                this.createOwlMesh();
                break;
            case 'bat':
                this.createBatMesh();
                break;
            case 'eagle':
                this.createEagleMesh();
                break;
            case 'fish':
                this.createFishMesh();
                break;
            case 'asteroid':
                this.createAsteroidMesh();
                break;
            default:
                this.createGenericMesh();
        }
    }
    
    createFoxMesh() {
        // Red fox body
        const bodyGeo = new THREE.BoxGeometry(0.8, 0.5, 1.2);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0xd35400 });
        this.mesh = new THREE.Mesh(bodyGeo, bodyMat);
        
        // Head
        const headGeo = new THREE.BoxGeometry(0.5, 0.4, 0.5);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.set(0, 0.3, 0.6);
        this.mesh.add(head);
        
        // Ears
        const earGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
        const ear1 = new THREE.Mesh(earGeo, new THREE.MeshLambertMaterial({ color: 0x333333 }));
        ear1.position.set(-0.15, 0.6, 0.6);
        this.mesh.add(ear1);
        const ear2 = new THREE.Mesh(earGeo, new THREE.MeshLambertMaterial({ color: 0x333333 }));
        ear2.position.set(0.15, 0.6, 0.6);
        this.mesh.add(ear2);
        
        // Tail
        const tailGeo = new THREE.CylinderGeometry(0.1, 0.2, 0.6);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.rotation.x = Math.PI / 3;
        tail.position.set(0, 0.2, -0.7);
        this.mesh.add(tail);
        
        this.mesh.castShadow = true;
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);
    }
    
    createOwlMesh() {
        // Owl body
        const bodyGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x8e44ad });
        this.mesh = new THREE.Mesh(bodyGeo, bodyMat);
        
        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.15, 6, 6);
        const eyeMat = new THREE.MeshLambertMaterial({ color: 0xffeb3b });
        const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
        eye1.position.set(-0.15, 0.1, 0.25);
        this.mesh.add(eye1);
        const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
        eye2.position.set(0.15, 0.1, 0.25);
        this.mesh.add(eye2);
        
        // Wings
        const wingGeo = new THREE.BoxGeometry(0.6, 0.1, 0.4);
        const wingMat = new THREE.MeshLambertMaterial({ color: 0x6a348a });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.set(0, 0, 0);
        this.mesh.add(wings);
        
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);
    }
    
    createBatMesh() {
        // Bat body
        const bodyGeo = new THREE.SphereGeometry(0.15, 6, 6);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        this.mesh = new THREE.Mesh(bodyGeo, bodyMat);
        
        // Wings
        const wingGeo = new THREE.BoxGeometry(0.8, 0.05, 0.3);
        const wings = new THREE.Mesh(wingGeo, bodyMat);
        wings.position.set(0, 0, 0);
        this.mesh.add(wings);
        
        // Ears
        const earGeo = new THREE.ConeGeometry(0.05, 0.15, 4);
        const ear1 = new THREE.Mesh(earGeo, bodyMat);
        ear1.position.set(-0.08, 0.15, 0);
        this.mesh.add(ear1);
        const ear2 = new THREE.Mesh(earGeo, bodyMat);
        ear2.position.set(0.08, 0.15, 0);
        this.mesh.add(ear2);
        
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);
    }
    
    createEagleMesh() {
        // Eagle body
        const bodyGeo = new THREE.BoxGeometry(0.5, 0.3, 0.8);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(bodyGeo, bodyMat);
        
        // Head (brown)
        const headGeo = new THREE.BoxGeometry(0.3, 0.25, 0.3);
        const headMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 0.2, 0.4);
        this.mesh.add(head);
        
        // Beak
        const beakGeo = new THREE.ConeGeometry(0.08, 0.2, 4);
        const beakMat = new THREE.MeshLambertMaterial({ color: 0xffa500 });
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.2, 0.65);
        this.mesh.add(beak);
        
        // Wings
        const wingGeo = new THREE.BoxGeometry(1.2, 0.05, 0.4);
        const wings = new THREE.Mesh(wingGeo, bodyMat);
        wings.position.set(0, 0, 0);
        this.mesh.add(wings);
        
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);
    }
    
    createFishMesh() {
        // Fish body
        const bodyGeo = new THREE.ConeGeometry(0.2, 0.6, 6);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
        this.mesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.mesh.rotation.z = -Math.PI / 2;
        
        // Tail
        const tailGeo = new THREE.ConeGeometry(0.15, 0.3, 3);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.position.set(-0.4, 0, 0);
        tail.rotation.z = Math.PI / 2;
        this.mesh.add(tail);
        
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);
    }
    
    createAsteroidMesh() {
        // Asteroid (irregular rock)
        const geometry = new THREE.DodecahedronGeometry(0.4);
        const material = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.scale.set(1 + Math.random() * 0.5, 1 + Math.random() * 0.5, 1 + Math.random() * 0.5);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);
    }
    
    createGenericMesh() {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);
    }
    
    createPhysics() {
        const shape = new CANNON.Sphere(0.3);
        this.body = new CANNON.Body({
            mass: 0, // Static enemies (don't fall)
            position: new CANNON.Vec3(this.position.x, this.position.y, this.position.z),
            shape: shape
        });
        this.body.isTrigger = true; // Don't collide physically
        this.world.addBody(this.body);
    }
    
    update(playerPosition, dt) {
        if (!this.active) return;
        
        this.animTime += dt;
        
        // Calculate distance to player
        const dx = playerPosition.x - this.position.x;
        const dy = playerPosition.y - this.position.y;
        const dz = playerPosition.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // AI state machine
        switch(this.state) {
            case 'patrol':
                this.patrolBehavior(dt);
                if (distance < this.detectionRange) {
                    this.state = 'chase';
                }
                break;
            case 'chase':
                this.chaseBehavior(playerPosition, dt);
                if (distance > this.detectionRange * 1.5) {
                    this.state = 'patrol';
                }
                break;
            case 'attack':
                this.attackBehavior(playerPosition, dt);
                break;
        }
        
        this.animate(dt);
        this.updateMesh();
    }
    
    patrolBehavior(dt) {
        // Move back and forth
        const moveAmount = this.patrolSpeed * dt * this.direction;
        this.position.x += moveAmount;
        
        // Check patrol bounds
        if (this.position.x > this.startPos.x + this.patrolDistance) {
            this.direction = -1;
            this.position.x = this.startPos.x + this.patrolDistance;
        } else if (this.position.x < this.startPos.x - this.patrolDistance) {
            this.direction = 1;
            this.position.x = this.startPos.x - this.patrolDistance;
        }
    }
    
    chaseBehavior(playerPos, dt) {
        // Move towards player
        const dx = playerPos.x - this.position.x;
        const dz = playerPos.z - this.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist > 0.1) {
            this.position.x += (dx / dist) * this.chaseSpeed * dt;
            this.position.z += (dz / dist) * this.chaseSpeed * dt;
        }
        
        // Vertical movement for flying enemies
        if (this.type === 'bat' || this.type === 'owl' || this.type === 'eagle') {
            const dy = playerPos.y - this.position.y;
            this.position.y += dy * dt * 2;
        }
    }
    
    attackBehavior(playerPos, dt) {
        // Attack logic - can be extended
        this.state = 'chase';
    }
    
    animate(dt) {
        // Idle animation
        if (this.mesh) {
            if (this.type === 'bat' || this.type === 'owl' || this.type === 'eagle') {
                // Flying motion
                this.mesh.position.y += Math.sin(this.animTime * 3) * 0.1;
                // Wing flap
                this.mesh.rotation.z = Math.sin(this.animTime * 10) * 0.1;
            } else if (this.type === 'fish') {
                // Swimming motion
                this.mesh.position.y += Math.sin(this.animTime * 2) * 0.05;
            }
        }
    }
    
    updateMesh() {
        if (this.mesh) {
            this.mesh.position.x = this.position.x;
            this.mesh.position.z = this.position.z;
        }
        if (this.body) {
            this.body.position.x = this.position.x;
            this.body.position.z = this.position.z;
            this.body.position.y = this.position.y;
        }
    }
    
    checkCollision(playerPos) {
        if (!this.active) return false;
        const dx = playerPos.x - this.position.x;
        const dy = playerPos.y - this.position.y;
        const dz = playerPos.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return distance < 0.8; // Hit radius
    }
    
    dispose() {
        this.active = false;
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        if (this.body) {
            this.world.removeBody(this.body);
        }
    }
}
