fetch('/data/files.json')
    .then(response => response.json())
    .then(csvFiles => {
        const datasetsList = document.getElementById('datasetsList');
        csvFiles.forEach(fileName => {
            const row = document.createElement('div');
            row.className = 'dataset-row';
            row.innerHTML = `<label><input type="checkbox" value="${fileName}"> ${fileName}</label>`;
            datasetsList.appendChild(row);
        });
    })
    .catch(error => console.error('Error fetching files.json:', error));


document.getElementById('searchInput').addEventListener('keyup', function() {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll('#datasetsList .dataset-row');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    });
});
