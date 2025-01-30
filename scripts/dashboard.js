/** This is for d3.js intelliSense */
/** @type {import("d3")} */

const selectedFiles = JSON.parse(sessionStorage.getItem('SituatedVisSelectedFiles')) || [];

const displaySliders = JSON.parse(sessionStorage.getItem('SituatedVisDisplaySliders')) || {};
const ROWS = parseInt(displaySliders['num-rows']);
const COLS = parseInt(displaySliders['num-columns']);
const ANIM_DURATION = parseInt(displaySliders['anim-duration']);
const ANIM_DELAY = parseInt(displaySliders['anim-delay']);
const POINTS = parseInt(displaySliders['num-points']);

const visOptions = JSON.parse(sessionStorage.getItem('visualizationOptions')) || {};
const SHOW_X_AXIS = visOptions['vis-showXAxis'];
const SHOW_THRESHOLD = visOptions['vis-showThreshold'];
const DYNAMIC_LABEL_SIZE = visOptions['vis-dynamicLabelSize'];

// ==== 
const slider = document.getElementById("window-slider");
const numberInput = document.getElementById("window-slider-value");

function updateSliderMax(newMax) {
	slider.max = newMax;
	numberInput.max = newMax;
}

Promise.all(selectedFiles.map(file => d3.csv(`/data/${file}`, d3.autoType))).then((datasets) => {

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
		.append(([data, title]) => generateChart(data = data, title = title, width = cellWidth, height = cellHeight, cols = POINTS, showXAxis = SHOW_X_AXIS, showThreshold = SHOW_THRESHOLD, dynamicLabelSize = DYNAMIC_LABEL_SIZE))
		.nodes();


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
		onPauseClick();
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
		onPauseClick();
	});

	numberInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			numberInput.blur();
		}
	});

	function onPauseClick() {
		if (flag_running) {
			stopAnimation();
			buttonPause.text("Unpause");
		} else {
			animate();
			startAnimation();
			buttonPause.text("Pause");
		}
		flag_running = !flag_running;
	}

	function onRestartClick() {
		stopAnimation();
		step = 0;
		for (const chart of charts) {
			chart.update(step, ANIM_DURATION);
		}
		if (flag_running) {
			animate();
			startAnimation();
		}
	}

	function startAnimation() {
		INTERVAL_ID = setInterval(animate, ANIM_DELAY);
	}

	function stopAnimation() {
		clearInterval(INTERVAL_ID);
	}

	function animate() {
		for (let chart of charts) {
			chart.update(step, ANIM_DURATION);
		}
		step++;
		updateSliderMax(step);
		slider.value = step;
		numberInput.value = step;
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