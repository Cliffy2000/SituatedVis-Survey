fetch('/data/files.json')
    .then(response => response.json())
    .then(csvFiles => {
        const datasetsList = document.getElementById('dataset-scroll-pane');
        csvFiles.forEach(fileName => {
            const row = document.createElement('div');
            row.className = 'dataset-row';
            row.innerHTML = `<label><input type="checkbox" value="${fileName}"> ${fileName}</label>`;
            datasetsList.appendChild(row);
        });
    })
    .catch(error => console.error('Error fetching files.json:', error));


const sliders = document.querySelectorAll('.slider-container input[type="range"]');
sliders.forEach(slider => {
    const numberInput = document.getElementById(`${slider.id}-value`);
    // Update number input when slider changes
    slider.addEventListener('input', () => {
        numberInput.value = slider.value;
    });
    // Update slider when number input changes
    numberInput.addEventListener('input', () => {
        let value = parseInt(numberInput.value, 10);
        if (isNaN(value)) value = slider.min;
        value = Math.min(Math.max(value, slider.min), slider.max);
        slider.value = value;
        numberInput.value = value;
    });
});

document.getElementById('dataset-input').addEventListener('keyup', function () {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll('#dataset-scroll-pane .dataset-row');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    });
});
