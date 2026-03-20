/** This is for d3.js intelliSense */
/** @type {import("d3")} */

	
let stop;

window.dashboardInit = function() {
	// Replace the URL parameter reading with:
	const setupIndex = parseInt(sessionStorage.getItem("SituatedVisCurrentIndex") || "0");

	// Get config from storage
	const config = JSON.parse(sessionStorage.getItem('SituatedVisConfig'));
	if (!config || setupIndex >= config.length) {
		// Invalid state, redirect to start
		sessionStorage.clear();
		window.navigateToHome();
	}

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
	const QUESTION_TIME = currentSetup['questionTime'] || 15;

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
	let currentQuestionStep = null;

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
		let wrapperRatio = LABEL_POSITION === "side" ? 1.0 : 0.8;
		let cellWidth = (gridWidth / COLS) * wrapperRatio;
		let cellHeight = gridHeight / ROWS;

		const wrapperClass = LABEL_POSITION === "side" ? "chart-wrapper chart-wrapper-side" : "chart-wrapper chart-wrapper-integrated";

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
			.append("div")
				.attr("class", wrapperClass)
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
		let activeQuestions = []; // track shown but unanswered questions

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
			const machineOptions = question.area === "machine";
			const useGrid = question.options.length === selectedFiles.length && selectedFiles.length > 3;
			
			// Check if this is a "find 3" question (checkbox + grid)
			const isFind3Question = question.type === 'checkbox' && useGrid;
			
			// Record when question is shown
			const questionStartTime = Date.now();

			// Track this question as active
			activeQuestions.push({
				id: question.id,
				startTime: questionStartTime,
				step: step
			});
			
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
						if (checkedCount === 3) {
							checkboxes.forEach(cb => {
								if (!cb.checked) cb.disabled = true;
							});
							submitButton.disabled = false;
						} else {
							checkboxes.forEach(cb => cb.disabled = false);
							submitButton.disabled = true;
						}
					} else {
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
							responseTimeMs: responseTime,
							answered: true,
							questionStep: step,
							timestamp: new Date().toISOString()
						};
					}
				} else if (question.type === 'checkbox') {
					const selected = Array.from(optionsContainer.querySelectorAll(`input[name="${question.id}"]:checked`))
						.map(cb => cb.value);
					questionResponses[question.id] = {
						response: selected,
						responseTimeMs: responseTime,
						answered: true,
						questionStep: step,
						timestamp: new Date().toISOString()
					};
				}
				
				// Remove from active tracking
				activeQuestions = activeQuestions.filter(q => q.id !== question.id);
				
				// Disable submit after clicking
				submitButton.disabled = true;
				submitButton.textContent = 'Submitted';
				
				// Disable all inputs for this question
				optionsContainer.querySelectorAll('input').forEach(input => input.disabled = true);
			});
		}

		// Record unanswered questions when they get cleared
		function recordUnanswered() {
			for (const aq of activeQuestions) {
				if (!questionResponses[aq.id]) {
					questionResponses[aq.id] = {
						response: null,
						responseTimeMs: QUESTION_TIME * (ANIM_DURATION + ANIM_DELAY),
						answered: false,
						questionStep: aq.step,
						timestamp: new Date().toISOString()
					};
				}
			}
			activeQuestions = [];
		}

		const buttonNext = d3.select("#buttonContainer").select("#nextButton")
			.on("click", onNextClick);
		
		function onNextClick() {
			// Stop animation
			stopAnimation();
			
			// Build per-trial export
			const timestamp = new Date().toISOString();

			const trialQuestions = (currentSetup['questions'] || [])
				.filter(q => q.type !== 'clear')
				.map(q => ({ id: q.id, step: q.step }));
			
			const trialData = {
				trialNumber: currentSetup['trialNumber'],
				trialIndex: setupIndex,
				filesetIndex: currentSetup['filesetIndex'],
				questionOrder: currentSetup['questionOrder'],
				questionPlacements: trialQuestions,
				responses: questionResponses,
				timestamp: timestamp
			};

			// Accumulate trial data in sessionStorage
			const accumulated = JSON.parse(sessionStorage.getItem('SituatedVisTrialResults') || '[]');
			accumulated.push(trialData);
			sessionStorage.setItem('SituatedVisTrialResults', JSON.stringify(accumulated));

			const nextIndex = setupIndex + 1;
			if (nextIndex < config.length) {
				// More trials remaining — go to next
				sessionStorage.setItem('SituatedVisCurrentIndex', String(nextIndex));
				setTimeout(() => {
					window.navigateToHome();
				}, 100);
			} else {
				// All 6 trials completed — save everything at once, then redirect
				const userName = sessionStorage.getItem('username') || 'Unknown';
				const fullExport = {
					metadata: {
						prolificId: userName,
						designIndex: currentSetup['designIndex'],
						questionMapping: JSON.parse(sessionStorage.getItem('questionMapping') || '[]'),
						timestamp: new Date().toISOString(),
						type: 'survey',
						browser: {
							windowWidth: window.innerWidth,
							windowHeight: window.innerHeight,
							screenWidth: screen.width,
							screenHeight: screen.height,
							devicePixelRatio: window.devicePixelRatio || 1,
							userAgent: navigator.userAgent
						}
					},
					trials: accumulated
				};

				saveUserData(fullExport).then(success => {
					if (success) {
						console.log('All trial data saved to cloud database');
					} else {
						console.log('Failed to save to cloud');
					}
					// Clear accumulated results
					sessionStorage.removeItem('SituatedVisTrialResults');
					showCompletionOverlay();
				});
			}
		}

		function showCompletionOverlay() {
			const demographicsUrl = 'https://cliffy2000.github.io/SituatedVis-Portal/demographics.html';

			const overlay = document.createElement('div');
			overlay.id = 'completion-overlay';
			overlay.innerHTML = `
				<div class="completion-box">
					<div class="completion-icon">✓</div>
					<h2 class="completion-heading">All Trials Completed!</h2>
					<p class="completion-message">Thank you for participating. You will now be redirected to a short demographics survey.</p>
					<p class="completion-countdown">Redirecting in 5 seconds...</p>
					<button class="completion-button">Continue Now</button>
				</div>
			`;

			document.body.appendChild(overlay);

			overlay.querySelector('.completion-button').addEventListener('click', () => {
				sessionStorage.clear();
				window.location.href = demographicsUrl;
			});

			let seconds = 5;
			const countdown = overlay.querySelector('.completion-countdown');
			const timer = setInterval(() => {
				seconds--;
				if (seconds <= 0) {
					clearInterval(timer);
					sessionStorage.clear();
					window.location.href = demographicsUrl;
				} else {
					countdown.textContent = `Redirecting in ${seconds} second${seconds !== 1 ? 's' : ''}...`;
				}
			}, 1000);
		}

		function startAnimation() {
			INTERVAL_ID = setInterval(animate, ANIM_DURATION + ANIM_DELAY);
		}

		function stopAnimation() {
			clearInterval(INTERVAL_ID);
		}

		stop = stopAnimation;

		function playSound() {
			const audio = new Audio('beep.mp3');
			audio.volume = 0.1;
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
				// Record any unanswered questions before clearing
				recordUnanswered();

				// Clear the question container
				const container = document.getElementById('questionContainer');
				if (container) {
					container.innerHTML = '';
				}

				const realQuestions = questionsAtCurrentStep.filter(q => q.type !== 'clear');
				
				if (realQuestions.length > 0) {
					currentQuestionStep = step;
					realQuestions.forEach((question, index) => {
						showQuestion(question);
					});
					const timerEl = document.getElementById('questionTimer');
					if (timerEl) timerEl.textContent = QUESTION_TIME - 1;
				} else {
					currentQuestionStep = null;
					const timerEl = document.getElementById('questionTimer');
					if (timerEl) timerEl.textContent = '';
				}
			}

			// Update timer
			if (currentQuestionStep !== null) {
				const remaining = QUESTION_TIME - 1 - (step - currentQuestionStep);
				const timerEl = document.getElementById('questionTimer');
				if (timerEl && remaining >= 0) timerEl.textContent = remaining;
			}
			
			if (soundSteps.includes(step)) {
				playSound();
			}
			
			for (let chart of charts) {
				chart.update(step, ANIM_DURATION);
			}

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
}