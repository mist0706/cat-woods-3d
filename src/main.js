/**
 * Main entry point - same structure as 2D version
 */
import { Game } from './game.js';

// Wait for DOM and Three.js to load
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    
    // Set canvas to full window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Initialize game
    const game = new Game(canvas);
    
    // Expose for debugging/testing
    window.game = game;
    
    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        game.onResize();
    });
    
    // Prevent context menu on right click (for camera controls)
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
});