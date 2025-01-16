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

	const xAxis = customAxisBottom(x);
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

	console.log("test changes");
	const clipPath = svg.append("clipPath")
		.attr("id", "chartClipPath")
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
		.attr("clip-path", "url(#chartClipPath)");

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
		.attr("clip-path", "url(#chartClipPath)");

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

	function resize(newWidth, newHeight) {
		width = newWidth;
		height = newHeight;

		svg.attr("width", width)
			.attr("height", height);

		x.range([MARGIN.left, width - MARGIN.right]);
		y.range([height - MARGIN.bottom, MARGIN.top]);

		xAxisgroup.attr("transform", `translate(0,${height - MARGIN.bottom})`)
			.call(xAxis);
		yAxisgroup.attr("transform", `translate(${MARGIN.left},0)`)
			.call(yAxis);

		titleText.attr("x", width / 2);

		verticalGap = x(1) - x(0);

		clipPath.attr("x", MARGIN.left + (verticalGap) / 2 - POINT_SIZE)
		.attr("y", MARGIN.top)
		.attr("width", width - MARGIN.left - MARGIN.right - verticalGap + POINT_SIZE * 2)
		.attr("height", height - MARGIN.top - MARGIN.bottom);

		lines.attr("stroke", "#8C8C8C")
			.attr("stroke-width", 1.5)
			.attr("fill", "none")
			.attr("d", d3.line()
				.defined(d => d.index <= COLS)
				.x(d => x(d.index))
				.y(d => y(d.value))
			)
			.attr("clip-path", "url(#chartClipPath)");

		points.attr("cx", d => x(d.index))
			.attr("cy", d => y(d.value))
			.attr("r", POINT_SIZE)
			.attr("fill", d => {
				if (d.value > MAX_THRESHOLD) { return "#FF7F50" }
				else if (d.value < MIN_THRESHOLD) { return "#00B2EE" }
				else { return "#8C8C8C" }
			})
			.attr("clip-path", "url(#chartClipPath)");
	}

	Object.assign(svg.node(), { update, resize });
	return svg.node();

	function customAxisBottom(scale) {
		const axis = d3.axisBottom(scale).ticks(COLS);

		return function (selection) {
			selection.call(axis);
			selection.selectAll(".domain")
				.attr("d", d => {
					const old = d3.select(selection.node()).select(".domain").attr("d");
					return old.replace(/V-?\d+(\.\d+)?$/, "");
				});
		};
	}
}