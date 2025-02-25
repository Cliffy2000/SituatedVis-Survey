/**
 * ==========================================
 * DEPRECATED due to animation issues on axis
 * ==========================================
 * 
 * Generates a chart with the given data and configuration options.
 *
 * @param {Array} data - The data to be visualized in the chart.
 * @param {string} title - The title of the chart.
 * @param {number} [width=700] - The overall width of the chart.
 * @param {number} [height=400] - The overall height of the chart.
 * @param {number} [pointCount=10] - The number of columns (visible points) in the plot.
 * @param {boolean} [showXAxisTicks=true] - Whether to show ticks on the X-axis.
 * @param {boolean} [showThreshold=true] - Whether to show threshold lines.
 * @param {boolean} [easeInOut=false] - Whether to apply ease-in-out animation.
 * @param {boolean} [XAxisInverseStatic=false] - Whether the X-axis is inversely static.
 * @param {boolean} [backgroundEncoding=false] - Whether to use background encoding.
 * @param {string} [dynamicLabelSize="none"] - The size of the dynamic labels. Possible options: "none", "linear", "ushaped".
 * @param {string} [labelPosition="follow"] - The position of the labels. Possible options: "follow", "fixed", "side".
 */
function generateChart(data, title, width = 700, height = 400, pointCount = 10, showXAxisTicks = true, showThreshold = true, easeInOut = false, XAxisInverseStatic = false, backgroundEncoding = false, dynamicLabelSize = "none", labelPosition = "follow") {
	// This is the overall size of the entire canvas
	let TOTAL_WIDTH = width;
	let TOTAL_HEIGHT = height;
	// If there is anything to show on the side of the chart
	const INFO_DEFAULT_WIDTH = 150;
	
	let INFO_WIDTH = (labelPosition === "side") ? INFO_DEFAULT_WIDTH : 0;
	// Plot is the chart image
	let PLOT_WIDTH = TOTAL_WIDTH - INFO_WIDTH;
	let PLOT_HEIGHT = TOTAL_HEIGHT;

	const MARGIN = { top: 35, right: 15, bottom: 30, left: 35 };
	const TEXT_PADDING = { horizontal: 4, vertical: 3 };

	const POINTS = pointCount;
	const OFFSET = 0.5;
	const X_AXIS_TAIL = (labelPosition === "side") ? 0.4 : 0.6;
	const AXIS_TICK_SIZE = 4;

	const FONT_SIZE_DEFAULT = 14;
	const FONT_RANGE = [8, 24];
	let POINT_SIZE = 4;
	let AXIS_FONT_SIZE = 10;

	const MIN_THRESHOLD = 30;
	const MAX_THRESHOLD = 70;

	if (POINTS > 50) {
		POINT_SIZE = 2.5;
		AXIS_FONT_SIZE = 7;
	} else if (POINTS > 20) {
		POINT_SIZE = 3;
		AXIS_FONT_SIZE = 8;
	}

	const svg = d3.create("svg")
		.attr("width", TOTAL_WIDTH)
		.attr("height", TOTAL_HEIGHT);

	const lineChart = svg.append("g");

	const titleText = svg.append("text")
		.attr("x", PLOT_WIDTH / 2)
		.attr("y", 15)
		.attr("text-anchor", "middle")
		.attr("dominant-baseline", "hanging")
		.attr("font-family", "sans-serif")
		.attr("font-size", "16px")
		.text(title);

	const x = d3.scaleLinear()
		.domain([OFFSET, POINTS + OFFSET + X_AXIS_TAIL])
		.range([MARGIN.left, PLOT_WIDTH - MARGIN.right]);

	const y = d3.scaleLinear()
		.domain([0, 100])
		.range([PLOT_HEIGHT - MARGIN.bottom, MARGIN.top]);

	const xAxis = customAxisBottom(x);
	const xAxisGroup = svg.append("g")
		.attr("transform", `translate(0,${PLOT_HEIGHT - MARGIN.bottom})`)
		.call(xAxis);

	// Remove the ending tick on the axis
	const xAxisPath = xAxisGroup.select(".domain");
	const originalD = xAxisPath.attr("d");
	const newD = originalD.replace(/V-?\d+(\.\d+)?$/, "");
	xAxisPath.attr("d", newD);

	const yAxis = d3.axisLeft(y)
		.tickSizeInner(AXIS_TICK_SIZE);
	const yAxisGroup = svg.append("g")
		.attr("transform", `translate(${MARGIN.left},0)`)
		.call(yAxis);

	yAxisGroup.selectAll(".tick text")
		.style("fill", "gray")
		.style("font-size", AXIS_FONT_SIZE);

	let tickValues = xAxisGroup.selectAll(".tick").data();
	let lastTickValue = tickValues[tickValues.length - 1];
	let rightPoint = data[lastTickValue - 1];

	const backgroundRect = svg.insert("rect", ":first-child")
		.attr("x", MARGIN.left)
		.attr("y", MARGIN.top)
		.attr("width", PLOT_WIDTH - MARGIN.left - MARGIN.right)
		.attr("height", PLOT_HEIGHT - MARGIN.top - MARGIN.bottom)
		.attr("fill", getBackgroundColor(rightPoint.value));


	const gridGroup = svg.insert("g", ":nth-child(2)").attr("class", "grid");

	gridGroup.selectAll(".horizontal-line")
		.data(y.ticks())
		.join("line")
		.attr("class", "horizontal-line")
		.attr("x1", MARGIN.left)
		.attr("x2", PLOT_WIDTH - MARGIN.right)
		.attr("y1", d => y(d))
		.attr("y2", d => y(d))
		.attr("stroke", "#eee")
		.style("z-index", -1);

	gridGroup.selectAll(".vertical-line")
		.data(x.ticks(POINTS).slice(0, POINTS))
		.join("line")
		.attr("class", "vertical-line")
		.attr("x1", d => x(d))
		.attr("x2", d => x(d))
		.attr("y1", MARGIN.top)
		.attr("y2", PLOT_HEIGHT - MARGIN.bottom)
		.attr("stroke", "#eee")
		.style("z-index", -1);

	let verticalGap = x(1) - x(0);

	const clipPath = svg.append("clipPath")
		.attr("id", "chartClipPath")
		.append("rect")
		.attr("x", MARGIN.left + (verticalGap) / 2 - POINT_SIZE)
		.attr("y", MARGIN.top)
		.attr("width", verticalGap * (POINTS - 1) + POINT_SIZE * 2)
		.attr("height", PLOT_HEIGHT - MARGIN.top - MARGIN.bottom)
		.attr("fill", "white");

	const lines = lineChart.append("path")
		.datum(data)
		.attr("stroke", "#8C8C8C")
		.attr("stroke-width", 1.5)
		.attr("fill", "none")
		.attr("d", d3.line()
			.x(d => x(d.index))
			.y(d => y(d.value))
		)
		.attr("clip-path", "url(#chartClipPath)");

	const points = lineChart.append("g")
		.selectAll("dot")
		.data(data)
		.enter()
		.append("circle")
		.attr("cx", d => x(d.index))
		.attr("cy", d => y(d.value))
		.attr("r", POINT_SIZE)
		.attr("fill", d => getThresholdColor(d.value))
		.attr("clip-path", "url(#chartClipPath)");


	// Label in the line chart
	let labelXPos = x(rightPoint.index);
	let labelYPos = y((y.domain()[0] + y.domain()[1]) / 2);

	if (labelPosition === "side") {
		labelXPos = PLOT_WIDTH + INFO_WIDTH / 2;
		labelYPos = TOTAL_HEIGHT / 1.9;
	} else if (labelPosition === "fixed") {
		labelYPos = y.range()[1] - 10;
	}

	const labelGroup = lineChart.append("g")
		.attr("transform", `translate(${labelXPos}, ${labelYPos})`);

	const linearFontSizeScale = d3.scaleLinear()
		.domain(y.domain())
		.range([FONT_RANGE[0], FONT_RANGE[1]]);

	const ushapedFontSizeScale = d3.scaleLinear()
		.domain([y.domain()[0], (y.domain()[0] + y.domain()[1]) / 2, y.domain()[1]])
		.range([FONT_RANGE[1], FONT_RANGE[0], FONT_RANGE[1]]);

	const labelText = labelGroup.append("text")
		.text(rightPoint.value)
		.attr("text-anchor", "middle")
		.attr("dominant-baseline", "middle")
		.style("font-family", "sans-serif")
		.style("font-size", getDynamicFontSize(rightPoint.value))
		.style("fill", "white");
	
	if (labelPosition === "side") {
		labelText.style("fill", "black");
	} else {
		labelText.transition()
			.duration(0)
			.on("end", function () {
				const textBBox = d3.select(this).node().getBBox();

				labelGroup.insert("rect", "text")
					.attr("x", textBBox.x - TEXT_PADDING.horizontal)
					.attr("y", textBBox.y - TEXT_PADDING.vertical)
					.attr("width", textBBox.width + 2 * TEXT_PADDING.horizontal)
					.attr("height", textBBox.height + 2 * TEXT_PADDING.vertical)
					.attr("fill", getThresholdColor(rightPoint.value))
					.attr("rx", 3)
					.attr("ry", 3);
			});
	}


	function update(step, animTime) {
		// TODO
		// Limit ending index
		startIndex = step - 1;

		if (startIndex + POINTS > data.length) {
			return -1;
		}

		x.domain([OFFSET + startIndex, POINTS + OFFSET + startIndex + X_AXIS_TAIL]);

		const anim = d3.transition("transmove").duration(animTime);
		if (easeInOut) {
			anim.ease(d3.easePoly.exponent(3));
		}

		lastTickValue = startIndex + POINTS;
		rightPoint = data[lastTickValue - 1];

		backgroundRect.attr("fill", getBackgroundColor(rightPoint.value));

		lines.transition(anim)
			.attr("d", d3.line()
				.x(d => x(d.index))
				.y(d => y(d.value))
			)
		points.transition(anim)
			.attr("cx", d => x(d.index));

		if (!XAxisInverseStatic) {
			const newXAxis = customAxisBottom(x, startIndex + 1);
			xAxisGroup.transition(anim).call(newXAxis);
		}

		if (labelPosition === "follow") {
			labelGroup.transition(anim).attr("transform", `translate(${x(rightPoint.index)}, ${y(rightPoint.value)})`);
		}
		labelText.text(rightPoint.value)
			.style("font-size", getDynamicFontSize(rightPoint.value));

		const textBBox = labelText.node().getBBox();
		labelGroup.transition(anim).select("rect")
			.attr("x", textBBox.x - TEXT_PADDING.horizontal)
			.attr("y", textBBox.y - TEXT_PADDING.vertical)
			.attr("width", textBBox.width + 2 * TEXT_PADDING.horizontal)
			.attr("height", textBBox.height + 2 * TEXT_PADDING.vertical)
			.attr("fill", getThresholdColor(rightPoint.value));
		
		return 1;
	}


	function resize(newWidth, newHeight) {
		TOTAL_WIDTH = newWidth;
		TOTAL_HEIGHT = newHeight;

		INFO_WIDTH = (labelPosition === "side") ? INFO_DEFAULT_WIDTH : 0;
		PLOT_WIDTH = TOTAL_WIDTH - INFO_WIDTH;
		PLOT_HEIGHT = TOTAL_HEIGHT;

		svg.attr("width", PLOT_WIDTH)
			.attr("height", PLOT_HEIGHT);

		x.range([MARGIN.left, PLOT_WIDTH - MARGIN.right]);
		y.range([PLOT_HEIGHT - MARGIN.bottom, MARGIN.top]);

		xAxisGroup.attr("transform", `translate(0,${PLOT_HEIGHT - MARGIN.bottom})`)
			.call(xAxis);
		yAxisGroup.attr("transform", `translate(${MARGIN.left},0)`)
			.call(yAxis);

		titleText.attr("x", PLOT_WIDTH / 2);

		backgroundRect.attr("x", MARGIN.left)
			.attr("y", MARGIN.top)
			.attr("width", PLOT_WIDTH - MARGIN.left - MARGIN.right)
			.attr("height", PLOT_HEIGHT - MARGIN.top - MARGIN.bottom)

		gridGroup.selectAll(".horizontal-line")
			.data(y.ticks())
			.join("line")
			.attr("class", "horizontal-line")
			.attr("x1", MARGIN.left)
			.attr("x2", PLOT_WIDTH - MARGIN.right)
			.attr("y1", d => y(d))
			.attr("y2", d => y(d))
			.attr("stroke", "#eee")
			.style("z-index", -1);

		gridGroup.selectAll(".vertical-line")
			.data(x.ticks(POINTS).slice(0, POINTS))
			.join("line")
			.attr("class", "vertical-line")
			.attr("x1", d => x(d))
			.attr("x2", d => x(d))
			.attr("y1", MARGIN.top)
			.attr("y2", PLOT_HEIGHT - MARGIN.bottom)
			.attr("stroke", "#eee")
			.style("z-index", -1);

		verticalGap = x(1) - x(0);

		clipPath.attr("x", MARGIN.left + (verticalGap) / 2 - POINT_SIZE)
			.attr("y", MARGIN.top)
			.attr("width", verticalGap * (POINTS - 1) + POINT_SIZE * 2)
			.attr("height", PLOT_HEIGHT - MARGIN.top - MARGIN.bottom);

		lines.attr("stroke", "#8C8C8C")
			.attr("stroke-width", 1.5)
			.attr("fill", "none")
			.attr("d", d3.line()
				.x(d => x(d.index))
				.y(d => y(d.value))
			)
			.attr("clip-path", "url(#chartClipPath)");

		points.attr("cx", d => x(d.index))
			.attr("cy", d => y(d.value))
			.attr("r", POINT_SIZE)
			.attr("fill", d => getThresholdColor(d.value))
			.attr("clip-path", "url(#chartClipPath)");


		const tickValues = xAxisGroup.selectAll(".tick").data();
		const lastTickValue = tickValues[tickValues.length - 1];
		const rightPoint = data[lastTickValue - 1];

		//
		let newLabelXPos = x(rightPoint.index);
		let newLabelYPos = y((y.domain()[0] + y.domain()[1]) / 2);
	
		if (labelPosition === "side") {
			newLabelXPos = PLOT_WIDTH + INFO_WIDTH / 2;
			newLabelYPos = TOTAL_HEIGHT / 1.9;
		} else if (labelPosition === "fixed") {
			newLabelYPos = y.range()[1] - 10;
		}

		labelGroup.attr("transform", `translate(${newLabelXPos}, ${newLabelYPos})`);

		const textBBox = labelText.node().getBBox();
		labelGroup.select("rect")
			.attr("x", textBBox.x - TEXT_PADDING.horizontal)
			.attr("y", textBBox.y - TEXT_PADDING.vertical)
			.attr("width", textBBox.width + 2 * TEXT_PADDING.horizontal)
			.attr("height", textBBox.height + 2 * TEXT_PADDING.vertical);
	}

	Object.assign(svg.node(), { update, resize });
	return svg.node();

	function customAxisBottom(scale, startX = 1) {
		const axis = d3.axisBottom(scale)
			.tickValues(d3.range(startX, startX + POINTS))
			.tickFormat(showXAxisTicks ? d3.format("d") : "")
			.tickSizeInner(showXAxisTicks ? AXIS_TICK_SIZE : 0);

		if (XAxisInverseStatic) {
			axis.tickFormat(showXAxisTicks ? (d, i) => (i + 1 - POINTS) : "");
		}

		return function (selection) {
			selection.call(axis);
			selection.selectAll(".domain")
				.attr("d", d => {
					const old = d3.select(selection.node()).select(".domain").attr("d");
					return old.replace(/V-?\d+(\.\d+)?$/, "");
				});

			selection.selectAll(".tick text")
				.style("fill", "gray")
				.style("font-size", AXIS_FONT_SIZE);
		};
	}

	function getThresholdColor(n) {
		if (!showThreshold) {
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
		if (labelPosition === "side") {
			return `54px`;
		}

		if (dynamicLabelSize === "none") {
			return `${FONT_SIZE_DEFAULT}px`;
		} else if (dynamicLabelSize === "linear") {
			return `${linearFontSizeScale(n)}px`;
		} else if (dynamicLabelSize === "ushaped") {
			return `${ushapedFontSizeScale(n)}px`;
		}
	}
}