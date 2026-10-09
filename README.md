# BeBetter — Daily Discipline Tracker

A lightweight daily productivity app built around one simple loop:

**Add tasks → Complete tasks → Watch progress increase → Build discipline.**

## Live site

[Open BeBetter](https://bebetter-daily-discipline.i25032504.chatgpt.site)

## Features

- Add, edit, complete, uncheck, and delete daily tasks
- Instant completion percentage and animated progress bar
- A fresh task list for each calendar day
- Seven-day history with daily completion scores
- Browser LocalStorage persistence — no account or backend required
- Responsive mobile-first layout
- Light and dark themes
- Accessible labels, keyboard-friendly controls, and reduced-motion support

## Tech stack

- React 19
- TypeScript
- Tailwind CSS 4
- Vinext / Vite
- LocalStorage

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:5173`.

## Build

```bash
npm run build
```

## Privacy

Task data stays in the visitor's browser. BeBetter does not require a login and does not send task data to a server.
