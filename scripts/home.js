function shuffleFiles(files) {
    const shuffled = [...files];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function tryAssignQuestions(setup, questions, qsetIndex) {
    const valid = [];
    for (let i = 1; i <= setup['setup-length']; i++) {
        const forbidden = setup['no-questions']?.some(([start, end]) =>
            i >= start && i <= end) ?? false;
        if (!forbidden) valid.push(i);
    }

    const toPlace = [];
    
    // Handle different question sets based on qsetIndex (0-3)
    if (qsetIndex === 0) {
        // q1 and q2, 2 iterations each
        [questions[0], questions[1]].forEach(q => {
            for (let i = 0; i < 2; i++) toPlace.push({ ...q });
        });
    } else if (qsetIndex === 1) {
        // q3 and q4, 2 iterations each
        [questions[2], questions[3]].forEach(q => {
            for (let i = 0; i < 2; i++) toPlace.push({ ...q });
        });
    } else if (qsetIndex === 2) {
        // q5, 5 iterations
        for (let i = 0; i < 5; i++) toPlace.push({ ...questions[4] });
    } else if (qsetIndex === 3) {
        // q6, 5 iterations
        for (let i = 0; i < 5; i++) toPlace.push({ ...questions[5] });
    }

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
        placed.push({ ...q, step: pos });
    }

    console.log("placed", placed);

    return placed;
}

window.homeInit = async function () {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const qsetParam = urlParams.get('qset');
    const setupParam = urlParams.get('setup');

    let config = sessionStorage.getItem("SituatedVisConfig");

    if (!config) {
        // Config not in sessionStorage
        const raw = await fetch('config.json').then(r => r.json());

        // Determine which question set to use (0-3)
        const qsetIndex = qsetParam ? parseInt(qsetParam) - 1 : Math.floor(Math.random() * 4);
        
        // Determine which setup to use (0-5)
        const setupIndex = setupParam ? parseInt(setupParam) - 1 : Math.floor(Math.random() * 6);
        
        const setup = raw.setups[setupIndex];
        
        // Randomly select a fileset
        const filesetIndex = Math.floor(Math.random() * raw.filesets.length);
        
        let questions = null;
        let attempts = 0;

        while (!questions && attempts < 100) {
            questions = tryAssignQuestions(setup, raw.questions, qsetIndex);
            attempts++;
        }

        if (!questions) {
            alert(`Failed to assign questions for setup ${setup.setup}`);
            questions = [];
        }

        questions.sort((a, b) => a.step - b.step);
        const questionSteps = questions.map(q => q.step);

        config = [{
            ...setup,
            files: shuffleFiles(raw.filesets[filesetIndex]),
            questions,
            sound: questionSteps,
            qsetIndex: qsetIndex,
            setupIndex: setupIndex
        }];
        
        await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
        sessionStorage.setItem("SituatedVisConfig", JSON.stringify(config));

    } else {
        // Config exists in sessionStorage, parse it
        config = JSON.parse(config);
    }

    sessionStorage.setItem("SituatedVisCurrentIndex", "0");

    // Display 1-indexed values
    document.querySelector(".qset-index").textContent = (config[0].qsetIndex + 1);
    document.querySelector(".config-index").textContent = (config[0].setupIndex + 1);

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