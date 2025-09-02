window.homeInit = async function () {

    // Get setup index from storage, not URL
    const setupIndex = parseInt(sessionStorage.getItem("SituatedVisCurrentIndex") || "0");

    const config = await fetch('config.json').then(r => r.json());

    // Validate index
    if (setupIndex >= config.length) {
        sessionStorage.clear();
        window.navigateToHome();
        return;
    }

    sessionStorage.setItem("SituatedVisConfig", JSON.stringify(config));
    sessionStorage.setItem("SituatedVisCurrentIndex", String(setupIndex));

    document.querySelector(".setup-name").textContent = config[setupIndex].setup;

    const existingUsername = sessionStorage.getItem('username');
    const usernameInput = document.getElementById('user-name');
    const startButton = document.querySelector('.startTrialButton');

    if (existingUsername) {
        usernameInput.value = existingUsername;
        startButton.disabled = false;
    } else {
        startButton.disabled = true;
    }

    usernameInput.addEventListener('input', () => {
        startButton.disabled = !usernameInput.value.trim();
    });


}

function startTrial() {
    const username = document.getElementById('user-name').value.trim();
    sessionStorage.setItem('username', username);

    // Replace the current page in history with dashboard
    setTimeout(() => {
        window.navigateToDashboard();
    }, 10);
}