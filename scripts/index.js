// Prevent back navigation
window.history.pushState(null, null, window.location.href);
window.onpopstate = function () {
    window.history.go(1);
};

// Load view
async function loadView(viewName) {
    const container = document.getElementById('app-container');
    
    try {
        // Load HTML
        const response = await fetch(`pages/${viewName}.html`);
        const html = await response.text();
        
        // Extract body content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const bodyContent = doc.body.innerHTML;
        
        // Load styles
        const styleLinks = doc.head.querySelectorAll('link[rel="stylesheet"]');
        styleLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!document.querySelector(`link[href="${href}"]`)) {
                const newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = href;
                document.head.appendChild(newLink);
            }
        });
        
        // Update container
        container.innerHTML = bodyContent;
        
        // Load corresponding script
        if (viewName === 'home') {
            if (!window.homeInit) {
                const script = document.createElement('script');
                script.src = 'scripts/home.js';
                script.onload = async () => {
                    await window.homeInit();
                };
                document.head.appendChild(script);
            } else {
                window.homeInit();
            }
        } else if (viewName === 'dashboard') {
            // Ensure D3 and visualization.js are loaded first
            await loadScript('d3/d3.js');
            await loadScript('scripts/visualization.js');
            
            if (!window.dashboardInit) {
                const script = document.createElement('script');
                script.src = 'scripts/dashboard.js';
                script.onload = () => window.dashboardInit();
                document.head.appendChild(script);
            } else {
                window.dashboardInit();
            }
        }
        
    } catch (error) {
        console.error('Error loading view:', error);
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Navigation functions
window.navigateToHome = () => loadView('home');
window.navigateToDashboard = () => loadView('dashboard');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadView('home');
});