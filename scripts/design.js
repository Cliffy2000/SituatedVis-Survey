const DESIGN_DESCRIPTIONS = [
    {
        title: "Introduction of the current design",
        description: "For this graph, the label for each machine is above the individual readout. The range of output values is from 0 to 99. The readings of each machine output move from right to left, with the oldest reading on the left  and the most recent output reading on the right. The gray band and gray point color indicates acceptable range of a machine's output, which is from 30 to 70 parts per minute. If a machine's output is exactly 30 or 70 widgets per minute, the machine is inside of acceptable range. The square label in the right position contains the current output reading from the machine."
    },
    {
        title: "Introduction of the current design",
        description: "For this graph, the label for each machine is above the individual readout. The range of output values is from 0 to 99. The readings of each machine output move from right to left, with the oldest reading on the left  and the most recent output reading on the right. The gray band and gray point color indicates acceptable range of a machine's output, which is from 30 to 70 parts per minute. If a machine's output is exactly 30 or 70 widgets per minute, the machine is inside of acceptable range. The large number to the right of each graph is the current output reading from the machine."
    },
    {
        title: "Introduction of the current design",
        description: "For this graph, the label for each machine is above the individual readout. The range of output values is from 0 to 99. The readings of each machine output move from right to left, with the oldest reading on the left  and the most recent output reading on the right. The gray band and gray point color indicates acceptable range of a machine's output, which is from 30 to 70 parts per minute. If a machine's output is exactly 30 or 70 widgets per minute, the machine is inside of acceptable range. The square label in the right position contains the the current output reading from the machine. The size of the label corresponds to the current output reading, where a smaller label corresponds a lower value and a larger label corresponds to a higher value."
    },
    {
        title: "Introduction of the current design",
        description: "For this graph, the label for each machine is above the individual readout. The range of output values is from 0 to 99. The readings of each machine output move from right to left, with the oldest reading on the left  and the most recent output reading on the right. The gray band and gray point color indicates acceptable range of a machine's output, which is from 30 to 70 parts per minute. If a machine's output is exactly 30 or 70 widgets per minute, the machine is inside of acceptable range. The square label in the right position contains the the current output reading from the machine. The size of the label corresponds to the current output reading, where a smaller label corresponds to closer to the middle of the ideal range, and a larger label represents numbers that are both bigger and smaller, or further from the middle of the ideal range. "
    },
    {
        title: "Introduction of the current design",
        description: "For this graph, the label for each machine is above the individual readout. The range of output values is from 0 to 99. The readings of each machine output move from right to left, with the oldest reading on the left  and the most recent output reading on the right. The gray band and gray point color indicates acceptable range of a machine's output, which is from 30 to 70 parts per minute. If a machine's output is exactly 30 or 70 widgets per minute, the machine is inside of acceptable range. The number label to the right of each machine’s graph is the current output reading from the machine. The size of the label corresponds to the current output reading, where a smaller label corresponds a lower value and a larger label corresponds to a higher value."
    },
    {
        title: "Introduction of the current design",
        description: "For this graph, the label for each machine is above the individual readout. The range of output values is from 0 to 99. The readings of each machine output move from right to left, with the oldest reading on the left  and the most recent output reading on the right. The gray band and gray point color indicates acceptable range of a machine's output, which is from 30 to 70 parts per minute. If a machine's output is exactly 30 or 70 widgets per minute, the machine is inside of acceptable range. The square label to the right of each machine’s graph contains the the current output reading from the machine. The size of the label corresponds to the current output reading, where a smaller label corresponds to closer to the middle of the ideal range, and a larger label represents numbers that are both bigger and smaller, or further from the middle of the ideal range."
    },
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