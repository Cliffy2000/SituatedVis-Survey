/**
 * 
 * Generates a chart with the given data and configuration options.
 *  
 * @param {Array} data - The data to be visualized in the chart.
 * @param {string} title - The title of the chart.
 * @param {number} [width=700] - The visible size of the overall chart.
 * @param {number} [height=400] - The visible size of the overall chart.
 * @param {number} [viewRange=10] - The amount of points visible at a time.
 * @param {number} [rollingAverage=5] - The number of points considered for the rolling average.
 * 
 * @param {boolean} [showXAxisTicks=true] - Whether to show ticks on the X-axis.
 * @param {boolean} [useThresholdColors=true] - Whether to use threshold color encoding.
 * @param {boolean} [easeInOut=false] - Whether to apply ease-in-out animation.
 * @param {boolean} [XAxisInverseStatic=false] - Whether the X-axis is inversely static.
 * @param {boolean} [backgroundEncoding=false] - Whether to use background encoding.
 * @param {boolean} [useRollingAverage=false] - Determines if the label value is using the rightmost value or the average of the last n values visible
 * @param {boolean} [gridBackgroundMove=false] - If the grid background shifts left along with the line
 * @param {boolean} [showThresholdBand=false] - Whether to show a gray band that marks the area within the min and max threshold
 * @param {boolean} [showVerticalBar=false] - Whether to show a vertical bar under the integrated label position
 * @param {string} [dynamicLabelSize="none"] - The size of the dynamic labels. Possible options: "none", "linear", "ushaped".
 * @param {string} [labelPosition="integrated"] - The position of the labels. Possible options: "integrated", "separated", "side".
 * 
 */
