# Deploying the LLM narrative to GitHub Pages

This project is already a static site. It has no build step, package manager, API key, or server-side code. GitHub Pages can publish it directly from the repository root.

## What will be published

Keep this structure at the top level of the repository:

```text
interactive-web/
├── index.html
├── styles.css
├── js/
│   └── app.js
└── data/
    ├── models.csv
    ├── task_scores.csv
    └── README.md
```

`index.html` must remain at the root selected as the Pages publishing source. All asset URLs in the site are relative, so the same files work for both a user site and a project site.

The essay is normally submitted separately to the course. If you commit `essay.docx` or `essay.md` into the publishing source, those files will also be publicly downloadable. The commands below intentionally stage only the web files and this deployment guide.

## 1. Preview locally

Opening `index.html` by double-clicking it will not load the CSV files because browsers restrict `file://` requests. Start a small local HTTP server instead:

```bash
cd "/Users/czp3317/Library/CloudStorage/OneDrive-Loves/MyDoc/UIUC Master/CS416 Data Visualization/Projects/Proj2_Narrative_Vis/interactive-web"
python3 -m http.server 8000
```

Open <http://localhost:8000/>. Test all three slides, the three task buttons, the input/output-price toggle, and at least one tooltip. Stop the server with `Control-C`.

## 2. Create a GitHub repository

1. Sign in at [GitHub](https://github.com/).
2. Select **New repository**.
3. Choose a short name such as `llm-landscape`.
4. Select **Public** if you use GitHub Free. GitHub Pages can use private repositories only on plans that support that feature, and a Pages site may still be public even when its repository is private.
5. Do not add a README, `.gitignore`, or license if this local folder will be pushed as the initial commit.
6. Select **Create repository** and copy the repository URL.

There are two possible URL patterns:

- A project repository named `llm-landscape` publishes at `https://YOUR-USERNAME.github.io/llm-landscape/`.
- A special repository named exactly `YOUR-USERNAME.github.io` publishes at `https://YOUR-USERNAME.github.io/`.

The project-repository option is recommended because it does not occupy the account’s root Pages site.

## 3. Initialize Git and push the site

Run the following from this project folder. Replace `YOUR-USERNAME` and, if necessary, the repository name.

```bash
git init
git add index.html styles.css js data DEPLOY.md
git commit -m "Add interactive LLM narrative visualization"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/llm-landscape.git
git push -u origin main
```

If the folder is already a Git repository, skip `git init`. If `origin` already exists, inspect it with `git remote -v`; update it only if it points to the wrong repository:

```bash
git remote set-url origin https://github.com/YOUR-USERNAME/llm-landscape.git
```

If Git requests authentication over HTTPS, use the browser sign-in flow from Git Credential Manager or a GitHub personal access token; GitHub account passwords are not accepted for Git operations.

## 4. Enable GitHub Pages

GitHub’s current branch-publishing workflow is documented in [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

1. Open the repository on GitHub.
2. Select **Settings**. If it is hidden, open the repository navigation dropdown first.
3. In the left sidebar under **Code and automation**, select **Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. Choose the `main` branch and the `/(root)` folder.
6. Select **Save**.

No custom GitHub Actions workflow is needed because this project has no build step. After the deployment finishes, the Pages settings show **Your site is live at** followed by the public URL. The deployment also appears under the repository’s **Actions** tab.

## 5. Verify the public deployment

Open the exact Pages URL shown in Settings and check:

- the title reads “One test has one leader”;
- the overall-ranking bars extend to their labeled values;
- the task selector changes both the chart title and winner annotation;
- the price selector changes the horizontal positions and axis label;
- the browser console has no failed requests for `models.csv`, `task_scores.csv`, `app.js`, or `styles.css`;
- the source link and D3 CDN request load over HTTPS.

GitHub Pages deployment can take a few minutes after the first push. A hard refresh (`Command-Shift-R` on macOS or `Control-Shift-R` on Windows/Linux) clears a stale browser cache.

## 6. Publish later revisions

After editing the website, preview it locally and then push a new commit:

```bash
git add index.html styles.css js data
git commit -m "Refine narrative visualization"
git push
```

Each push to `main` republishes the root automatically. Watch the **pages build and deployment** run under **Actions**; a green check indicates the new version is live.

## Troubleshooting

### The site returns 404

- Confirm that Pages is set to `main` and `/(root)`.
- Confirm that `index.html` is in the repository root, not inside another `interactive-web` directory.
- Use the project URL including the repository segment: `https://YOUR-USERNAME.github.io/llm-landscape/`.
- Check the Pages deployment run in **Actions** for an error.

### The page loads but charts are empty

- Open the browser developer tools and check the **Console** and **Network** panels.
- Confirm that capitalization matches exactly: `data/models.csv`, `data/task_scores.csv`, and `js/app.js`.
- Confirm that all web files were committed and pushed with `git status` and `git ls-files`.
- Confirm that `https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js` is not blocked by a network filter. D3 is the only JavaScript library loaded by the project.

### Fonts look different

The design requests Google Fonts but includes system fallbacks. If Google Fonts is blocked, the site remains usable and the D3 charts retain their layout.

### A new push does not appear

- Wait for the Pages workflow to finish under **Actions**.
- Verify that the commit is on `main`, not only on another local branch.
- Hard-refresh the public URL.
- In **Settings → Pages**, confirm that the site has not been unpublished.

## Submission checklist

- Copy the public Pages URL, not the repository URL.
- Open it in a private/incognito window to confirm it is publicly accessible.
- Submit that URL with the separately edited `essay.docx` requested by the course.
- Keep the data snapshot date visible so the grader can interpret model names and rankings in their original time context.

Additional official references: [GitHub Pages overview](https://pages.github.com/) and [GitHub Pages quickstart](https://docs.github.com/en/pages/quickstart).
