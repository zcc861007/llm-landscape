(function () {
  "use strict";

  const COLORS = {
    blue: "#f6c177",
    blueLight: "#d59b6a",
    red: "#ff7a1a",
    green: "#f6c177",
    text: "#fff7ed",
    muted: "#f0c9aa",
    border: "#6f432c"
  };
  const ANNOTATION_BOX_HEIGHT = 58;

  const scenes = [
    {
      id: "overall",
      nav: "Overall",
      kicker: "Slide 1 · Overall ranking",
      title: "One test has one leader.",
      deck: "Claude Mythos 5 leads Humanity’s Last Exam. Other benchmarks test different skills and may produce different leaders.",
      eyebrow: "General benchmark",
      chartTitle: "Humanity’s Last Exam score",
      caption: "Top 10 models; hover or focus a bar to see its provider and score.",
      note: "<strong>Annotation</strong>The leader is 6.6 percentage points ahead of second place.",
      render: renderOverall
    },
    {
      id: "tasks",
      nav: "Tasks",
      kicker: "Slide 2 · Task ranking",
      title: "Change the task, change the winner.",
      deck: "Choose a task to see how a different benchmark produces a different top-five ranking.",
      eyebrow: "Specialist benchmarks",
      chartTitle: "Reasoning · GPQA Diamond",
      caption: "Scores should be compared within one benchmark, not between different benchmarks.",
      note: "<strong>Annotation</strong>The callout changes with the selected task and always identifies its winner.",
      render: renderTasks
    },
    {
      id: "price",
      nav: "Price",
      kicker: "Slide 3 · Price trade-off",
      title: "The best score is not the lowest price.",
      deck: "Switch the price type and compare overall benchmark performance with API token cost.",
      eyebrow: "Performance and cost",
      chartTitle: "HLE score vs. output price",
      caption: "The price axis is logarithmic because displayed model prices cover a very wide range. Prices are USD per 1M tokens.",
      note: "<strong>Annotation</strong>DeepSeek V4 Flash keeps a 51.6% HLE score at a comparatively low displayed price.",
      render: renderPrice
    }
  ];

  const state = {
    sceneIndex: 0,
    task: "Reasoning",
    costMetric: "output_cost",
    models: [],
    tasks: []
  };

  const elements = {
    chapterNav: d3.select("#chapter-nav"),
    progress: d3.select("#progress-fill"),
    kicker: d3.select("#scene-kicker"),
    title: d3.select("#scene-title"),
    deck: d3.select("#scene-deck"),
    controls: d3.select("#scene-controls"),
    note: d3.select("#scene-note"),
    eyebrow: d3.select("#chart-eyebrow"),
    chartTitle: d3.select("#chart-title"),
    legend: d3.select("#chart-legend"),
    chart: d3.select("#chart"),
    caption: d3.select("#chart-caption"),
    previous: d3.select("#prev-button"),
    next: d3.select("#next-button"),
    status: d3.select("#step-status"),
    tooltip: d3.select("#tooltip")
  };

  let resizeTimer;
  init();

  async function init() {
    buildNavigation();
    bindTriggers();

    try {
      const [models, tasks] = await Promise.all([
        d3.csv("data/models.csv", parseModel),
        d3.csv("data/task_scores.csv", parseTask)
      ]);
      state.models = models;
      state.tasks = tasks;
      state.sceneIndex = sceneIndexFromHash();
      renderScene();
    } catch (error) {
      console.error(error);
      elements.chart.html('<div class="error-state">Data could not be loaded.<br>Run the page through a local web server.</div>');
    }
  }

  function parseModel(d) {
    return {
      ...d,
      hle: numberOrNull(d.hle),
      input_cost: numberOrNull(d.input_cost),
      output_cost: numberOrNull(d.output_cost)
    };
  }

  function parseTask(d) {
    return { ...d, score: +d.score, rank: +d.rank };
  }

  function numberOrNull(value) {
    return value === "" || value == null ? null : +value;
  }

  function buildNavigation() {
    const buttons = elements.chapterNav
      .selectAll("button")
      .data(scenes)
      .join("button")
      .attr("class", "chapter-button")
      .attr("type", "button")
      .attr("aria-label", (d, i) => `Go to slide ${i + 1}: ${d.nav}`)
      .on("click", (_, d) => goToScene(scenes.indexOf(d)));

    buttons.append("span").attr("class", "chapter-dot").attr("aria-hidden", "true");
    buttons.append("span").attr("class", "chapter-label").text(d => d.nav);
  }

  function bindTriggers() {
    elements.previous.on("click", () => goToScene(state.sceneIndex - 1));
    elements.next.on("click", () => goToScene(state.sceneIndex + 1));

    d3.select(window).on("keydown.story", event => {
      if (["BUTTON", "INPUT"].includes(event.target.tagName)) return;
      if (event.key === "ArrowRight") goToScene(state.sceneIndex + 1);
      if (event.key === "ArrowLeft") goToScene(state.sceneIndex - 1);
    });

    d3.select(window).on("hashchange.story", () => {
      const index = sceneIndexFromHash();
      if (index !== state.sceneIndex) {
        state.sceneIndex = index;
        renderScene();
      }
    });

    const panel = document.querySelector(".visual-panel");
    let lastWidth = panel.clientWidth;
    let lastHeight = panel.clientHeight;
    new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (Math.abs(width - lastWidth) < 1 && Math.abs(height - lastHeight) < 1) return;
      lastWidth = width;
      lastHeight = height;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (state.models.length) renderScene();
      }, 100);
    }).observe(panel);
  }

  function sceneIndexFromHash() {
    const index = scenes.findIndex(scene => scene.id === location.hash.slice(1));
    return index < 0 ? 0 : index;
  }

  function goToScene(index) {
    const next = Math.max(0, Math.min(scenes.length - 1, index));
    if (next === state.sceneIndex && state.models.length) return;
    state.sceneIndex = next;
    history.pushState(null, "", `#${scenes[next].id}`);
    renderScene();
  }

  function renderScene() {
    const scene = scenes[state.sceneIndex];
    hideTooltip();
    elements.kicker.text(scene.kicker);
    elements.title.text(scene.title);
    elements.deck.text(scene.deck);
    elements.note.html(scene.note);
    elements.eyebrow.text(scene.eyebrow);
    elements.chartTitle.text(scene.chartTitle);
    elements.caption.text(scene.caption);
    elements.controls.html("");
    elements.legend.html("");
    elements.chart.html("");
    updateNavigation();
    scene.render();
  }

  function updateNavigation() {
    elements.chapterNav.selectAll(".chapter-button")
      .classed("is-active", (_, i) => i === state.sceneIndex)
      .classed("is-complete", (_, i) => i < state.sceneIndex)
      .attr("aria-current", (_, i) => i === state.sceneIndex ? "step" : null);
    elements.progress.style("width", `${state.sceneIndex * 50}%`);
    elements.previous.property("disabled", state.sceneIndex === 0);
    elements.next.property("disabled", state.sceneIndex === scenes.length - 1);
    elements.status.text(`${state.sceneIndex + 1} / ${scenes.length}`);
  }

  function renderOverall() {
    elements.legend.html(legendItem(COLORS.red, "leader") + legendItem(COLORS.blueLight, "other models"));
    const data = state.models
      .filter(d => d.hle != null)
      .sort((a, b) => d3.descending(a.hle, b.hle))
      .slice(0, 10);

    const { svg, width, height } = createSvg("Top ten models ranked by Humanity’s Last Exam score.");
    const mobile = width < 520;
    const margin = { top: 14, right: mobile ? 43 : 190, bottom: 28, left: mobile ? 104 : 145 };
    const innerWidth = Math.max(80, width - margin.left - margin.right);
    const innerHeight = Math.max(120, height - margin.top - margin.bottom);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([0, 70]).range([0, innerWidth]);
    const y = d3.scaleBand().domain(data.map(d => d.model)).range([0, innerHeight]).padding(0.25);

    addBottomGrid(g, x, innerHeight, mobile ? 4 : 7, d => `${d}%`);

    const rows = g.selectAll("g.model")
      .data(data)
      .join("g")
      .attr("class", "model interactive-mark")
      .attr("tabindex", 0)
      .attr("role", "graphics-symbol")
      .attr("aria-label", d => `${d.model}, ${d.hle} percent`)
      .attr("transform", d => `translate(0,${y(d.model)})`)
      .on("pointerenter focus", (event, d) => showTooltip(event, modelTooltip(d)))
      .on("pointermove", moveTooltip)
      .on("pointerleave blur", hideTooltip);

    rows.append("text")
      .attr("class", "svg-label")
      .attr("x", -8)
      .attr("y", y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .text(d => d.model);

    rows.append("rect")
      .attr("width", d => x(d.hle))
      .attr("height", y.bandwidth())
      .attr("rx", 2)
      .attr("fill", (_, i) => i === 0 ? COLORS.red : COLORS.blueLight);

    rows.append("text")
      .attr("class", "svg-micro")
      .attr("x", (d, i) => i === 0 ? x(d.hle) - 8 : x(d.hle) + 5)
      .attr("y", y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (_, i) => i === 0 ? "end" : "start")
      .style("fill", (_, i) => i === 0 ? "white" : null)
      .text(d => d3.format(".1f")(d.hle));

    const leader = data[0];
    const anchorX = x(leader.hle);
    const anchorY = y(leader.model) + y.bandwidth() / 2;
    const boxWidth = mobile ? 140 : 155;
    const noteX = mobile ? Math.max(4, innerWidth - boxWidth) : innerWidth + 20;
    const noteY = mobile
      ? Math.min(innerHeight - ANNOTATION_BOX_HEIGHT - 4, anchorY + y.bandwidth() + 14)
      : Math.min(innerHeight - ANNOTATION_BOX_HEIGHT - 4, anchorY + 18);
    addAnnotation(g, anchorX, anchorY, noteX, noteY, "6.6-point lead", "over second place", boxWidth);
  }

  function renderTasks() {
    const availableTasks = ["Reasoning", "Agentic coding", "Browsing"];
    elements.controls.append("p").attr("class", "control-label").text("Choose a task");
    elements.controls.selectAll("button")
      .data(availableTasks)
      .join("button")
      .attr("type", "button")
      .attr("class", d => `pill-button${d === state.task ? " is-active" : ""}`)
      .attr("aria-pressed", d => d === state.task)
      .text(d => d)
      .on("click", (_, d) => {
        state.task = d;
        renderScene();
      });
    renderTaskChart();
  }

  function renderTaskChart() {
    elements.legend.html(legendItem(COLORS.red, "winner") + legendItem(COLORS.blue, "other top-five models"));
    const data = state.tasks
      .filter(d => d.task === state.task)
      .sort((a, b) => d3.ascending(a.rank, b.rank));
    const benchmark = data[0].benchmark;
    elements.chartTitle.text(`${state.task} · ${benchmark}`);

    const { svg, width, height } = createSvg(`Top five ${state.task} models on ${benchmark}.`);
    const mobile = width < 520;
    const margin = { top: 25, right: mobile ? 43 : 200, bottom: 30, left: mobile ? 112 : 150 };
    const innerWidth = Math.max(80, width - margin.left - margin.right);
    const innerHeight = Math.max(120, height - margin.top - margin.bottom);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const max = Math.ceil(d3.max(data, d => d.score) / 10) * 10;
    const x = d3.scaleLinear().domain([0, max]).range([0, innerWidth]);
    const y = d3.scaleBand().domain(data.map(d => d.model)).range([0, innerHeight]).padding(0.48);

    addBottomGrid(g, x, innerHeight, mobile ? 4 : 5, d => `${d}%`);

    const rows = g.selectAll("g.task-model")
      .data(data)
      .join("g")
      .attr("class", "task-model interactive-mark")
      .attr("tabindex", 0)
      .attr("role", "graphics-symbol")
      .attr("aria-label", d => `Rank ${d.rank}, ${d.model}, ${d.score} percent`)
      .attr("transform", d => `translate(0,${y(d.model)})`)
      .on("pointerenter focus", (event, d) => showTooltip(event, `<strong>#${d.rank} ${d.model}</strong><span class="tooltip-muted">${d.provider}</span><br>${d3.format(".1f")(d.score)}%`))
      .on("pointermove", moveTooltip)
      .on("pointerleave blur", hideTooltip);

    rows.append("text")
      .attr("class", "svg-label")
      .attr("x", -8)
      .attr("y", y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .text(d => d.model);

    rows.append("line")
      .attr("x1", 0)
      .attr("x2", d => x(d.score))
      .attr("y1", y.bandwidth() / 2)
      .attr("y2", y.bandwidth() / 2)
      .attr("stroke", d => d.rank === 1 ? "#ffbf87" : COLORS.blueLight)
      .attr("stroke-width", 6)
      .attr("stroke-linecap", "round");

    rows.append("circle")
      .attr("cx", d => x(d.score))
      .attr("cy", y.bandwidth() / 2)
      .attr("r", d => d.rank === 1 ? 6 : 5)
      .attr("fill", d => d.rank === 1 ? COLORS.red : COLORS.blue);

    rows.append("text")
      .attr("class", "svg-micro")
      .attr("x", d => d.rank === 1 ? x(d.score) : x(d.score) + 9)
      .attr("y", d => d.rank === 1 ? y.bandwidth() / 2 - 13 : y.bandwidth() / 2)
      .attr("dy", d => d.rank === 1 ? "0" : "0.35em")
      .attr("text-anchor", d => d.rank === 1 ? "middle" : "start")
      .text(d => d3.format(".1f")(d.score));

    const winner = data[0];
    const anchorX = x(winner.score);
    const anchorY = y(winner.model) + y.bandwidth() / 2;
    const boxWidth = mobile ? 145 : 170;
    const noteX = mobile ? Math.max(4, innerWidth - boxWidth) : innerWidth + 20;
    const noteY = mobile
      ? Math.min(innerHeight - ANNOTATION_BOX_HEIGHT - 4, anchorY + y.bandwidth() + 18)
      : Math.min(innerHeight - ANNOTATION_BOX_HEIGHT - 4, anchorY + 18);
    addAnnotation(g, anchorX, anchorY, noteX, noteY, `${winner.model} wins`, `${d3.format(".1f")(winner.score)}% on ${benchmark}`, boxWidth);
  }

  function renderPrice() {
    const options = [
      { key: "output_cost", label: "Output price" },
      { key: "input_cost", label: "Input price" }
    ];
    elements.controls.append("p").attr("class", "control-label").text("Choose price type");
    elements.controls.selectAll("button")
      .data(options)
      .join("button")
      .attr("type", "button")
      .attr("class", d => `pill-button${d.key === state.costMetric ? " is-active" : ""}`)
      .attr("aria-pressed", d => d.key === state.costMetric)
      .text(d => d.label)
      .on("click", (_, d) => {
        state.costMetric = d.key;
        renderScene();
      });
    renderPriceChart();
  }

  function renderPriceChart() {
    const label = state.costMetric === "output_cost" ? "output" : "input";
    elements.chartTitle.text(`HLE score vs. ${label} price`);
    elements.legend.html(legendItem(COLORS.blue, "model") + legendItem(COLORS.red, "annotated model"));
    const data = state.models.filter(d => d.hle != null && d[state.costMetric] != null);

    const { svg, width, height } = createSvg(`Scatterplot comparing HLE score with ${label} price.`);
    const mobile = width < 520;
    const margin = { top: 18, right: 25, bottom: 45, left: mobile ? 54 : 62 };
    const innerWidth = Math.max(100, width - margin.left - margin.right);
    const innerHeight = Math.max(120, height - margin.top - margin.bottom);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const extent = d3.extent(data, d => d[state.costMetric]);
    const x = d3.scaleLog().domain([extent[0] * 0.75, extent[1] * 1.35]).range([0, innerWidth]).nice();
    const y = d3.scaleLinear().domain([38, 67]).range([innerHeight, 0]);
    const preferredTicks = state.costMetric === "output_cost"
      ? [0.3, 1, 3, 10, 30, 100]
      : [0.1, 0.3, 1, 3, 10, 30];
    const ticks = preferredTicks.filter(value => value >= x.domain()[0] && value <= x.domain()[1]);

    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickValues(ticks).tickSize(-innerHeight).tickFormat(d => `$${d3.format("~g")(d)}`))
      .call(axis => axis.select(".domain").remove());
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).ticks(mobile ? 4 : 6).tickSize(-innerWidth).tickFormat(d => `${d}%`))
      .call(axis => axis.select(".domain").remove());

    g.append("text")
      .attr("class", "svg-micro")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", mobile ? -43 : -50)
      .attr("text-anchor", "middle")
      .text("HLE SCORE (%)");

    g.append("text")
      .attr("class", "svg-micro")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 36)
      .attr("text-anchor", "middle")
      .text(`${label.toUpperCase()} PRICE PER 1M TOKENS · LOG SCALE`);

    const highlighted = "DeepSeek V4 Flash";
    const points = g.selectAll("g.point")
      .data(data)
      .join("g")
      .attr("class", "point interactive-mark")
      .attr("tabindex", 0)
      .attr("role", "graphics-symbol")
      .attr("aria-label", d => `${d.model}, HLE ${d.hle} percent, ${label} price ${d[state.costMetric]} dollars`)
      .attr("transform", d => `translate(${x(d[state.costMetric])},${y(d.hle)})`)
      .on("pointerenter focus", (event, d) => showTooltip(event, modelTooltip(d)))
      .on("pointermove", moveTooltip)
      .on("pointerleave blur", hideTooltip);

    points.append("circle")
      .attr("r", d => d.model === highlighted ? 7 : 5)
      .attr("fill", d => d.model === highlighted ? COLORS.red : COLORS.blue)
      .attr("fill-opacity", 0.85)
      .attr("stroke", "white")
      .attr("stroke-width", 1.5);

    points.filter(d => ["Claude Mythos 5", highlighted].includes(d.model))
      .append("text")
      .attr("class", "svg-micro")
      .attr("x", 8)
      .attr("y", d => d.model === highlighted ? 22 : -8)
      .text(d => d.model);

    const point = data.find(d => d.model === highlighted);
    if (point) {
      const anchorX = x(point[state.costMetric]);
      const anchorY = y(point.hle);
      const boxWidth = mobile ? 140 : 160;
      const noteX = Math.min(innerWidth - boxWidth - 4, anchorX + (mobile ? 28 : 58));
      const noteY = Math.max(5, anchorY - 68);
      addAnnotation(g, anchorX, anchorY, noteX, noteY, "Low-price option", `${point.hle}% at $${d3.format("~g")(point[state.costMetric])}`, boxWidth);
    }
  }

  function addBottomGrid(g, scale, height, ticks, formatter) {
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(scale).ticks(ticks).tickSize(-height).tickFormat(formatter))
      .call(axis => axis.select(".domain").remove());
  }

  function addAnnotation(g, anchorX, anchorY, boxX, boxY, title, copy, boxWidth = 160) {
    const boxHeight = ANNOTATION_BOX_HEIGHT;
    const boxIsRight = boxX >= anchorX;
    const edgeX = boxIsRight ? boxX : boxX + boxWidth;
    const edgeY = boxY + boxHeight / 2;
    const direction = boxIsRight ? 1 : -1;
    const elbowX = anchorX + direction * Math.max(18, Math.abs(edgeX - anchorX) * 0.45);
    const annotation = g.append("g").attr("class", "chart-annotation").attr("pointer-events", "none");

    annotation.append("path")
      .attr("class", "annotation-line")
      .attr("d", `M${anchorX},${anchorY} L${elbowX},${anchorY} L${elbowX},${edgeY} L${edgeX},${edgeY}`);

    annotation.append("circle")
      .attr("class", "annotation-anchor")
      .attr("cx", anchorX)
      .attr("cy", anchorY)
      .attr("r", 4);

    const box = annotation.append("g").attr("class", "annotation-box");
    box.append("rect")
      .attr("class", "annotation-box-bg")
      .attr("x", boxX)
      .attr("y", boxY)
      .attr("width", boxWidth)
      .attr("height", boxHeight);
    box.append("text")
      .attr("class", "annotation-title")
      .attr("x", boxX + 9)
      .attr("y", boxY + 21)
      .text(title);
    box.append("text")
      .attr("class", "annotation-copy")
      .attr("x", boxX + 9)
      .attr("y", boxY + 41)
      .text(copy);
    box.append("line")
      .attr("class", "annotation-box-rule")
      .attr("x1", boxX + 8)
      .attr("x2", boxX + boxWidth - 8)
      .attr("y1", boxY + boxHeight - 5)
      .attr("y2", boxY + boxHeight - 5);
  }

  function createSvg(ariaLabel) {
    const node = elements.chart.node();
    const width = Math.max(280, node.clientWidth);
    const height = Math.max(220, node.clientHeight);
    elements.chart.attr("aria-label", ariaLabel);
    const svg = elements.chart.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("focusable", "false");
    return { svg, width, height };
  }

  function legendItem(color, label) {
    return `<span class="legend-item"><span class="legend-swatch" style="background:${color}"></span>${label}</span>`;
  }

  function modelTooltip(d) {
    const lines = [
      `<strong>${d.model}</strong>`,
      `<span class="tooltip-muted">${d.provider}</span>`,
      `HLE: ${d3.format(".1f")(d.hle)}%`
    ];
    if (d.input_cost != null) lines.push(`Input: $${d3.format("~g")(d.input_cost)} / 1M`);
    if (d.output_cost != null) lines.push(`Output: $${d3.format("~g")(d.output_cost)} / 1M`);
    return lines.join("<br>");
  }

  function showTooltip(event, html) {
    elements.tooltip.html(html).classed("is-visible", true).attr("aria-hidden", "false");
    moveTooltip(event);
  }

  function moveTooltip(event) {
    let x = event.clientX;
    let y = event.clientY;
    if (event.type === "focus") {
      const box = event.currentTarget.getBoundingClientRect();
      x = box.left + box.width / 2;
      y = box.top;
    }
    const width = elements.tooltip.node().offsetWidth || 200;
    x = Math.max(width / 2 + 5, Math.min(innerWidth - width / 2 - 5, x));
    y = Math.max(75, y);
    elements.tooltip.style("left", `${x}px`).style("top", `${y}px`);
  }

  function hideTooltip() {
    elements.tooltip.classed("is-visible", false).attr("aria-hidden", "true");
  }
})();
