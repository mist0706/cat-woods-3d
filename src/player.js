/**
 * Player (Cat) class - 3D version
 * Mirrors the 2D player API but with 3D physics
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
            fixedRotation: true // Prevent tipping over
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
        
        // Movement constants (same logic as 2D)
        this.moveSpeed = 8;
        this.runSpeed = 14;
        this.jumpForce = 12;
        this.isJumping = false;
        this.isOnGround = false;
        this.facingRight = true;
        
        // Animation
        this.animationTime = 0;
        
        // Raycaster for ground detection
        this.raycaster = new THREE.Raycaster();
    }
    
    reset(x, y, z) {
        this.body.position.set(x, y, z);
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        this.isJumping = false;
    }
    
    update(input, dt) {
        // Check ground contact
        this.checkGroundContact();
        
        // Handle movement (X and Z axis for 3D)
        const isRunning = input.isShift();
        const speed = isRunning ? this.runSpeed : this.moveSpeed;
        
        let moveX = 0;
        let moveZ = 0;
        
        if (input.isLeft()) {
            moveX = -speed;
            this.facingRight = false;
        }
        if (input.isRight()) {
            moveX = speed;
            this.facingRight = true;
        }
        if (input.isUp()) {
            moveZ = -speed; // Forward
        }
        if (input.isDown()) {
            moveZ = speed; // Backward
        }
        
        // Apply movement velocity
        const currentVel = this.body.velocity;
        this.body.velocity.set(moveX, currentVel.y, moveZ);
        
        // Jump
        if (input.isJump() && this.isOnGround && !this.isJumping) {
            this.body.velocity.y = this.jumpForce;
            this.isJumping = true;
            this.isOnGround = false;
        }
        
        // Update mesh position/rotation from physics
        this.mesh.position.copy(this.body.position);
        
        // Rotate based on facing direction
        if (this.facingRight) {
            this.mesh.rotation.y = 0;
        } else {
            this.mesh.rotation.y = Math.PI;
        }
        
        // Update animation
        this.animate(dt, moveX !== 0 || moveZ !== 0);
    }
    
    checkGroundContact() {
        // Simple raycast down to check ground
        const rayFrom = this.body.position;
        const rayTo = new CANNON.Vec3(
            rayFrom.x,
            rayFrom.y - 0.8,
            rayFrom.z
        );
        
        const ray = new CANNON.Ray(rayFrom, rayTo);
        ray.from.copy(rayFrom);
        ray.to.copy(rayTo);
        
        // Check for ground contact
        // In a full implementation, we'd use a convex cast or sensor
        // For now, we track based on vertical velocity
        if (this.body.velocity.y === 0 || Math.abs(this.body.velocity.y) < 0.1) {
            // Check position relative to platform heights
            // Simplified: assume ground contact below certain Y
            if (this.body.position.y > -1) {
                this.isOnGround = true;
                this.isJumping = false;
            }
        }
    }
    
    animate(dt, isMoving) {
        this.animationTime += dt;
        
        if (isMoving && this.isOnGround) {
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
            this.tail.rotation.x = -Math.PI / 3; // Tail up
            this.leftEar.rotation.z = -0.2;
            this.rightEar.rotation.z = 0.2;
        } else {
            this.tail.rotation.x = Math.PI / 4;
            this.leftEar.rotation.z = 0;
            this.rightEar.rotation.z = 0;
        }
    }
    
    takeDamage() {
        // Visual feedback - flash red
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