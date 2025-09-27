# Focus Minutes — Minimal Todo (mhacks-2025)

A small, clean, offline-first to-do web app that attaches a duration, priority, and dependencies to each task and recommends what you can accomplish in a spare block of time.

Features
- Create tasks with: title, estimated duration (minutes), priority (Low / Medium / High), optional due date, and dependencies (select other tasks).
- Tasks show when they are blocked (waiting on dependencies) or ready.
- Recommendation panel: enter available minutes and get the best-fit task plus alternatives. Recommendation considers duration, priority, and due date urgency.
- Data is stored locally in your browser (localStorage).

Files
- `index.html` — main single-file web UI.
- `style.css` — minimal styles.
- `app.js` — application logic, storage, and recommendation engine.

How to run
1. Open `index.html` in your browser.
2. Or run a simple static server from the project folder (recommended for some browsers):

```bash
# from project root (zsh)
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```

Notes & next steps
- The initial implementation focuses on matching spare minutes to actionable tasks. It is intentionally minimal and dependency-free.
- Next improvements: sync across devices, richer analytics for estimation accuracy, drag-and-drop ordering, and smarter scheduling that chains tasks.

Enjoy! (This is a local demo — nothing is sent to any server.)