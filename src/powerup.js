/**
 * Power-up system
 */
import * as THREE from '../lib/three.module.js';

export class PowerUp {
    constructor(type, x, y, z, scene) {
        this.type = type; // 'doubleJump', 'speedBoost', 'invincible'
        this.scene = scene;
        this.position = { x, y, z };
        this.active = true;
        this.rotation = 0;
        this.bobOffset = 0;
        
        this.createMesh();
    }
    
    createMesh() {
        let geometry, material, color;
        
        switch(this.type) {
            case 'doubleJump':
                color = 0x3498db; // Blue
                geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                break;
            case 'speedBoost':
                color = 0xe74c3c; // Red
                geometry = new THREE.ConeGeometry(0.2, 0.4, 6);
                break;
            case 'invincible':
                color = 0xf1c40f; // Gold
                geometry = new THREE.SphereGeometry(0.25, 8, 8);
                break;
            case 'coinMagnet':
                color = 0x9b59b6; // Purple
                geometry = new THREE.TorusGeometry(0.2, 0.08, 8, 16);
                break;
            default:
                color = 0xffffff;
                geometry = new THREE.SphereGeometry(0.2);
        }
        
        material = new THREE.MeshLambertMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        
        // Add glow effect
        const glowGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ 
            color: color, 
            transparent: true, 
            opacity: 0.3 
        });
        this.glow = new THREE.Mesh(glowGeo, glowMat);
        this.mesh.add(this.glow);
    }
    
    update(dt) {
        if (!this.active) return;
        
        this.rotation += dt * 2;
        this.bobOffset += dt * 3;
        
        if (this.mesh) {
            this.mesh.rotation.y = this.rotation;
            this.mesh.position.y = this.position.y + Math.sin(this.bobOffset) * 0.1;
        }
        
        if (this.glow) {
            this.glow.rotation.y = -this.rotation * 0.5;
            this.glow.material.opacity = 0.2 + Math.sin(this.bobOffset * 2) * 0.1;
        }
    }
    
    collect() {
        this.active = false;
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        return this.getEffect();
    }
    
    getEffect() {
        switch(this.type) {
            case 'doubleJump':
                return { type: 'doubleJump', duration: 15, message: 'Double Jump!' };
            case 'speedBoost':
                return { type: 'speedBoost', duration: 10, multiplier: 1.5, message: 'Speed Boost!' };
            case 'invincible':
                return { type: 'invincible', duration: 8, message: 'Invincible!' };
            case 'coinMagnet':
                return { type: 'coinMagnet', duration: 12, range: 5, message: 'Coin Magnet!' };
            default:
                return null;
        }
    }
    
    checkCollision(playerPos) {
        if (!this.active) return false;
        const dx = playerPos.x - this.position.x;
        const dy = playerPos.y - this.position.y;
        const dz = playerPos.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return distance < 0.8;
    }
}

export class ActivePowerUp {
    constructor(effect) {
        this.type = effect.type;
        this.duration = effect.duration;
        this.timeRemaining = effect.duration;
        this.data = effect;
        
        // Apply immediate effects
        this.active = true;
    }
    
    update(dt) {
        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
            this.active = false;
            return false; // Expired
        }
        return true; // Still active
    }
    
    getRemainingPercent() {
        return this.timeRemaining / this.duration;
    }
}
