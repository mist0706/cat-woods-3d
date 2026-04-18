/**
 * Player (Cat) class - 3D version with Fortnite-style movement
 * - Camera-relative movement (WASD moves relative to where you look)
 * - Smooth character rotation toward movement direction
 * - Separate jump from ArrowUp
 */
import * as THREE from '../vendor/three.module.js';
import * as CANNON from '../vendor/cannon-es.js';

export class Player {
    constructor(x, y, z, scene, world) {
        this.scene = scene;
        this.world = world;
        
        // Physics body (capsule-like using sphere for simplicity)
        const shape = new CANNON.Sphere(0.5);
        this.body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(x, y, z),
            shape: shape,
            linearDamping: 0.1,
            angularDamping: 0.5,
            fixedRotation: true
        });
        this.body.material = new CANNON.Material({ friction: 0.3 });
        this.world.addBody(this.body);
        
        // Visual mesh (orange box for cat)
        const geometry = new THREE.BoxGeometry(1, 1, 0.8);
        const material = new THREE.MeshLambertMaterial({ color: 0xff8c00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        
        // Ears
        const earGeo = new THREE.BoxGeometry(0.3, 0.3, 0.2);
        const earMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        
        this.leftEar = new THREE.Mesh(earGeo, earMat);
        this.leftEar.position.set(-0.3, 0.65, 0);
        this.mesh.add(this.leftEar);
        
        this.rightEar = new THREE.Mesh(earGeo, earMat);
        this.rightEar.position.set(0.3, 0.65, 0);
        this.mesh.add(this.rightEar);
        
        // Tail
        const tailGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
        this.tail = new THREE.Mesh(tailGeo, earMat);
        this.tail.position.set(0, 0.2, -0.6);
        this.tail.rotation.x = Math.PI / 4;
        this.mesh.add(this.tail);
        
        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        this.leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        this.leftEye.position.set(-0.2, 0.2, 0.4);
        this.mesh.add(this.leftEye);
        
        this.rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        this.rightEye.position.set(0.2, 0.2, 0.4);
        this.mesh.add(this.rightEye);
        
        // Movement constants
        this.walkSpeed = 8;
        this.runSpeed = 14;
        this.jumpForce = 12;
        this.isJumping = false;
        this.isOnGround = false;
        
        // Smooth rotation target
        this.targetRotation = 0;
        this.rotationSpeed = 0.15; // How fast cat turns to face movement
        
        // Track if moving this frame (for animation)
        this.isMoving = false;
        
        // Animation
        this.animationTime = 0;
    }
    
    reset(x, y, z) {
        this.body.position.set(x, y, z);
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        this.isJumping = false;
        this.isOnGround = false;
        
        // Remove from old parent if any, re-add to scene
        if (this.mesh.parent && this.mesh.parent !== this.scene) {
            this.mesh.parent.remove(this.mesh);
        }
        if (!this.mesh.parent) {
            this.scene.add(this.mesh);
        }
        this.mesh.visible = true;
    }
    
    update(input, dt) {
        this.checkGroundContact();
        
        // Get camera-relative movement vector from input
        const moveDir = input.getMovementVector();
        
        const isSprinting = input.isSprint();
        const speed = isSprinting ? this.runSpeed : this.walkSpeed;
        
        // Apply camera-relative movement velocity
        const moveX = moveDir.x * speed;
        const moveZ = moveDir.z * speed;
        
        this.isMoving = (moveX !== 0 || moveZ !== 0);
        
        const currentVel = this.body.velocity;
        this.body.velocity.set(moveX, currentVel.y, moveZ);
        
        // Jump (Space only, not ArrowUp)
        if (input.isJump() && this.isOnGround && !this.isJumping) {
            this.body.velocity.y = this.jumpForce;
            this.isJumping = true;
            this.isOnGround = false;
        }
        
        // Smooth rotation toward movement direction
        if (this.isMoving) {
            this.targetRotation = Math.atan2(moveX, moveZ);
            
            // Smoothly interpolate current rotation toward target
            let diff = this.targetRotation - this.mesh.rotation.y;
            // Normalize angle difference to [-PI, PI]
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.mesh.rotation.y += diff * this.rotationSpeed;
        }
        
        // Update mesh position from physics
        this.mesh.position.copy(this.body.position);
        
        // Animation
        this.animate(dt);
    }
    
    checkGroundContact() {
        // Track ground contact based on vertical velocity
        if (this.body.velocity.y === 0 || Math.abs(this.body.velocity.y) < 0.1) {
            if (this.body.position.y > -1) {
                this.isOnGround = true;
                this.isJumping = false;
            }
        }
    }
    
    animate(dt) {
        this.animationTime += dt;
        
        if (this.isMoving && this.isOnGround) {
            // Running animation - bounce slightly
            this.mesh.position.y += Math.sin(this.animationTime * 15) * 0.05;
            
            // Animate tail
            this.tail.rotation.z = Math.sin(this.animationTime * 10) * 0.3;
        } else {
            // Idle - subtle breathing
            const breath = Math.sin(this.animationTime * 2) * 0.02;
            this.mesh.scale.set(1 + breath, 1 + breath, 1 + breath);
        }
        
        // Jump pose
        if (!this.isOnGround) {
            this.tail.rotation.x = -Math.PI / 3;
            this.leftEar.rotation.z = -0.2;
            this.rightEar.rotation.z = 0.2;
        } else {
            this.tail.rotation.x = Math.PI / 4;
            this.leftEar.rotation.z = 0;
            this.rightEar.rotation.z = 0;
        }
    }
    
    takeDamage() {
        this.mesh.material.color.setHex(0xff0000);
        setTimeout(() => {
            this.mesh.material.color.setHex(0xff8c00);
        }, 200);
        return true;
    }
    
    dispose() {
        this.scene.remove(this.mesh);
        this.world.removeBody(this.body);
    }
    
    getBounds() {
        return {
            x: this.body.position.x - 0.5,
            y: this.body.position.y - 0.5,
            z: this.body.position.z - 0.4,
            width: 1,
            height: 1,
            depth: 0.8
        };
    }
}