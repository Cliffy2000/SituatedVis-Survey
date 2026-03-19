const DESIGN_DESCRIPTIONS = [
    { title: "Introduction of the current design", description: "..." },
    { title: "Introduction of the current design", description: "..." },
    { title: "Introduction of the current design", description: "..." },
    { title: "Introduction of the current design", description: "..." },
    { title: "Introduction of the current design", description: "..." },
    { title: "Introduction of the current design", description: "..." },
];

window.designInit = function () {
    const designIndex = parseInt(sessionStorage.getItem('designIndex'));
    const desc = DESIGN_DESCRIPTIONS[designIndex];

    document.getElementById('design-title').textContent = desc.title;
    document.getElementById('design-description').textContent = desc.description;

    document.getElementById('continueButton').addEventListener('click', function () {
        window.navigateToDashboard();
    });
};


function startTrial() {
    setTimeout(() => {
        window.navigateToDashboard();
    }, 10);
}