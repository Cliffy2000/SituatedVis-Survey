/** This is for d3.js intelliSense */
/** @type {import("d3")} */

const params = new URLSearchParams(window.location.search);
const setupParam = params.get('setup');
const setupIndex = setupParam !== null ? parseInt(setupParam) - 1 : 0;

// Get config and current setup
const config = JSON.parse(sessionStorage.getItem('SituatedVisConfig'));
const currentSetup = config[setupIndex];

// Extract all values from current setup
let selectedFiles = currentSetup['files'];
const SETUP_LENGTH = currentSetup['setup-length'];
const ROWS = currentSetup['num-rows'];
const COLS = currentSetup['num-columns'];
const ANIM_DURATION = currentSetup['anim-duration'];
const ANIM_DELAY = currentSetup['anim-delay'];
const POINTS = currentSetup['num-points'];
let ROLLING_AVG = currentSetup['rolling-avg'];

const SHOW_X_AXIS_TICKS = currentSetup['vis-showXAxisTicks'];
const USE_THRESHOLD_COLORS = currentSetup['vis-useThresholdColors'];
const EASE_IN_OUT = currentSetup['vis-easeInOut'];
const X_AXIS_INVERSE_STATIC = currentSetup['vis-xAxisInverseStatic'];
const BACKGROUND_ENCODING = currentSetup['vis-backgroundEncoding'];
const USE_ROLLING_AVERAGE = currentSetup['vis-useRollingAverage'];
const GRID_BACKGROUND_MOVE = currentSetup['vis-gridBackgroundMove'];
const SHOW_THRESHOLD_BAND = currentSetup['vis-showThresholdBand'];
const SHOW_VERTICAL_BAR = currentSetup['vis-showVerticalBar'];
const DYNAMIC_LABEL_SIZE = currentSetup['vis-dynamicLabelSize'];
const LABEL_POSITION = currentSetup['vis-labelPosition'];

const soundSteps = currentSetup['sound'];

if (selectedFiles.length > ROWS * COLS) {
    selectedFiles = selectedFiles.slice(0, ROWS * COLS);
}

ROLLING_AVG = Math.min(ROLLING_AVG, POINTS);

// ==== 
const slider = document.getElementById("window-slider");
const numberInput = document.getElementById("window-slider-value");

if (USE_ROLLING_AVERAGE) {
	const rollingAverageDiv = document.querySelector('.rolling-average-description');
	rollingAverageDiv.textContent = `The rolling average is considering the last ${ROLLING_AVG} points.`;
	rollingAverageDiv.style.marginLeft = '50px'
}

let clickLog = [];

