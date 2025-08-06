const params = new URLSearchParams(window.location.search);
const setupParam = params.get('setup');
const setupIndex = setupParam ? parseInt(setupParam) - 1 : 0;

fetch('config.json')
    .then(r => r.json())
    .then(config => {
		console.log("storing");
        sessionStorage.setItem("SituatedVisConfig", JSON.stringify(config));
        sessionStorage.setItem("SituatedVisCurrentIndex", setupIndex);

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
    })
    .catch(error => console.error('Error fetching config.json:', error));


function startTrial() {
	const username = document.getElementById('user-name').value.trim();
	sessionStorage.setItem('username', username);
	const setupIndex = parseInt(sessionStorage.getItem('SituatedVisCurrentIndex'));
	window.location.href = `dashboard.html?setup=${setupIndex + 1}`;
}