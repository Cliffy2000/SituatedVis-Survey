// Random order of datasets
// Switch for random components

function tryAssignQuestions(setup, questions) {
    ITERATIONS = 3;

    const valid = [];
    for (let i = 1; i <= setup['setup-length']; i++) {
        const forbidden = setup['no-questions']?.some(([start, end]) => 
            i >= start && i <= end) ?? false;
        if (!forbidden) valid.push(i);
    }
    
    // Need to place each question 3 times
    const toPlace = [];
    questions.forEach(q => {
        for (let i = 0; i < ITERATIONS; i++) toPlace.push({...q});
    });
    
    const placed = [];
    const usedPositions = [];
    
    // Random order for questions
    toPlace.sort(() => Math.random() - 0.5);
    
    for (const q of toPlace) {
        // Find positions that maintain min-spacing
        const available = valid.filter(pos => 
            usedPositions.every(used => 
                Math.abs(used - pos) >= setup['min-spacing']
            )
        );
        
        if (available.length === 0) return null; // Failed, need retry
        
        const pos = available[Math.floor(Math.random() * available.length)];
        usedPositions.push(pos);
        placed.push({...q, step: pos});
    }
    
    return placed;
}

function shuffleFiles(files) {
    const shuffled = [...files];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}


window.homeInit = async function () {

    // Get setup index from storage, not URL
    const setupIndex = parseInt(sessionStorage.getItem("SituatedVisCurrentIndex") || "0");

    let config = sessionStorage.getItem("SituatedVisConfig");
    console.log("check what is config", config);

    if (!config) {
        // Config not in sessionStorage
        const raw = await fetch('config.json').then(r => r.json());
        
        // Randomize and pair filesets with setups
        const filesetIndices = [...Array(raw.filesets.length).keys()].sort(() => Math.random() - 0.5);
        const setupIndices = [...Array(raw.setups.length).keys()].sort(() => Math.random() - 0.5);

        const processedConfig = setupIndices.map((setupIdx, i) => {
            const setup = raw.setups[setupIdx];
            let questions = null;
            let attempts = 0;
            
            while (!questions && attempts < 100) {
                questions = tryAssignQuestions(setup, raw.questions);
                attempts++;
            }
            
            if (!questions) {
                alert(`Failed to assign questions for setup ${setup.setup}`);
                questions = [];
            }

            questions.sort((a, b) => a.step - b.step);
            const questionSteps = questions.map(q => q.step);
            
            return {
                ...setup,
                files: shuffleFiles(raw.filesets[filesetIndices[i]]),
                questions,
                sound: questionSteps
            };
        });
        config = processedConfig;
        console.log(config);
        await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
        sessionStorage.setItem("SituatedVisConfig", JSON.stringify(config));

    } else {
        // Config exists in sessionStorage, parse it
        config = JSON.parse(config);
    }

    // Validate index
    if (setupIndex >= config.length) {
        sessionStorage.clear();
        window.navigateToHome();
        return;
    }

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