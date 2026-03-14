<div align="center">
  <h1>Dodge60</h1>
  <p>One minute of clean panic. Dodge the fall, survive the clock.</p>
  <img src="./assets/repo-mark.svg" alt="Dodge60 mark" width="220">
  <p>
    <img src="https://img.shields.io/badge/Type-Static%20Web%20Game-EA6A47" alt="Static Web Game">
    <img src="https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=222" alt="Vanilla JavaScript">
    <img src="https://img.shields.io/badge/Deploy-GitHub%20Pages-222?logo=githubpages&logoColor=white" alt="GitHub Pages">
  </p>
  <p>
    <a href="./README.md">
      <img src="https://img.shields.io/badge/Language-English-blue.svg" alt="English">
    </a>
    <a href="./README.ja.md">
      <img src="https://img.shields.io/badge/Language-Japanese-lightgrey.svg" alt="Japanese">
    </a>
  </p>
</div>

## Live URL

- Pages: `https://onizuka-agi-co.github.io/onigame-dodge60/`

## Overview

Dodge60 is a tiny static survival game built for GitHub Pages.
Move the square, avoid the falling blocks, and hold out for a full minute.

## Controls

- Desktop: `Arrow keys` or `WASD`
- Mobile: drag your finger on the stage
- Retry: click the button or press `Space` after a game over

## Local Usage

Open `index.html` directly, or run a simple static server:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/`.

## Structure

```text
onigame-dodge60/
|- assets/
|  `- repo-mark.svg
|- index.html
|- styles.css
|- app.js
|- README.md
`- README.ja.md
```

## Deployment

This repo is designed to publish directly from the repository root on GitHub Pages.
