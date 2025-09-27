<<<<<<< HEAD
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
=======
# Smart To-Do | MHacks 2025

A minimalist to-do app with intelligent time-based task recommendations. Perfect for making the most of short time slots and managing task dependencies.

## Features

### Core Functionality
- **Task Management**: Create tasks with estimated duration, priority levels (Low/Medium/High), and dependencies
- **Smart Recommendations**: Enter available time and get intelligent task suggestions based on duration, priority, and dependencies  
- **Dependency Tracking**: Visual indication of blocked vs. available tasks
- **Time-Based Filtering**: Recommends tasks that fit perfectly within your available time slot

### Key Benefits
- **Maximizes Productivity**: Turn spare minutes into meaningful progress
- **Prevents Overwhelm**: Clear visual distinction between actionable and blocked tasks
- **Smart Prioritization**: Algorithm considers urgency, priority, and time efficiency
- **Quick Task Creation**: Streamlined interface for fast task entry

## How It Works

1. **Add Tasks**: Create tasks with title, estimated duration, priority, and any dependencies
2. **Enter Available Time**: Input how many minutes you have free (e.g., 30 minutes)
3. **Get Recommendations**: The app suggests the best task to tackle based on:
   - Tasks that fit within your time slot
   - Unblocked tasks (all dependencies completed)
   - Priority level and urgency
   - Optimal time utilization

4. **Track Progress**: Mark tasks complete and watch dependencies unlock automatically

## Getting Started

Simply open `index.html` in your web browser. The app includes sample tasks to demonstrate functionality.

### Sample Workflow
1. Enter "30" in the available time field
2. Click "Get Recommendation" to see the best task for a 30-minute slot
3. Add your own tasks using the form
4. Set dependencies to create task chains
5. Filter tasks by status: All, Available, Blocked, or Completed

## Technical Details

- **Pure Web Technologies**: HTML, CSS, JavaScript (no frameworks)
- **Local Storage**: Tasks persist in browser storage
- **Responsive Design**: Works on desktop and mobile
- **Recommendation Algorithm**: Scores tasks based on priority, time efficiency, and age

## Perfect For

- **Hackathon Participants**: Maximize limited time during events
- **Students**: Break down projects into manageable, time-boxed tasks
- **Professionals**: Make productive use of short breaks between meetings
- **Anyone**: Who wants to match the right task to available time

---
*Built for MHacks 2025 - Turning spare minutes into productive wins*
>>>>>>> origin/copilot/fix-bdf97f39-b26c-47a1-a4a0-db890ee2a80f