function generateChart(
	data,
	title,
	width = 700,
	height = 400,
	viewRange = 10,
	rollingAverage = 5,
	showXAxisTicks = true,
	useThresholdColors = true,
	easeInOut = false,
	XAxisInverseStatic = false,
	backgroundEncoding = false,
	useRollingAverage = false,
	gridBackgroundMove = false,
	showThresholdBand = false,
	showVerticalBar = false,
	dynamicLabelSize = "none",
	labelPosition = "integrated"
) {
	// this is the size of the visible chart
	let CANVAS_WIDTH = width;
	let CANVAS_HEIGHT = height;

	// this is the width on the right side of the plot for additional information
	const INFO_DEFAULT_WIDTH = 100;
	let INFO_WIDTH = (labelPosition === "side") ? INFO_DEFAULT_WIDTH : 0;

	// this is the size of the chart area
	let CHART_WIDTH = CANVAS_WIDTH - INFO_WIDTH;
	let CHART_HEIGHT = CANVAS_HEIGHT;
	const CHART_MARGIN = { top: 10, right: 15, bottom: 30, left: 35 };
	const CHART_PADDING = { top: 40, right: 20, bottom: 30, left: 40 };

	const VIEW_RANGE = viewRange;
	// const X_AXIS_RIGHT_PADDING = CHART_WIDTH * 0.05;
	const X_AXIS_LEFT_MARGIN = 0.5;
	const X_AXIS_RIGHT_MARGIN = 0.25;

	const TEXT_PADDING = { horizontal: 4, vertical: 3 };
	const TITLE_FONT_SIZE = 18;

	let TICK_FREQUENCY = 1;
	if (viewRange > 120) {
		TICK_FREQUENCY = 10;
	} else if (viewRange > 100) {
		TICK_FREQUENCY = 8;
	} else if (viewRange > 60) {
		TICK_FREQUENCY = 5;
	} else if (viewRange > 50) {
		TICK_FREQUENCY = 4;
	} else if (viewRange > 30) {
		TICK_FREQUENCY = 3;
	} else if (viewRange > 16) {
		TICK_FREQUENCY = 2;
	}

	let AXIS_TICK_SIZE = 4;
	let AXIS_FONT_SIZE = 13;

	// slightly reduce the point size so that there is sufficient space between points
	// point size is representing radius
	let POINT_SIZE = 4;
	let totalPointWidth = 2 * POINT_SIZE * viewRange;
	while (totalPointWidth > CHART_WIDTH * 0.75) {
		POINT_SIZE -= 0.2;
		totalPointWidth = 2 * POINT_SIZE * viewRange;
	}
	
	let LABEL_FONT_DEFAULT_SIZE = 17;
	let LABEL_FONT_SIZE_RANGE = [14, 40];
	let VERTICAL_BAR_WIDTH = 20;

	const MIN_THRESHOLD = 30;
	const MAX_THRESHOLD = 70;

	// this is not the exact current x index, i.e. the index value from the data file starts at index 1
	let currentIndex = 0;

	const svg = d3.create("svg")
		.attr("width", CANVAS_WIDTH)
		.attr("height", CANVAS_HEIGHT);
	
	const titleText = svg.append("text")
		.attr("x", CANVAS_WIDTH / 2)
		.attr("y", CHART_PADDING.top / 2)
		.attr("dy", "-0.4em")	// makes sure the alignment is working on the vertical center
		.attr("text-anchor", "middle")
		.attr("dominant-baseline", "hanging")
		.attr("font-size", `${TITLE_FONT_SIZE}px`)
		.text(title);

	const movableChartClipPath = svg.append("clipPath")
		.attr("id", "movableChartClipPath")
		.append("rect")
		.attr("x", CHART_PADDING.left)
		.attr("y", 0)
		.attr("width", CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right)
		.attr("height", CHART_HEIGHT)
		.attr("fill", "white");
	
	const xAxisInverseStaticClipPath = svg.append("clipPath")
		.attr("id", "xAxisInverseStaticClipPath")
		.append("rect")
		.attr("x", CHART_PADDING.left - 10)
		.attr("y", 0)
		.attr("width", CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right + 10)
		.attr("height", CHART_HEIGHT)
		.attr("fill", "white");

	// The movableChartGroup and its wrapping container contains all the element that is moving in sync with the line in the chart.
	// This includes the line, points and the gridBackgound and xAxis if they are set to move. 
	// The container is necessary for the clipPath to work properly on the group. 
	const movableChartGroupContainer = svg.append("g")
		.attr("clip-path", "url(#movableChartClipPath)");
	const movableChartGroup = movableChartGroupContainer.append("g");

	// Calculates the actual positional range of the x axis based on the viewRange and the CHART_WIDTH
	const x = d3.scaleLinear()
		.domain([1 - X_AXIS_LEFT_MARGIN, data.length + X_AXIS_RIGHT_MARGIN])
		.range([CHART_PADDING.left, ((CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right) / (viewRange - X_AXIS_LEFT_MARGIN + X_AXIS_RIGHT_MARGIN)) * (data.length - X_AXIS_LEFT_MARGIN + X_AXIS_RIGHT_MARGIN) + CHART_PADDING.left]);

	// The horizontal distance between two ticks on the x axis
	const tickGap = (x.range()[1] - x.range()[0]) / (data.length - X_AXIS_LEFT_MARGIN + X_AXIS_RIGHT_MARGIN);

	const xAxis = customXAxis(x);
	let xAxisGroup;
	if (XAxisInverseStatic) {
		xAxisGroup = svg.append("g")
		.attr("transform", `translate(0, ${CHART_HEIGHT - CHART_PADDING.bottom})`)
		.call(xAxis)
		.attr("clip-path", "url(#xAxisInverseStaticClipPath)");
	} else {
		xAxisGroup = movableChartGroup.append("g")
		.attr("transform", `translate(0, ${CHART_HEIGHT - CHART_PADDING.bottom})`)
		.call(xAxis);
	}

	const y = d3.scaleLinear()
		.domain([0, 100])
		.range([CHART_HEIGHT - CHART_PADDING.bottom, CHART_PADDING.top]);
	
	const yAxis = d3.axisLeft(y)
		.tickSizeInner(AXIS_TICK_SIZE);
	const yAxisGroup = svg.append("g")
		.attr("transform", `translate(${CHART_PADDING.left}, 0)`)
		.call(yAxis);
	yAxisGroup.selectAll(".tick text")
		.style("fill", "gray")
		.style("font-size", AXIS_FONT_SIZE);

	// gridGroup is for the light gray grid background
	const gridGroup = (gridBackgroundMove ? movableChartGroup : svg).insert("g", ":first-child");

	gridGroup.selectAll(".horizontal-line")
		.data(y.ticks())
		.join("line")
		.attr("class", "horizontal-line")
		.attr("x1", CHART_PADDING.left)
		.attr("x2", CHART_WIDTH - CHART_PADDING.right + (gridBackgroundMove ? (tickGap * (data.length - 1)) : 0))
		.attr("y1", d => y(d))
		.attr("y2", d => y(d))
		.attr("stroke", "#eee");

	let verticalLineData = d3.range(1, data.length + 1, TICK_FREQUENCY);
	if (XAxisInverseStatic) {
		verticalLineData = d3.range(viewRange % TICK_FREQUENCY || TICK_FREQUENCY, data.length + 1, TICK_FREQUENCY);
	}

	if (!gridBackgroundMove) {
		verticalLineData = verticalLineData.slice(0, Math.ceil(viewRange / TICK_FREQUENCY));
	}

	gridGroup.selectAll(".vertical-line")
		.data(verticalLineData)
		.join("line")
		.attr("class", "vertical-line")
		.attr("x1", d => x(d))
		.attr("x2", d => x(d))
		.attr("y1", CHART_PADDING.top)
		.attr("y2", CHART_HEIGHT - CHART_PADDING.bottom)
		.attr("stroke", "#eee")
		.style("z-index", -1);
	
	const lines = movableChartGroup.append("path")
		.datum(data)
		.attr("stroke", "#8C8C8C")
		.attr("stroke-width", 1.5)
		.attr("fill", "none")
		.attr("d", d3.line()
			.x(d => x(d.index))
			.y(d => y(d.value))
		);

	const points = movableChartGroup.append("g")
		.selectAll("dot")
		.data(data)
		.enter()
		.append("circle")
		.attr("cx", d => x(d.index))
		.attr("cy", d => y(d.value))
		.attr("r", POINT_SIZE)
		.attr("fill", d => getThresholdColor(d.value));

	if (showThresholdBand) {
		let thresholdBand;
		if (gridBackgroundMove) {
			thresholdBand = movableChartGroup.insert("rect", () => lines.node())
				.attr("x", x(0))
				.attr("y", y(MAX_THRESHOLD))
				.attr("width", x(data.length) - x(0))
				.attr("height", y(MIN_THRESHOLD) - y(MAX_THRESHOLD))
				.attr("fill", "gray")
		} else {
			thresholdBand = svg.insert("rect", () => movableChartGroupContainer.node())
				.attr("x", CHART_PADDING.left)
				.attr("y", y(MAX_THRESHOLD))
				.attr("width", CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right)
				.attr("height", y(MIN_THRESHOLD) - y(MAX_THRESHOLD))
				.attr("fill", "gray")
		}
		thresholdBand.attr("fill", "gray")
			.attr("opacity", 0.15)
	}

	
	let rightPoint = data[currentIndex + viewRange - 1];
	let average = Math.round(d3.mean(
		data.slice(currentIndex + viewRange - rollingAverage + 1, currentIndex + viewRange + 1), 
		d => d.value
	));
	let labelValue = useRollingAverage ? average : rightPoint.value;
	let labelXPos = x(rightPoint.index);
	let labelYPos = y(labelValue);

	let verticalBar;
	if (showVerticalBar) {
		verticalBar = svg.insert("rect")
			.attr("x", labelXPos - Math.min(tickGap / 2, VERTICAL_BAR_WIDTH) / 2)
			.attr("y", labelYPos)
			.attr("width", Math.min(tickGap / 2, VERTICAL_BAR_WIDTH))
			.attr("height", y(0) - labelYPos)
			.attr("fill", getThresholdColor(labelValue))
	}


	if (labelPosition === "side") {
		// TODO: dynamic spacing
		labelXPos = CHART_WIDTH + INFO_WIDTH / 2 - 10;
		labelYPos = CHART_HEIGHT / 1.85;
	} else if (labelPosition === "separated") {
		labelYPos = y.range()[1] - 10;
	}

	const labelGroup = svg.append("g")
		.attr("transform", `translate(${labelXPos}, ${labelYPos})`);
		
	const linearFontSizeScale = d3.scaleLinear()
		.domain(y.domain())
		.range([LABEL_FONT_SIZE_RANGE[0], LABEL_FONT_SIZE_RANGE[1]]);
	
	// Font size scale when linear scale and side position
	const linearSizeFontSizeScale = d3.scaleLinear()
		.domain(y.domain())
		.range([20, 84]);

	const ushapedFontSizeScale = d3.scaleLinear()
		.domain([y.domain()[0], (y.domain()[0] + y.domain()[1]) / 2, y.domain()[1]])
		.range([LABEL_FONT_SIZE_RANGE[1], LABEL_FONT_SIZE_RANGE[0], LABEL_FONT_SIZE_RANGE[1]]);
	
	const labelText = labelGroup.append("text")
		.text(labelValue)
		.attr("text-anchor", "middle")
		.attr("dominant-baseline", "middle")
		.style("font-family", "sans-serif")
		.style("font-size", getDynamicFontSize(labelValue))
		.style("fill", labelPosition === "side" ? getSideFontColor(labelValue) : "white");
	
	// adjust the position of the label to match its value
	if (labelPosition !== "side") {
		labelText.transition()
			.duration(0)
			.on("end", function () {
				const textBBox = d3.select(this).node().getBBox();

				labelGroup.insert("rect", "text")
					.attr("x", textBBox.x - TEXT_PADDING.horizontal)
					.attr("y", textBBox.y - TEXT_PADDING.vertical)
					.attr("width", textBBox.width + 2 * TEXT_PADDING.horizontal)
					.attr("height", textBBox.height + 2 * TEXT_PADDING.vertical)
					.attr("fill", getThresholdColor(labelValue))
					.attr("rx", 3)
					.attr("ry", 3);
			});
	}


	function update(step, animTime) {
		currentIndex = step - 1;
		
		const anim = d3.transition("transmove").duration(animTime);
		if (easeInOut) {
			anim.ease(d3.easePoly.exponent(3));
		}

		rightPoint = data[currentIndex + viewRange - 1];
		average = Math.round(d3.mean(
			data.slice(currentIndex + viewRange - rollingAverage + 1, currentIndex + viewRange + 1), 
			d => d.value
		));
		labelValue = useRollingAverage ? average : rightPoint.value;

		movableChartGroup.transition(anim)
			.attr("transform", `translate(${-tickGap * currentIndex}, 0)`);


		if (showVerticalBar) {
			verticalBar.transition(anim)
				.attr("y", y(labelValue))
				.attr("height", y(0) - y(labelValue))
				.attr("fill", getThresholdColor(labelValue))
		}
				
		if (labelPosition === "integrated") {
			labelGroup.transition(anim).attr("transform", `translate(${labelXPos}, ${y(labelValue)})`);
		}
		
		labelText.text(labelValue)
			.style("font-size", getDynamicFontSize(labelValue));
		
		const textBBox = labelText.node().getBBox();
		labelGroup.transition(anim).select("rect")
			.attr("x", textBBox.x - TEXT_PADDING.horizontal)
			.attr("y", textBBox.y - TEXT_PADDING.vertical)
			.attr("width", textBBox.width + 2 * TEXT_PADDING.horizontal)
			.attr("height", textBBox.height + 2 * TEXT_PADDING.vertical)
			.attr("fill", getThresholdColor(labelValue));
		
		if (labelPosition === "side") {
			labelText.style("fill", getSideFontColor(labelValue));
		}
	}

	function resize() {

	}

	function customXAxis(scale) {
		let tickVals = d3.range(1, data.length + 1, TICK_FREQUENCY);
		if (XAxisInverseStatic) {
			tickVals = d3.range(viewRange % TICK_FREQUENCY || TICK_FREQUENCY, viewRange + 1, TICK_FREQUENCY);
		}

		const axis = d3.axisBottom(scale)
			.tickValues(tickVals)
			.tickFormat(showXAxisTicks ? d3.format("d") : "")
			.tickSizeInner(showXAxisTicks ? AXIS_TICK_SIZE : 0);

		if (XAxisInverseStatic) {
			axis.tickFormat(showXAxisTicks ? (d, i) => (d - viewRange) : "");
		}

		return function (selection) {
			selection.call(axis);

			// This portion of the code uses regular expressions to remove the right outer tick of the x axis
			// selection.selectAll(".domain")
			// 	.attr("d", d => {
			// 		const old = d3.select(selection.node()).select(".domain").attr("d");
			// 		return old.replace(/V-?\d+(\.\d+)?$/, "");
			// 	});

			selection.selectAll(".tick text")
				.style("fill", "gray")
				.style("font-size", AXIS_FONT_SIZE);
		};
	}

	function getThresholdColor(n) {
		if (!useThresholdColors) {
			return "#8C8C8C";
		}

		if (n > MAX_THRESHOLD) {
			return "#FF7F50";
		} else if (n < MIN_THRESHOLD) {
			return "#00B2EE";
		} else {
			return "#8C8C8C";
		}
	}

	function getBackgroundColor(n) {
		if (!backgroundEncoding) {
			return "white";
		}

		if (n > MAX_THRESHOLD) {
			return "#FFBFA8";
		} else if (n < MIN_THRESHOLD) {
			return "#80D9F7";
		} else {
			return "white";
		}
	}

	function getDynamicFontSize(n) {
		// u shaped side scaling is disabled
		if (labelPosition === "side") {
			if (dynamicLabelSize === "linear") {
				return `${linearSizeFontSizeScale(n)}px`;
			} else {
				return `64px`;
			}
		}

		if (dynamicLabelSize === "none") {
			return `${LABEL_FONT_DEFAULT_SIZE}px`;
		} else if (dynamicLabelSize === "linear") {
			return `${linearFontSizeScale(n)}px`;
		} else if (dynamicLabelSize === "ushaped") {
			return `${ushapedFontSizeScale(n)}px`;
		}
	}

	function getSideFontColor(n) {
		if (!useThresholdColors) {
			return "#121212";
		}

		if (n > MAX_THRESHOLD) {
			return "#FF7F50";
		} else if (n < MIN_THRESHOLD) {
			return "#00B2EE";
		} else {
			return "#121212";
		}
	}
	
	Object.assign(svg.node(), { update, resize });
	return svg.node();
}