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
    
        slider.addEventListener('input', () => {
            numberInput.value = slider.value;
        });
    
        function snapValue() {
            let value = parseInt(numberInput.value, 10);
            let min = parseInt(slider.min);
            let max = parseInt(slider.max);
            let step = parseInt(slider.step) || 1;
    
            if (isNaN(value) || value < min) {
                value = min;
            } else if (value > max) {
                value = max;
            } else if (slider.id === 'slider2') {
                value = Math.round(value / step) * step;
                value = Math.max(min, Math.min(value, max));
            }
    
            slider.value = value;
            numberInput.value = value;
        }
    
        numberInput.addEventListener('blur', snapValue);
        numberInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                snapValue();
                numberInput.blur();
            }
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
