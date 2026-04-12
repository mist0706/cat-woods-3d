/**
 * Input handler - keyboard and mouse for 3D
 * Mirrors the 2D version but adds camera controls
 */
export class InputHandler {
    constructor(canvas) {
        this.keys = {};
        this.canvas = canvas;
        
        // Mouse camera controls
        this.mouseX = 0;
        this.mouseY = 0;
        this.isRightMouseDown = false;
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.scrollDelta = 0;
        
        // Bind event handlers
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        
        // Add listeners
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        canvas.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        canvas.addEventListener('mousemove', this.onMouseMove);
        canvas.addEventListener('wheel', this.onWheel, { passive: false });
        canvas.addEventListener('contextmenu', this.onContextMenu);
    }
    
    onMouseDown(e) {
        if (e.button === 2) { // Right click
            this.isRightMouseDown = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }
    }
    
    onMouseUp(e) {
        if (e.button === 2) {
            this.isRightMouseDown = false;
        }
    }
    
    onMouseMove(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        
        if (this.isRightMouseDown) {
            this.mouseDeltaX += e.movementX;
            this.mouseDeltaY += e.movementY;
        }
    }
    
    onWheel(e) {
        e.preventDefault();
        this.scrollDelta += e.deltaY;
    }
    
    onContextMenu(e) {
        e.preventDefault(); // Prevent right-click menu
    }
    
    // Consume deltas (call once per frame)
    consumeCameraDeltas() {
        const deltas = {
            yaw: this.mouseDeltaX * 0.005,
            pitch: this.mouseDeltaY * 0.005,
            zoom: this.scrollDelta * 0.001
        };
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.scrollDelta = 0;
        return deltas;
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