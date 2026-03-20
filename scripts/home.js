let QUESTION_ORDERS = [
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
    const questionTime = setup['question-time'];
    const minSpacing = setup['question-min-spacing'];
    const lastValidStep = setup['setup-length'] - setup['num-points'] - questionTime + 1;

    const valid = [];
    for (let i = 1; i <= lastValidStep; i++) {
        const forbidden = setup['no-questions']?.some(([start, end]) =>
            i >= start && i <= end) ?? false;
        if (!forbidden) valid.push(i);
    }

    const selectedPositions = [];

    for (let i = 0; i < questionsToPlace.length; i++) {
        const available = valid.filter(pos =>
            selectedPositions.every(used => Math.abs(used - pos) >= minSpacing)
        );

        if (available.length === 0) return null;

        const pos = available[Math.floor(Math.random() * available.length)];
        selectedPositions.push(pos);
    }

    selectedPositions.sort((a, b) => a - b);

    const placed = questionsToPlace.map((q, index) => ({
        ...q,
        step: selectedPositions[index]
    }));

    if (placed.length > 0) {
        const realQuestions = [...placed];
        for (const q of realQuestions) {
            placed.push({
                step: q.step + questionTime,
                id: '_clear',
                prompt: '',
                type: 'clear',
                area: '',
                options: []
            });
        }
    }

    return placed;
}

window.homeInit = async function () {
    let config = sessionStorage.getItem("SituatedVisConfig");

    if (!config) {
        const raw = await fetch('config.json').then(r => r.json());

        const designIndex = parseInt(sessionStorage.getItem('designIndex'));

        const setup = raw.setups[designIndex];
        const filesetOrder = shuffleArray([0, 1, 2, 3, 4, 5]);
        QUESTION_ORDERS = shuffleArray(QUESTION_ORDERS);

        console.log("Design:", designIndex);
        console.log("Fileset order:", filesetOrder.map(i => i + 1));

        const allConfigs = [];

        // Attention check question (not in config.json)
        const ATN_QUESTION = {
            id: "atn",
            prompt: "Which of the following response options is a fruit?",
            type: "radio",
            area: "machine",
            options: [
                "Chair", "Book", "Apple", "Pencil"
            ]
        };

        for (let trial = 0; trial < 6; trial++) {
            const filesetIdx = filesetOrder[trial];

            // Start with the predefined order for this trial
            let slotOrder = [...QUESTION_ORDERS[trial]];

            // For trial index 3, randomly insert the attention question (index 6)
            if (trial === 3) {
                const insertPos = Math.floor(Math.random() * (slotOrder.length + 1));
                slotOrder.splice(insertPos, 0, 6);
                console.log(`Trial 4: inserted atn question at position ${insertPos} → [${slotOrder}]`);
            }

            // Build the questions for this trial
            // Index 6 = attention check (hardcoded), all others from config
            const questionsToPlace = slotOrder.map(qIdx =>
                qIdx === 6 ? { ...ATN_QUESTION } : { ...raw.questions[qIdx] }
            );

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
                questionOrder: slotOrder,
                questionTime: setup['question-time']
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
    const currentIndex = parseInt(sessionStorage.getItem('SituatedVisCurrentIndex') || '0');
    setTimeout(() => {
        window.navigateToDashboard();
    }, 10);
}