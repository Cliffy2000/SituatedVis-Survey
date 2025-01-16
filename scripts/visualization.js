function generateChart(data, title, width = 700, height = 400) {
	const MARGIN = { top: 35, right: 15, bottom: 30, left: 35 };

	const COLS = 10;
	const OFFSET = 0.5;
	const POINT_SIZE = 4

	const MIN_THRESHOLD = 30;
	const MAX_THRESHOLD = 70;

	const svg = d3.create("svg")
		.attr("width", width)
		.attr("height", height);

	const lineChart = svg.append("g");

	const titleText = svg.append("text")
		.attr("x", width / 2)
		.attr("y", 10)
		.attr("text-anchor", "middle")
		.attr("dominant-baseline", "hanging")
		.attr("font-family", "sans-serif")
		.attr("font-size", "16px")
		.text(title);

	const x = d3.scaleLinear()
		.domain([OFFSET, COLS + OFFSET])
		.range([MARGIN.left, width - MARGIN.right]);

	const y = d3.scaleLinear()
		.domain([0, 100])
		.range([height - MARGIN.bottom, MARGIN.top]);

	const xAxis = d3.axisBottom(x).ticks(COLS);
	const xAxisgroup = svg.append("g")
		.attr("transform", `translate(0,${height - MARGIN.bottom})`)
		.call(xAxis);

	// Remove the ending tick on the axis
	const xAxisPath = xAxisgroup.select(".domain");
	const originalD = xAxisPath.attr("d");
	const newD = originalD.replace(/V-?\d+(\.\d+)?$/, "");
	xAxisPath.attr("d", newD);

	const yAxis = d3.axisLeft(y);
	const yAxisgroup = svg.append("g")
		.attr("transform", `translate(${MARGIN.left},0)`)
		.call(yAxis);

	let verticalGap = x(1) - x(0);

	const chartClipPath = svg.append("clipPath")
		.attr("id", "pointClipPath")
		.append("rect")
		.attr("x", MARGIN.left + (verticalGap) / 2 - POINT_SIZE)
		.attr("y", MARGIN.top)
		.attr("width", width - MARGIN.left - MARGIN.right - verticalGap + POINT_SIZE * 2)
		.attr("height", height - MARGIN.top - MARGIN.bottom)
		.attr("fill", "white");

	const lineClipPath = svg.append("clipPath")
		.attr("id", "lineClipPath")
		.append("rect")
		.attr("x", MARGIN.left + (verticalGap) / 2 - POINT_SIZE)
		.attr("y", MARGIN.top)
		.attr("width", width - MARGIN.left - MARGIN.right - verticalGap + POINT_SIZE * 2)
		.attr("height", height - MARGIN.top - MARGIN.bottom)
		.attr("fill", "white");

	const lines = lineChart.append("path")
		.datum(data)
		.attr("stroke", "#8C8C8C")
		.attr("stroke-width", 1.5)
		.attr("fill", "none")
		.attr("d", d3.line()
			.defined(d => d.index <= COLS)
			.x(d => x(d.index))
			.y(d => y(d.value))
		)
		.attr("clip-path", "url(#lineClipPath)");

	const points = lineChart.append("g")
		.selectAll("dot")
		.data(data)
		.enter()
		.append("circle")
		.attr("cx", d => x(d.index))
		.attr("cy", d => y(d.value))
		.attr("r", POINT_SIZE)
		.attr("fill", d => {
			if (d.value > MAX_THRESHOLD) { return "#FF7F50" }
			else if (d.value < MIN_THRESHOLD) { return "#00B2EE" }
			else { return "#8C8C8C" }
		})
		.attr("clip-path", "url(#pointClipPath)");

	function update(step, animTime) {
		lines.attr("d", d3.line()
				.defined(d => d.index <= step + COLS)
				.x(d => x(d.index))
				.y(d => y(d.value))
			)
		x.domain([OFFSET + step, COLS + OFFSET + step]);
		const anim = d3.transition("transmove").duration(animTime);
		lines.transition(anim)
			.attr("d", d3.line()
				.defined(d => d.index <= step + COLS)
				.x(d => x(d.index))
				.y(d => y(d.value))
			)
		points.transition(anim)
			.attr("cx", d => x(d.index));
		xAxisgroup.transition(anim).call(xAxis);
	}

	function resize() {

	}

	Object.assign(svg.node(), {update, resize});
	return svg.node();
}