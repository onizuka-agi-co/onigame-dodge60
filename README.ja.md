<div align="center">
  <h1>Dodge60</h1>
  <p>落下物を避けて、60秒を生き切るだけのミニサバイバル。</p>
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

## 公開URL

- Pages: `https://onizuka-agi-co.github.io/onigame-dodge60/`

## 概要

Dodge60 は GitHub Pages 前提で作られた、完全静的の1画面回避ゲームです。
プレイヤーを動かし、落下してくるブロックを避けながら60秒生き残ればクリアです。

## 操作

- PC: `矢印キー` または `WASD`
- モバイル: ステージ上をドラッグ
- リトライ: ボタンを押すか、ゲームオーバー後に `Space`

## ローカル実行

`index.html` を直接開くか、簡易サーバーを使います。

```bash
python -m http.server 8080
```

その後 `http://localhost:8080/` を開きます。

## 構成

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

## デプロイ

このリポジトリは GitHub Pages の repository root 公開を前提にしています。
