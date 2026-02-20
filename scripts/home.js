function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function tryAssignQuestions(setup, questions, qsetIndex) {
    const END_MARGIN = 5;
    const lastValidStep = setup['setup-length'] - setup['num-points'] - END_MARGIN + 1;

    const valid = [];
    for (let i = 1; i <= lastValidStep; i++) {
        const forbidden = setup['no-questions']?.some(([start, end]) =>
            i >= start && i <= end) ?? false;
        if (!forbidden) valid.push(i);
    }

    const toPlace = [];

    // Each participant gets one question type (0-5), repeated 5 times
    for (let i = 0; i < 5; i++) toPlace.push({ ...questions[qsetIndex] });

    const placed = [];
    const usedPositions = [];

    toPlace.sort(() => Math.random() - 0.5);

    for (const q of toPlace) {
        const available = valid.filter(pos =>
            usedPositions.every(used =>
                Math.abs(used - pos) >= setup['min-spacing']
            )
        );

        if (available.length === 0) return null;

        const pos = available[Math.floor(Math.random() * available.length)];
        usedPositions.push(pos);
        placed.push({ ...q, step: pos });
    }

    // Add a clear event after the last question so it disappears like the rest
    if (placed.length > 0) {
        const lastStep = Math.max(...placed.map(q => q.step));
        placed.push({
            step: lastStep + END_MARGIN,
            id: '_clear',
            prompt: '',
            type: 'clear',
            area: '',
            options: []
        });
    }

    console.log("placed", placed);
    return placed;
}

window.homeInit = async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const qsetParam = urlParams.get('qset');

    let config = sessionStorage.getItem("SituatedVisConfig");

    if (!config) {
        const raw = await fetch('config.json').then(r => r.json());

        // Read qsetIndex from sessionStorage (set during training via Prolific ID % 6)
        // Fall back to URL param or random
        let qsetIndex;
        const storedQset = sessionStorage.getItem('qsetIndex');
        if (storedQset !== null) {
            qsetIndex = parseInt(storedQset);
        } else if (qsetParam) {
            qsetIndex = parseInt(qsetParam) - 1;
        } else {
            qsetIndex = Math.floor(Math.random() * 6);
        }

        // Shuffle the 6 setups and 6 filesets independently
        const setupOrder = shuffleArray([0, 1, 2, 3, 4, 5]);
        const filesetOrder = shuffleArray([0, 1, 2, 3, 4, 5]);

        console.log("Setup order:", setupOrder.map(i => i + 1));
        console.log("Fileset order:", filesetOrder.map(i => i + 1));

        // Build all 6 trial configs
        const allConfigs = [];

        for (let trial = 0; trial < 6; trial++) {
            const setupIdx = setupOrder[trial];
            const filesetIdx = filesetOrder[trial];
            const setup = raw.setups[setupIdx];

            let questions = null;
            let attempts = 0;
            while (!questions && attempts < 100) {
                questions = tryAssignQuestions(setup, raw.questions, qsetIndex);
                attempts++;
            }

            if (!questions) {
                alert(`Failed to assign questions for trial ${trial + 1} (setup ${setup.setup})`);
                questions = [];
            }

            questions.sort((a, b) => a.step - b.step);
            const questionSteps = questions.map(q => q.step);

            allConfigs.push({
                ...setup,
                files: shuffleArray(raw.filesets[filesetIdx]),
                questions,
                sound: questionSteps,
                qsetIndex: qsetIndex,
                setupIndex: setupIdx,
                filesetIndex: filesetIdx,
                trialNumber: trial + 1
            });
        }

        config = allConfigs;
        await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
        sessionStorage.setItem("SituatedVisConfig", JSON.stringify(config));
    } else {
        config = JSON.parse(config);
    }

    // Determine which trial we're on
    const currentIndex = parseInt(sessionStorage.getItem("SituatedVisCurrentIndex") || "0");
    sessionStorage.setItem("SituatedVisCurrentIndex", String(currentIndex));

    // Display info for the current trial
    const current = config[currentIndex];
    document.querySelector(".qset-index").textContent = (current.qsetIndex + 1);
    document.querySelector(".config-index").textContent =
        `${current.trialNumber} of 6  (Setup ${current.setupIndex + 1}, Fileset ${current.filesetIndex + 1})`;

    // Show pause message between trials (index > 0), logo on first visit
    const logo = document.getElementById('header-logo');
    const message = document.getElementById('header-message');
    if (currentIndex > 0) {
        if (logo) logo.style.display = 'none';
        if (message) message.style.display = '';
    } else {
        if (logo) logo.style.display = '';
        if (message) message.style.display = 'none';
    }

    // Display the Prolific ID (read-only, already saved from training page)
    const username = sessionStorage.getItem('username') || '';
    const idDisplay = document.querySelector('.prolific-id-display');
    if (idDisplay) {
        idDisplay.textContent = username || '(not set)';
    }

    const startButton = document.querySelector('.startTrialButton');
    // Enable start if we have a username; otherwise disable
    startButton.disabled = !username;
}

function startTrial() {
    setTimeout(() => {
        window.navigateToDashboard();
    }, 10);
}