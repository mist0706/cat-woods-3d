/**
 * Main entry point - same structure as 2D version
 */
import { Game } from './game.js';

// Hide loading spinner safely
function hideLoadingSpinner() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
}

// Show error message if game fails to load
function showErrorMessage(message) {
    hideLoadingSpinner();
    const menu = document.getElementById('menu');
    if (menu) {
        menu.classList.remove('hidden');
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.style.display = 'none';
        }
        const h2 = menu.querySelector('h2');
        if (h2) {
            h2.textContent = 'Error: ' + message;
            h2.style.color = '#ff6b6b';
        }
    }
}

// Wait for DOM to load
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    
    // Safety timeout to hide spinner even if initialization hangs
    const safetyTimeout = setTimeout(() => {
        hideLoadingSpinner();
    }, 5000);
    
    try {
        // Set canvas to full window size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Initialize game
        const game = new Game(canvas);
        
        // Expose for debugging/testing
        window.game = game;
        
        // Clear safety timeout since game initialized successfully
        clearTimeout(safetyTimeout);
        
        // Hide loading spinner
        hideLoadingSpinner();
        
        // Handle resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (window.game && window.game.onResize) {
                window.game.onResize();
            }
        });
        
        // Prevent context menu on right click (for camera controls)
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
    } catch (error) {
        clearTimeout(safetyTimeout);
        console.error('Game initialization failed:', error);
        showErrorMessage('Game failed to load. Please refresh.');
    }
});