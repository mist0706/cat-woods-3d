/**
 * Main entry point - same structure as 2D version
 * Enhanced with better error handling and module load detection
 */
import { Game } from './game.js';

// Mark module as loaded for debugging
window.__moduleLoaded = true;

// Hide loading spinner safely
function hideLoadingSpinner() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
        // Force display none for older browsers
        loading.style.display = 'none';
    }
}

// Show loading spinner
function showLoadingSpinner() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('hidden');
        loading.style.display = 'flex';
    }
}

// Show error message if game fails to load
function showErrorMessage(message) {
    hideLoadingSpinner();
    const menu = document.getElementById('menu');
    if (menu) {
        menu.classList.remove('hidden');
        menu.style.display = 'flex';
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

// Global error handler for module loading issues
window.addEventListener('error', (e) => {
    console.error('Global error caught:', e.error || e.message);
    showErrorMessage('Game failed to initialize. Check console for details.');
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    showErrorMessage('Game failed to load resources. Please refresh.');
});

// Module loading failure detection
window.addEventListener('load', () => {
    // If we're still loading after window.load, something is wrong
    setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading && !loading.classList.contains('hidden')) {
            console.error('Loading screen still visible after window load');
            showErrorMessage('Game modules failed to load. Please check browser console.');
        }
    }, 1000);
});

// Wait for DOM to load
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Game canvas not found');
        showErrorMessage('Game canvas element missing');
        return;
    }
    
    // Safety timeout to hide spinner even if initialization hangs (extended to 10s)
    const safetyTimeout = setTimeout(() => {
        console.warn('Safety timeout triggered - game initialization took too long');
        hideLoadingSpinner();
        // Try to show error state if game didn't load
        if (!window.game) {
            showErrorMessage('Game load timeout. Please refresh and try again.');
        }
    }, 10000); // Extended from 5s to 10s
    
    try {
        // Set canvas to full window size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Initialize game
        console.log('Creating Game instance...');
        const game = new Game(canvas);
        
        // Expose debugging/testing functions
        window.game = game;
        
        // Auto-play mode for health monitoring
        window.enableGameAutoPlay = () => {
            if (window.game && window.game.enableAutoPlay) {
                window.game.enableAutoPlay();
                return 'Auto-play enabled';
            }
            return 'Game not ready yet';
        };
        
        window.disableGameAutoPlay = () => {
            if (window.game && window.game.disableAutoPlay) {
                window.game.disableAutoPlay();
                return 'Auto-play disabled';
            }
            return 'Game not ready yet';
        };
        
        window.getGameStatus = () => {
            if (window.game && window.game.getAutoPlayStatus) {
                return window.game.getAutoPlayStatus();
            }
            return { error: 'Game not initialized' };
        };
        
        // Start game and enable auto-play (for health monitoring)
        window.startGameAndAutoPlay = () => {
            if (window.game && window.game.gameState === 'MENU') {
                window.game.startGame();
                setTimeout(() => window.game.enableAutoPlay(), 500);
                return 'Game started, auto-play will enable in 500ms';
            }
            return 'Game not in menu or not ready';
        };
        
        console.log('Game initialized successfully');
        
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
        console.error('Error stack:', error.stack);
        showErrorMessage('Game failed to load: ' + (error.message || 'Unknown error'));
    }
});
