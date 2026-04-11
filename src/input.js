/**
 * Input handler - keyboard and mouse for 3D
 * Mirrors the 2D version but adds camera controls
 */
export class InputHandler {
    constructor(canvas) {
        this.keys = {};
        this.canvas = canvas;
        
        // Bind event handlers
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        
        // Add listeners
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }
    
    onKeyDown(e) {
        this.keys[e.code] = true;
        
        // Prevent scroll with space/arrows
        if ([
            'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
        ].includes(e.code)) {
            e.preventDefault();
        }
    }
    
    onKeyUp(e) {
        this.keys[e.code] = false;
    }
    
    isLeft() {
        return this.keys['KeyA'] || this.keys['ArrowLeft'];
    }
    
    isRight() {
        return this.keys['KeyD'] || this.keys['ArrowRight'];
    }
    
    isUp() {
        return this.keys['KeyW'] || this.keys['ArrowUp'];
    }
    
    isDown() {
        return this.keys['KeyS'] || this.keys['ArrowDown'];
    }
    
    isJump() {
        return this.keys['Space'] || this.keys['ArrowUp'];
    }
    
    isShift() {
        return this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    }
    
    isAnyMovement() {
        return this.isLeft() || this.isRight() || this.isUp() || this.isDown();
    }
    
    dispose() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }
}