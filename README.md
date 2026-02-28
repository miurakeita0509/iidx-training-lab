# IIDX Training Lab

beatmania IIDX の苦手な配置を重点的に練習するための Web アプリケーション。
Phoenix Wan コントローラー（Gamepad API）またはキーボードで操作できます。

**[Play Now](https://miurakeita0509.github.io/iidx-training-lab/)**

## Features

### Song Play
オリジナル譜面をプレイできる楽曲モード。RANDOM オプション対応。
収録曲: Chromatic Rush (HYPER Lv.5 / ANOTHER Lv.10)

### Pattern Practice
階段・トリル・デニム・同時押しなど 8 種類の配置パターンを BPM・HS を調整しながら繰り返し練習。

### Scratch Practice
皿単体・皿+鍵盤・連皿・BSS 風など 5 種類の皿絡みパターンを練習。

### Recognition Training
画面に表示されるノーツ配置を瞬時に記憶して入力する認識力トレーニング（Lv.1〜5）。

### Tap Speed
打鍵速度・BPM 換算・安定度をリアルタイム計測。

### Controller Settings
ボタンマッピングのカスタマイズ、判定タイミング調整（±99ms）、RAW 入力モニター。

## Judgment System

beatmania IIDX 準拠の 60fps フレーム基準判定:

| Judgment | Window | Score |
|----------|--------|-------|
| P-GREAT | ±16.67ms (1F) | x2 |
| GREAT | ±33.33ms (2F) | x1 |
| GOOD | ±116.67ms (7F) | x0 |
| BAD | ±250ms (15F) | x0 |
| POOR | Miss | x0 |

FAST/SLOW インジケーター表示対応。判定オフセットで入力遅延を補正可能。

## Controls

### Keyboard

| Key | Lane |
|-----|------|
| S | 1 |
| D | 2 |
| F | 3 |
| Space | 4 |
| J | 5 |
| K | 6 |
| L | 7 |
| Shift | Scratch (up) |
| Ctrl | Scratch (down) |

### Gamepad (Phoenix Wan)

buttons[0]〜[6] で 7 鍵、axes[0] でターンテーブル。
コントローラー設定画面でマッピングをカスタマイズ可能。

## Tech Stack

- React 19 + TypeScript
- Vite 6
- CSS Modules
- Gamepad API / requestAnimationFrame / performance.now()
- GitHub Pages (static SPA)

## Development

```bash
npm install
npm run dev      # dev server
npm run build    # production build
npm run preview  # preview production build
```

## License

MIT
