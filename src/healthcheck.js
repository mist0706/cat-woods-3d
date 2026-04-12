
// Health check endpoint for monitoring
export function initHealthCheck(game) {
    // Expose health status
    window.__gameHealth = {
        initialized: false,
        lastActivity: Date.now()
    };
    
    const updateHealth = () => {
        if (window.__gameHealth) {
            window.__gameHealth.lastActivity = Date.now();
            window.__gameHealth.initialized = !!(game && game.scene);
        }
    };
    
    // Update health on various events
    document.addEventListener('click', updateHealth);
    document.addEventListener('keydown', updateHealth);
    
    setInterval(updateHealth, 5000);
}
