/**
 * Input handler - Fortnite-style controls
 * - Pointer Lock for free mouse look (click canvas to lock, ESC to unlock)
 * - Camera yaw/pitch tracked inside input handler
 * - WASD for camera-relative movement
 * - Space for jump (ArrowUp no longer jumps)
 * - Shift for sprint
 */
export class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        
        // Pointer lock state
        this.isPointerLocked = false;
        
        // Camera angles (driven by mouse movement when locked)
        this.cameraYaw = 0;
        this.cameraPitch = 0.3;
        this.scrollDelta = 0;
        
        // Sensitivity
        this.mouseSensitivity = 0.002;
        
        // Camera limits
        this.minPitch = -0.5;
        this.maxPitch = 1.2;
        this.minDistance = 5;
        this.maxDistance = 20;
        this.cameraDistance = 10;
        
        // Bind all handlers
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onPointerLockChange = this.onPointerLockChange.bind(this);
        this.onCanvasClick = this.onCanvasClick.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        
        // Keyboard
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        
        // Mouse
        document.addEventListener('mousemove', this.onMouseMove);
        this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
        this.canvas.addEventListener('contextmenu', this.onContextMenu);
        this.canvas.addEventListener('click', this.onCanvasClick);
        
        // Pointer lock
        document.addEventListener('pointerlockchange', this.onPointerLockChange);
    }
    
    onCanvasClick(e) {
        if (!this.isPointerLocked) {
            this.canvas.requestPointerLock();
        }
    }
    
    onPointerLockChange() {
        this.isPointerLocked = document.pointerLockElement === this.canvas;
    }
    
    onMouseMove(e) {
        if (this.isPointerLocked) {
            this.cameraYaw -= e.movementX * this.mouseSensitivity;
            this.cameraPitch += e.movementY * this.mouseSensitivity;
            this.cameraPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.cameraPitch));
        }
    }
    
    onWheel(e) {
        e.preventDefault();
        this.scrollDelta += e.deltaY;
        this.cameraDistance += e.deltaY * 0.01;
        this.cameraDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.cameraDistance));
    }
    
    onContextMenu(e) {
        e.preventDefault();
    }
    
    onKeyDown(e) {
        this.keys[e.code] = true;
        
        // Prevent scroll with space/arrows
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
    }
    
    onKeyUp(e) {
        this.keys[e.code] = false;
    }
    
    // Movement input methods (WASD only, camera-relative)
    isForward() {
        return this.keys['KeyW'] || this.keys['ArrowUp'];
    }
    
    isBackward() {
        return this.keys['KeyS'] || this.keys['ArrowDown'];
    }
    
    isLeft() {
        return this.keys['KeyA'] || this.keys['ArrowLeft'];
    }
    
    isRight() {
        return this.keys['KeyD'] || this.keys['ArrowRight'];
    }
    
    isJump() {
        return this.keys['Space'];
    }
    
    isSprint() {
        return this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    }
    
    isAnyMovement() {
        return this.isForward() || this.isBackward() || this.isLeft() || this.isRight();
    }
    
    /**
     * Returns movement direction in world space based on camera yaw.
     * Fortnite-style: W = toward where camera looks, A/D = strafe left/right
     */
    getMovementVector() {
        let forward = 0;
        let right = 0;
        
        if (this.isForward()) forward += 1;
        if (this.isBackward()) forward -= 1;
        if (this.isRight()) right += 1;
        if (this.isLeft()) right -= 1;
        
        // Normalize diagonal movement
        if (forward !== 0 && right !== 0) {
            const len = Math.sqrt(forward * forward + right * right);
            forward /= len;
            right /= len;
        }
        
        // Transform to world space using camera yaw
        // Camera position: (player - dist*sinYaw, y, player - dist*cosYaw)
        // Camera looks TOWARD player, so camera forward = (sinYaw, 0, cosYaw)
        // Three.js screen-right = cross(worldUp, -forward) normalized in XZ
        //   = (-forwardZ, 0, forwardX) = (-cosYaw, 0, sinYaw)
        const cos = Math.cos(this.cameraYaw);
        const sin = Math.sin(this.cameraYaw);
        
        // Forward = (sinYaw, 0, cosYaw) — toward where camera looks
        // Screen Right = (-cosYaw, 0, sinYaw) — right on the rendered view
        const worldX = forward * sin + right * (-cos);
        const worldZ = forward * cos + right * sin;
        
        return { x: worldX, z: worldZ };
    }
    
    dispose() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
        
        if (this.canvas) {
            this.canvas.removeEventListener('wheel', this.onWheel);
            this.canvas.removeEventListener('contextmenu', this.onContextMenu);
            this.canvas.removeEventListener('click', this.onCanvasClick);
        }
        
        // Release pointer lock if held
        if (this.isPointerLocked) {
            document.exitPointerLock();
        }
    }
}