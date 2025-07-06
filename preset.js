// Preset configuration handler
(function () {
    if (!window.PRESET_CONFIG) return;

    const preset = window.PRESET_CONFIG;

    function applyPresetSettings() {
        // Update and disable sliders by iterating through slider containers
        const sliderContainers = document.querySelectorAll('.slider-container');
        sliderContainers.forEach(container => {
            const rangeInput = container.querySelector('input[type="range"]');
            const numberInput = container.querySelector('input[type="number"]');

            if (rangeInput && rangeInput.name && preset[rangeInput.name] !== undefined) {
                const value = preset[rangeInput.name];
                rangeInput.value = value;
                rangeInput.disabled = true;

                if (numberInput) {
                    numberInput.value = value;
                    numberInput.disabled = true;
                }
            }
        });

        // Update and disable checkboxes
        Object.keys(preset).forEach(key => {
            if (key.startsWith('vis-')) {
                const checkbox = document.querySelector(`input[type="checkbox"][name="${key}"]`);
                if (checkbox) {
                    checkbox.checked = preset[key];
                    checkbox.disabled = true;
                }
            }
        });

        // Update and disable dropdowns
        ['vis-dynamicLabelSize', 'vis-labelPosition'].forEach(key => {
            if (preset[key]) {
                const select = document.querySelector(`select[name="${key}"]`);
                if (select) {
                    select.value = preset[key];
                    select.disabled = true;
                }
            }
        });

        // Disable all buttons
        document.querySelectorAll('button').forEach(button => {
            if (!button.classList.contains('confirmation-button')) {
                button.disabled = true;
            }
        });

        // Disable dataset search
        const datasetInput = document.querySelector('#dataset-input');
        if (datasetInput) {
            datasetInput.disabled = true;
        }
    }

    function applyFileSelection() {
        if (!preset.files) return;

        const scrollPane = document.querySelector('#dataset-scroll-pane');
        if (!scrollPane) return;

        const fileCheckboxes = scrollPane.querySelectorAll('input[type="checkbox"]');
        fileCheckboxes.forEach(checkbox => {
            checkbox.disabled = true;

            const label = checkbox.nextElementSibling || checkbox.parentElement;
            const filename = label ? label.textContent.trim() : '';

            if (preset.files.includes(filename)) {
                checkbox.checked = true;
            } else {
                checkbox.checked = false;
            }
        });
    }

    // Expose function for index.js to call
    window.applyPresetFileSelection = applyFileSelection;

    // Apply settings when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyPresetSettings);
    } else {
        applyPresetSettings();
    }
})();