Promise.all(selectedFiles.map(file => d3.csv(`data/${file}`, d3.autoType))).then((datasets) => {

	// const POINTS = 10;

	let INTERVAL_ID;

	let flag_running = true;
	let step = 1;

	const container = d3.select("#container");
	const chartsContainer = container.select("#chartsContainer")
		.style("grid-template-rows", `repeat(${ROWS}, 1fr)`)
		.style("grid-template-columns", `repeat(${COLS}, 1fr)`)

	let { width: gridWidth, height: gridHeight } = chartsContainer.node().getBoundingClientRect();
	let cellWidth = gridWidth / COLS;
	let cellHeight = gridHeight / ROWS;

	// Fills the titles array
	const titles = Array.from({ length: selectedFiles.length }, (_, i) => `Machine ${i + 1}`);
	const charts = chartsContainer.selectAll("div")
		.data(d3.zip(datasets, titles))
		.join("div")
			.attr("class", LABEL_POSITION === "side" ? "chart-div-side" : "chart-div")
			.on("click", (event, [data, title]) => clickLog.push([title, Date.now(), Date()]))
			.on("mousedown", event => d3.select(event.currentTarget).style("box-shadow", "inset 0 0 0 2px black"))
			.on("mouseup", event => d3.select(event.currentTarget).style("box-shadow", null))
			.on("mouseleave", event => d3.select(event.currentTarget).style("box-shadow", null))
		.append(([data, title]) => generateChart(
			data = data, 
			title = title, 
			width = cellWidth, 
			height = cellHeight,
			viewRange = POINTS, 
			rollingAverage = ROLLING_AVG,
			showXAxisTicks = SHOW_X_AXIS_TICKS, 
			useThresholdColors = USE_THRESHOLD_COLORS,
			easeInOut = EASE_IN_OUT,
			xAxisInverseStatic = X_AXIS_INVERSE_STATIC,
			backgroundEncoding = BACKGROUND_ENCODING,
			useRollingAverage = USE_ROLLING_AVERAGE,
			gridBackgroundMove = GRID_BACKGROUND_MOVE,
			showThresholdBand = SHOW_THRESHOLD_BAND,
			showVerticalBar = SHOW_VERTICAL_BAR,
			dynamicLabelSize = DYNAMIC_LABEL_SIZE,
			labelPosition = LABEL_POSITION
		))
		.nodes();


	

	function getTimestamp() {
		const now = new Date();
		const pad = n => String(n).padStart(2, '0');
		const year   = now.getFullYear();
		const month  = pad(now.getMonth() + 1);
		const day    = pad(now.getDate());
		const hour   = pad(now.getHours());
		const minute = pad(now.getMinutes());
		const second = pad(now.getSeconds());
		return `${year}${month}${day}_${hour}${minute}${second}`;
	}

	/*
	function exportFile() {
		const userName = sessionStorage.getItem('SituatedVisUserName') || 'Unknown';
		const startTime = sessionStorage.getItem('SituatedVisConfirmationTime') || new Date().toISOString();
		const exportTime = new Date().toISOString();
		
		const exportData = {
			metadata: {
				userName: userName,
				startTime: startTime,
				exportTime: exportTime,
				selectedFiles: selectedFiles,
				configurations: {
					displaySliders: displaySliders,
					visualizationOptions: visOptions
				}
			},
			clickLog: clickLog
		};
		
		const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `SituatedVisLog_${getTimestamp()}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(a.href);
	}
*/

	function onPauseClick() {
		if (flag_running) {
			stopAnimation();
			buttonPause.text("Unpause");
			slider.disabled = false;
			numberInput.disabled = false;
		} else {
			animate();
			startAnimation();
			buttonPause.text("Pause");
			slider.disabled = true;
			numberInput.disabled = true;
		}
		flag_running = !flag_running;
	}

	function onRestartClick() {
		stopAnimation();
		step = 1;
		for (const chart of charts) {
			chart.update(step, ANIM_DURATION);
		}
		if (flag_running) {
			animate();
			startAnimation();
		}
	}
	

	const questions = currentSetup['questions'] || [];
	const questionResponses = {};

	// Display question in side panel
	function showQuestion(question) {
		const container = document.getElementById('questionContainer');
		if (!container) return;
		
		const questionDiv = document.createElement('div');
		questionDiv.className = 'question-item';
		questionDiv.innerHTML = `<p class="question-prompt">${question.prompt}</p>`;
		
		const optionsContainer = document.createElement('div');
		optionsContainer.className = 'question-options-container';
		
		// Check if options match machine count and should use grid
		const machineOptions = question.options.filter(opt => opt.startsWith('Machine'));
		const useGrid = machineOptions.length === selectedFiles.length && selectedFiles.length > 3;
		
		// Check if this is a "find 3" question (checkbox + grid)
		const isFind3Question = question.type === 'checkbox' && useGrid;
		
		// Record when question is shown
		const questionStartTime = Date.now();
		
		if (useGrid) {
			// Apply same grid layout as charts
			optionsContainer.style.display = 'grid';
			optionsContainer.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;
			optionsContainer.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
			optionsContainer.style.gap = '5px';
		}
		
		// Add submit button
		const submitButton = document.createElement('button');
		submitButton.className = 'question-submit-button';
		submitButton.textContent = 'Submit';
		submitButton.disabled = true;
		submitButton.dataset.questionId = question.id;
		
		if (question.type === 'radio') {
			question.options.forEach((option, index) => {
				const label = document.createElement('label');
				label.className = useGrid ? 'question-grid-option' : 'question-vertical-option';
				label.innerHTML = `
					<input type="radio" name="${question.id}" value="${option}">
					<span>${option}</span>
				`;
				optionsContainer.appendChild(label);
			});
			
			// Enable submit when radio is selected
			optionsContainer.addEventListener('change', () => {
				submitButton.disabled = false;
			});
			
		} else if (question.type === 'checkbox') {
			const checkboxes = [];
			question.options.forEach((option, index) => {
				const label = document.createElement('label');
				label.className = useGrid ? 'question-grid-option' : 'question-vertical-option';
				const checkbox = document.createElement('input');
				checkbox.type = 'checkbox';
				checkbox.name = question.id;
				checkbox.value = option;
				checkboxes.push(checkbox);
				
				label.appendChild(checkbox);
				label.appendChild(document.createElement('span')).textContent = option;
				optionsContainer.appendChild(label);
			});
			
			// Handle checkbox logic
			optionsContainer.addEventListener('change', () => {
				const checkedCount = checkboxes.filter(cb => cb.checked).length;
				
				if (isFind3Question) {
					// For checkbox + grid questions
					if (checkedCount === 3) {
						// Disable unchecked checkboxes
						checkboxes.forEach(cb => {
							if (!cb.checked) cb.disabled = true;
						});
						submitButton.disabled = false;
					} else {
						// Enable all checkboxes
						checkboxes.forEach(cb => cb.disabled = false);
						submitButton.disabled = true;
					}
				} else {
					// For regular checkbox questions
					submitButton.disabled = checkedCount === 0;
				}
			});
		}
		
		questionDiv.appendChild(optionsContainer);
		questionDiv.appendChild(submitButton);
		container.appendChild(questionDiv);
		
		// Track responses on submit
		submitButton.addEventListener('click', () => {
			const responseTime = Date.now() - questionStartTime;
			
			if (question.type === 'radio') {
				const selected = optionsContainer.querySelector(`input[name="${question.id}"]:checked`);
				if (selected) {
					questionResponses[question.id] = {
						response: selected.value,
						responseTime: responseTime,
						timestamp: new Date().toISOString()
					};
				}
			} else if (question.type === 'checkbox') {
				const selected = Array.from(optionsContainer.querySelectorAll(`input[name="${question.id}"]:checked`))
					.map(cb => cb.value);
				questionResponses[question.id] = {
					response: selected,
					responseTime: responseTime,
					timestamp: new Date().toISOString()
				};
			}
			
			// Disable submit after clicking
			submitButton.disabled = true;
			submitButton.textContent = 'Submitted';
			
			// Disable all inputs for this question
			optionsContainer.querySelectorAll('input').forEach(input => input.disabled = true);
		});
	}

	const buttonNext = d3.select("#buttonContainer").select("#nextButton")
		.on("click", onNextClick);
	
	function onNextClick() {
		console.log("clicked");
		// Prepare export data
		const userName = sessionStorage.getItem('username') || 'Unknown';
		const timestamp = new Date().toISOString();
		
		const exportData = {
			metadata: {
				userName: userName,
				setupName: currentSetup['setup'],
				setupIndex: setupIndex,
				timestamp: timestamp
			},
			configuration: currentSetup,
			responses: questionResponses,
			clickLog: clickLog
		};
		
		// Download JSON file
		const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `SituatedVis_${userName}_${currentSetup['setup']}_${getTimestamp()}.json`;
		document.body.appendChild(a);
		a.click();

		requestAnimationFrame(() => {
			document.body.removeChild(a);
			URL.revokeObjectURL(a.href);
			
			// Check if there's a next setup
			const nextIndex = setupIndex + 1;
			if (nextIndex < config.length) {
				// Navigate to next setup
				window.location.href = `index.html?setup=${nextIndex + 1}`;
			} else {
				// All setups completed
				alert('Study completed! Thank you for participating.');
				sessionStorage.clear();
				window.location.href = 'index.html';
			}
		});
	}

	function startAnimation() {
		INTERVAL_ID = setInterval(animate, ANIM_DURATION + ANIM_DELAY);
	}

	function stopAnimation() {
		clearInterval(INTERVAL_ID);
	}

	function playSound() {
		const audio = new Audio('beep.mp3');
		audio.play().catch(err => console.log('Audio play failed:', err));
	}

	const nextButton = document.getElementById('nextButton');
	if (nextButton) {
		nextButton.disabled = true;
	}

	function animate() {
		step++;

		// Group questions by their step
		const questionsAtCurrentStep = questions.filter(q => q.step === step);
		
		// If there are questions at this step, clear previous and show new ones
		if (questionsAtCurrentStep.length > 0) {
			// Clear the question container
			const container = document.getElementById('questionContainer');
			if (container) {
				container.innerHTML = '';
			}
			
			// Show all questions for this step
			questionsAtCurrentStep.forEach((question, index) => {
				showQuestion(question);
			});
		}
		
		if (soundSteps.includes(step)) {
			playSound();
		}
		
		for (let chart of charts) {
			chart.update(step, ANIM_DURATION);
		}

		console.log(step + POINTS - 1);
		if (step + POINTS - 1 >= SETUP_LENGTH) {
			stopAnimation();
			if (nextButton) {
				nextButton.disabled = false;
			}
		}
	}

	startAnimation();

	let skipFirstResize = true;
	const resizeObserver = new ResizeObserver((entries) => {
		if (skipFirstResize) {
			skipFirstResize = false;
			return;
		}

		if (!entries) {
			return;
		}

		let entry = entries[0];

		if (entry.contentBoxSize) {
			let contentBoxSize = entry.contentBoxSize[0];
			gridWidth = contentBoxSize.inlineSize;
			gridHeight = contentBoxSize.blockSize;
		} else {
			gridWidth = entry.contentRect.width;
			gridHeight = entry.contentRect.height;
		}

		cellWidth = gridWidth / COLS;
		cellHeight = gridHeight / ROWS;

		for (const chart of charts) {
			chart.resize(cellWidth, cellHeight);
		}

	});

	resizeObserver.observe(chartsContainer.node());
})