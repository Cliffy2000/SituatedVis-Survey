function generateChart(data, title, width = 700, height = 400) {
	const margin = { top: 40, right: 20, bottom: 40, left: 60 };

	const COLS = 15;
	const offset = 0.5;

	const svg = d3.create("svg")
		.attr("width", width)
		.attr("height", height);

	const clipPath = svg.append("clipPath")
		.attr("id", "border")
		.append("rect")
		.attr("x", margin.left)
		.attr("y", margin.top)
		.attr("width", width - margin.left - margin.right)
		.attr("height", height - margin.top - margin.bottom)
		.attr("fill", "white");
	
	

	return svg.node();
}