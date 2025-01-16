/** This is for d3.js intelliSense */
/** @type {import("d3")} */

const FILE_COUNT = 20;

Promise.all(Array.from({ length: FILE_COUNT }, (_, i) => d3.csv(`data/demo_data${i + 1}.csv`, d3.autoType))).then((datasets) => {

    const ROWS = 4;
    const COLS = 5;

    let INTERVAL_ID;
    const ANIM_DURATION = 500;
    const ANIM_DELAY = 1500;

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
    const titles = Array.from({ length: FILE_COUNT }, (_, i) => `Machine ${i + 1}`);
    const charts = chartsContainer.selectAll("div")
        .data(d3.zip(datasets, titles))
        .join("div")
        .append(([data, title]) => generateChart(data, title, cellWidth, cellHeight))
        .nodes();


    const buttonPause = d3.select("#buttonsContainer").select("#pause")
        .on("click", onPauseClick);
    const buttonRestart = d3.select("#buttonsContainer").select("#restart")
        .on("click", onRestartClick);

    function onPauseClick() {
        console.log("click");
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