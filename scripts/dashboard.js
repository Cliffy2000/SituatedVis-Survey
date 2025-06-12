/** This is for d3.js intelliSense */
/** @type {import("d3")} */

let selectedFiles = JSON.parse(sessionStorage.getItem('SituatedVisSelectedFiles')) || [];

const displaySliders = JSON.parse(sessionStorage.getItem('SituatedVisDisplaySliders')) || {};
const ROWS = parseInt(displaySliders['num-rows']);
const COLS = parseInt(displaySliders['num-columns']);
const ANIM_DURATION = parseInt(displaySliders['anim-duration']);
const ANIM_DELAY = parseInt(displaySliders['anim-delay']);
const POINTS = parseInt(displaySliders['num-points']);
let ROLLING_AVG = parseInt(displaySliders['rolling-avg']);

const visOptions = JSON.parse(sessionStorage.getItem('visualizationOptions')) || {};
const SHOW_X_AXIS_TICKS = visOptions['vis-showXAxisTicks'];
const USE_THRESHOLD_COLORS = visOptions['vis-useThresholdColors'];
const EASE_IN_OUT = visOptions['vis-easeInOut'];
const X_AXIS_INVERSE_STATIC = visOptions['vis-xAxisInverseStatic'];
const BACKGROUND_ENCODING = visOptions['vis-backgroundEncoding'];
const USE_ROLLING_AVERAGE = visOptions['vis-useRollingAverage'];
const GRID_BACKGROUND_MOVE = visOptions['vis-gridBackgroundMove'];
const SHOW_THRESHOLD_BAND = visOptions['vis-showThresholdBand'];
const SHOW_VERTICAL_BAR = visOptions['vis-showVerticalBar'];
const DYNAMIC_LABEL_SIZE = visOptions['vis-dynamicLabelSize'];
const LABEL_POSITION = visOptions['vis-labelPosition'];

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
	console.log(gridHeight);

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


	const buttonExport = d3.select("#buttonsContainer").select("#export")
		.on("click", onExportClick);
	const buttonPause = d3.select("#buttonsContainer").select("#pause")
		.on("click", onPauseClick);
	const buttonRestart = d3.select("#buttonsContainer").select("#restart")
		.on("click", onRestartClick);

	slider.addEventListener("input", () => {
		numberInput.value = slider.value;
		step = parseInt(slider.value, 10);
		for (const chart of charts) {
			chart.update(step, ANIM_DURATION);
		}
	});

	numberInput.addEventListener("blur", () => {
		let value = parseInt(numberInput.value, 10);
		let min = parseInt(slider.min);
		let max = parseInt(slider.max);

		if (isNaN(value) || value < min) {
			value = min;
		} else if (value > max) {
			value = max;
		}

		slider.value = value;
		numberInput.value = value;
		step = value;

		for (const chart of charts) {
			chart.update(step, ANIM_DURATION);
		}
	});

	numberInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			numberInput.blur();
		}
	});

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

	function onExportClick() {
		const blob = new Blob([JSON.stringify(clickLog)], {type: 'application/json'});
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `SituatedVisLog_${getTimestamp()}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(a.href);
	}

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

	function startAnimation() {
		INTERVAL_ID = setInterval(animate, ANIM_DURATION + ANIM_DELAY);
	}

	function stopAnimation() {
		clearInterval(INTERVAL_ID);
	}

	function animate() {
		step++;
		slider.value = step;
		numberInput.value = step;
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