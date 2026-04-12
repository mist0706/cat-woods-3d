/**
 * Main entry point - same structure as 2D version
 * Enhanced with better error handling and module load detection
 */

// Set module status early
window.__moduleStatus = 'LOADING';

let moduleLoadError = null;

try {
    // Dynamic import for better error handling
    const gameModule = await import('./game.js');
    const { Game } = gameModule;

    // Mark module as loaded for debugging
    window.__moduleLoaded = true;
    window.__moduleStatus = 'LOADED';

    // Hide loading spinner safely
    function hideLoadingSpinner() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
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

    // Module load tracking - update status when script runs
    window.__moduleStatus = 'INITIALIZING';

    // Wait for DOM
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
    }

    console.log('DOM loaded, initializing game...');

    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Game canvas not found');
        showErrorMessage('Game canvas element missing');
        throw new Error('Canvas not found');
    }

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

    window.__moduleStatus = 'READY';

} catch (error) {
    window.__moduleStatus = 'FAILED';
    window.__moduleLoadError = error;
    console.error('Game initialization failed:', error);
    console.error('Error stack:', error.stack);
    
    const loading = document.getElementById('loading');
    if (loading) {
        loading.innerHTML = `<div style="color: #ff6b6b; text-align: center; padding: 20px; max-width: 80%;">
            <h3>Failed to load game modules</h3>
            <p>Error: ${error.message || 'Unknown error'}</p>
            <p style="font-size: 0.9em; margin-top: 10px;">Check browser console for details</p>
        </div>`;
    }
}
