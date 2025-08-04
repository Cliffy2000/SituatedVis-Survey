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

	/*
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
	*/

	function onNextClick() {

	}

	const questions = currentSetup['questions'] || [];
	const questionResponses = {};
	const shownQuestions = new Set();

	// Initialize side panel
	const sidePanel = document.querySelector('#sidePanel');
	if (sidePanel && questions.length > 0) {
		sidePanel.innerHTML = '<h3>Questions</h3><div id="questionContainer"></div>';
	}

	// Display question in side panel
	function showQuestion(question) {
		const container = document.getElementById('questionContainer');
		if (!container) return;
		
		const questionDiv = document.createElement('div');
		questionDiv.className = 'question-item';
		questionDiv.innerHTML = `<p class="question-prompt">${question.prompt}</p>`;
		
		if (question.type === 'radio') {
			question.options.forEach(option => {
				const label = document.createElement('label');
				label.innerHTML = `
					<input type="radio" name="${question.id}" value="${option}">
					${option}
				`;
				questionDiv.appendChild(label);
			});
		} else if (question.type === 'checkbox') {
			question.options.forEach(option => {
				const label = document.createElement('label');
				label.innerHTML = `
					<input type="checkbox" name="${question.id}" value="${option}">
					${option}
				`;
				questionDiv.appendChild(label);
			});
		}
		
		container.appendChild(questionDiv);
		
		// Track responses
		questionDiv.addEventListener('change', (e) => {
			if (question.type === 'radio') {
				questionResponses[question.id] = e.target.value;
			} else if (question.type === 'checkbox') {
				if (!questionResponses[question.id]) {
					questionResponses[question.id] = [];
				}
				if (e.target.checked) {
					questionResponses[question.id].push(e.target.value);
				} else {
					questionResponses[question.id] = questionResponses[question.id].filter(v => v !== e.target.value);
				}
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

	function animate() {
		step++;
		// slider.value = step;
		// numberInput.value = step;

		// TODO: potentially update for more efficient implementation

		questions.forEach((question, index) => {
			if (step >= question.step && !shownQuestions.has(index)) {
				showQuestion(question);
				shownQuestions.add(index);
			}
		});

		if (soundSteps.includes(step)) {
			playSound();
		}

		for (let chart of charts) {
			chart.update(step, ANIM_DURATION);
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