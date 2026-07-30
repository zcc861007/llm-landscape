# LLM LEADERBOARD STORY - No Single Finish Line
### CS 416 Data Visualization — Narrative Visualization Project

**Author**: Chaochao Zhou (cz76@illinois.edu)

This is a three-scene interactive slideshow built with D3.js. It compares leading LLMs by overall performance, task-specific benchmarks, and API price.

## Run Locally

### 1. Open a terminal and enter the project directory

```bash
cd "llm-landscape"
```

### 2. Start a local web server

```bash
python3 -m http.server 8000
```

The server is ready when the terminal displays a message similar to:

```text
Serving HTTP on ... port 8000
```

Keep this terminal window open while using the website.

### 3. Open the website

Open another terminal window and run:

```bash
open http://localhost:8000/
```

Alternatively, enter this address directly in a browser:

```text
http://localhost:8000/
```

### 4. Stop the server

Return to the terminal running the server and press:

```text
Control-C
```

## Start and Open with One Command

From the project directory, you can also run:

```bash
python3 -m http.server 8000 & LOCAL_LLM_SERVER_PID=$!; open http://localhost:8000/
```

This starts the server in the background and saves its process ID. To stop it, run the following in the same terminal:

```bash
kill "$LOCAL_LLM_SERVER_PID"
```

## Why `open index.html` Does Not Work

The website uses D3 to load these CSV files:

- `data/models.csv`
- `data/task_scores.csv`

Running `open index.html` uses the `file://` protocol, and browser security rules may prevent JavaScript from reading the CSV files. Starting `python3 -m http.server` serves the page and data through `http://localhost`, allowing the charts to load correctly.

## Using the Website

- Use the **Next** and **Previous** buttons to change scenes.
- The left and right arrow keys provide the same navigation.
- Select a chapter marker at the top to jump directly to a scene.
- In the task scene, choose Reasoning, Agentic coding, or Browsing.
- In the price scene, switch between input and output prices.
- Hover over or keyboard-focus a data mark to view its tooltip.

## GitHub Pages Deployment

See [DEPLOY.md](DEPLOY.md) for complete publishing instructions.

## Project Files

```text
llm-landscape/
├── index.html          # Website entry point
├── styles.css          # Page styling and responsive layout
├── js/app.js           # D3 charts, parameters, and interactions
├── data/               # Local data snapshot
├── essay.docx          # Course essay in Word format
├── essay.md            # Editable Markdown essay
├── DEPLOY.md           # GitHub Pages deployment guide
└── README.md           # Local setup and usage guide
```
