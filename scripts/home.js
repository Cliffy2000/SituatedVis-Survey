function shuffleArray(arr) {
    const shuffled = [...arr];
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

    if (qsetIndex === 0) {
        [questions[0], questions[1]].forEach(q => {
            for (let i = 0; i < 2; i++) toPlace.push({ ...q });
        });
    } else if (qsetIndex === 1) {
        [questions[2], questions[3]].forEach(q => {
            for (let i = 0; i < 2; i++) toPlace.push({ ...q });
        });
    } else if (qsetIndex === 2) {
        for (let i = 0; i < 5; i++) toPlace.push({ ...questions[4] });
    } else if (qsetIndex === 3) {
        for (let i = 0; i < 5; i++) toPlace.push({ ...questions[5] });
    }

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

    console.log("placed", placed);
    return placed;
}

window.homeInit = async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const qsetParam = urlParams.get('qset');

    let config = sessionStorage.getItem("SituatedVisConfig");

    if (!config) {
        const raw = await fetch('config.json').then(r => r.json());

        const qsetIndex = qsetParam ? parseInt(qsetParam) - 1 : Math.floor(Math.random() * 4);

        const setupOrder = shuffleArray([0, 1, 2, 3, 4, 5]);
        const filesetOrder = shuffleArray([0, 1, 2, 3, 4, 5]);

        console.log("Setup order:", setupOrder.map(i => i + 1));
        console.log("Fileset order:", filesetOrder.map(i => i + 1));

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

    const currentIndex = parseInt(sessionStorage.getItem("SituatedVisCurrentIndex") || "0");
    sessionStorage.setItem("SituatedVisCurrentIndex", String(currentIndex));

    const current = config[currentIndex];
    document.querySelector(".qset-index").textContent = (current.qsetIndex + 1);
    document.querySelector(".config-index").textContent = 
        `${current.trialNumber} of 6  (Setup ${current.setupIndex + 1}, Fileset ${current.filesetIndex + 1})`;

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