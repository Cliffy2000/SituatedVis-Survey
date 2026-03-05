const QUESTION_ORDERS = [
    [1, 4, 0, 5, 2, 3],
    [3, 0, 5, 2, 4, 1],
    [5, 2, 4, 1, 3, 0],
    [0, 3, 2, 4, 1, 5],
    [4, 5, 1, 3, 0, 2],
    [2, 1, 3, 0, 5, 4],
];

function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function assignQuestionSteps(setup, questionsToPlace) {
    const END_MARGIN = 5;
    const lastValidStep = setup['setup-length'] - setup['num-points'] - END_MARGIN + 1;

    const valid = [];
    for (let i = 1; i <= lastValidStep; i++) {
        const forbidden = setup['no-questions']?.some(([start, end]) =>
            i >= start && i <= end) ?? false;
        if (!forbidden) valid.push(i);
    }

    const placed = [];
    const usedPositions = [];

    // Randomize placement order
    const shuffled = [...questionsToPlace].sort(() => Math.random() - 0.5);

    for (const q of shuffled) {
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

    // Add clear event after last question
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

    return placed;
}

window.homeInit = async function () {
    let config = sessionStorage.getItem("SituatedVisConfig");

    if (!config) {
        const raw = await fetch('config.json').then(r => r.json());

        const designIndex = parseInt(sessionStorage.getItem('designIndex') || '0');
        const questionMapping = JSON.parse(sessionStorage.getItem('questionMapping') || '[0,1,2,3,4,5]');

        const setup = raw.setups[designIndex];
        const filesetOrder = shuffleArray([0, 1, 2, 3, 4, 5]);

        console.log("Design:", designIndex);
        console.log("Question mapping:", questionMapping);
        console.log("Fileset order:", filesetOrder.map(i => i + 1));

        const allConfigs = [];

        for (let trial = 0; trial < 6; trial++) {
            const filesetIdx = filesetOrder[trial];

            // Decode this trial's question order through the mapping
            const slotOrder = QUESTION_ORDERS[trial];
            const actualQuestions = slotOrder.map(slot => questionMapping[slot]);

            // Build the 6 questions for this trial
            const questionsToPlace = actualQuestions.map(qIdx => ({ ...raw.questions[qIdx] }));

            let placed = null;
            let attempts = 0;
            while (!placed && attempts < 100) {
                placed = assignQuestionSteps(setup, questionsToPlace);
                attempts++;
            }

            if (!placed) {
                alert(`Failed to assign questions for trial ${trial + 1}`);
                placed = [];
            }

            placed.sort((a, b) => a.step - b.step);
            const questionSteps = placed.filter(q => q.id !== '_clear').map(q => q.step);

            allConfigs.push({
                ...setup,
                files: shuffleArray(raw.filesets[filesetIdx]),
                questions: placed,
                sound: questionSteps,
                designIndex: designIndex,
                filesetIndex: filesetIdx,
                trialNumber: trial + 1,
                questionOrder: actualQuestions
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
    const designDisplay = `Design ${current.designIndex + 1}`;
    const questionsDisplay = current.questionOrder.map(q => `q${q + 1}`).join(', ');
    document.querySelector(".qset-index").textContent = questionsDisplay;
    document.querySelector(".config-index").textContent = `Trial ${current.trialNumber} of 6 — ${designDisplay}`;

    const logo = document.getElementById('header-logo');
    const message = document.getElementById('header-message');
    if (currentIndex > 0) {
        if (logo) logo.style.display = 'none';
        if (message) message.style.display = '';
    } else {
        if (logo) logo.style.display = '';
        if (message) message.style.display = 'none';
    }

    const username = sessionStorage.getItem('username') || '';
    const idDisplay = document.querySelector('.prolific-id-display');
    if (idDisplay) {
        idDisplay.textContent = username || '(not set)';
    }

    const startButton = document.querySelector('.startTrialButton');
    startButton.disabled = !username;
}

function startTrial() {
    setTimeout(() => {
        window.navigateToDashboard();
    }, 10);
}