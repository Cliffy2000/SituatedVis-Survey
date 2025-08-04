document.addEventListener("DOMContentLoaded", async () => {
	const params = new URLSearchParams(window.location.search);
	const setupParam = params.get('setup');
	const setupIndex = setupParam !== null ? parseInt(setupParam) - 1 : 0;
	console.log(setupIndex);

	const config = await fetch('config.json').then(r => r.json());

	// TODO: invalid index

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

function startTrial() {
	const username = document.getElementById('user-name').value.trim();
	sessionStorage.setItem('username', username);
	const setupIndex = sessionStorage.getItem('SituatedVisCurrentIndex');
	window.location.href = `dashboard.html?setup=${parseInt(setupIndex) + 1}`;
}