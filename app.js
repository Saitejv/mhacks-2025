const STORAGE_KEY = 'focus-minutes:v1';

// Data model helpers
function uid() { return Math.random().toString(36).slice(2, 9) }

function load() {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : { tasks: [] } } catch (e) { return { tasks: [] } }
}
function save(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }

const state = load();

// DOM refs
const form = document.getElementById('task-form');
const titleEl = document.getElementById('title');
const durationChips = document.getElementById('duration-chips');
const priorityChips = document.getElementById('priority-chips');
const customDuration = document.getElementById('custom-duration');
const depsSelect = document.getElementById('deps');
const dueInput = document.getElementById('due');
const tasksList = document.getElementById('tasks-list');
const recommendBtn = document.getElementById('recommend-btn');
const availableMinutesInput = document.getElementById('available-minutes');
const recommendationPanel = document.getElementById('recommendation');

let selectedDuration = 30;
let selectedPriority = 'Medium';

function renderDepsOptions() {
    depsSelect.innerHTML = '';
    state.tasks.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id; opt.textContent = t.title;
        depsSelect.appendChild(opt);
    })
}

function addTask(e) {
    e?.preventDefault();
    const title = titleEl.value.trim(); if (!title) return;
    const custom = parseInt(customDuration.value, 10);
    const duration = (custom && custom > 0) ? custom : selectedDuration;
    const deps = Array.from(depsSelect.selectedOptions).map(o => o.value);
    const due = dueInput.value ? new Date(dueInput.value).toISOString() : null;
    const task = { id: uid(), title, duration, priority: selectedPriority, deps, completed: false, due, createdAt: new Date().toISOString() };
    state.tasks.push(task);
    save(state); form.reset(); customDuration.value = ''; selectedDuration = 30; selectedPriority = 'Medium';
    durationChips.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    durationChips.querySelector('button[data-min="30"]').classList.add('active');
    priorityChips.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    priorityChips.querySelector('button[data-priority="Medium"]').classList.add('active');
    renderAll();
}

function toggleComplete(id) {
    const t = state.tasks.find(x => x.id === id); if (!t) return;
    t.completed = !t.completed; save(state); renderAll();
}

function deleteTask(id) {
    // remove id from other deps
    state.tasks.forEach(t => { t.deps = t.deps.filter(d => d !== id) });
    state.tasks = state.tasks.filter(t => t.id !== id); save(state); renderAll();
}

function isBlocked(task) {
    if (!task.deps || task.deps.length === 0) return false;
    for (const d of task.deps) {
        const dep = state.tasks.find(x => x.id === d);
        if (!dep || !dep.completed) return true;
    }
    return false;
}

function humanDue(task) {
    if (!task.due) return '';
    const d = new Date(task.due); return d.toLocaleDateString();
}

function renderTasks() {
    tasksList.innerHTML = '';
    if (state.tasks.length === 0) {
        tasksList.innerHTML = '<small>No tasks yet — add one above.</small>';
        return;
    }
    const sorted = [...state.tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const p = (p) => p.priority === 'High' ? 3 : (p.priority === 'Medium' ? 2 : 1);
        if (p(b) !== p(a)) return p(b) - p(a);
        return new Date(a.createdAt) - new Date(b.createdAt);
    });
    sorted.forEach(t => {
        const el = document.createElement('div'); el.className = 'flex justify-between items-start p-3 rounded-xl bg-white/3 border border-white/5';
        const left = document.createElement('div'); left.className = 'flex gap-3 items-start';
        const info = document.createElement('div');
        const title = document.createElement('div'); title.textContent = t.title; if (t.completed) title.classList.add('opacity-50', 'line-through'); title.classList.add('font-medium');
        const meta = document.createElement('div'); meta.className = 'flex gap-2 items-center text-sm text-slate-300 mt-2';
        const dur = document.createElement('span'); dur.className = 'px-2 py-0.5 rounded-full bg-white/5 text-xs text-slate-100'; dur.textContent = t.duration + 'm';
        const pri = document.createElement('span'); pri.className = 'px-2 py-0.5 rounded-full bg-white/5 text-xs text-slate-100'; pri.textContent = t.priority;
        const due = document.createElement('span'); due.className = 'px-2 py-0.5 rounded-full bg-white/5 text-xs text-slate-100'; due.textContent = t.due ? ('Due: ' + humanDue(t)) : '';
        meta.appendChild(dur); meta.appendChild(pri); if (t.due) meta.appendChild(due);
        info.appendChild(title); info.appendChild(meta);
        left.appendChild(info);

        const right = document.createElement('div'); right.className = 'flex gap-2 items-center';
        const blocked = isBlocked(t);
        const stateBadge = document.createElement('span'); stateBadge.className = blocked ? 'px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs' : 'px-2 py-0.5 rounded-full bg-emerald-400 text-slate-900 text-xs'; stateBadge.textContent = blocked ? 'Blocked' : 'Ready';
        right.appendChild(stateBadge);
        const doneBtn = document.createElement('button'); doneBtn.textContent = t.completed ? 'Undo' : 'Done'; doneBtn.className = 'px-2 py-1 rounded-md bg-white/5 text-sm'; doneBtn.onclick = () => toggleComplete(t.id);
        const delBtn = document.createElement('button'); delBtn.textContent = 'Delete'; delBtn.className = 'px-2 py-1 rounded-md bg-white/5 text-sm'; delBtn.onclick = () => { if (confirm('Delete task?')) deleteTask(t.id) };
        right.appendChild(doneBtn); right.appendChild(delBtn);

        el.appendChild(left); el.appendChild(right);

        if (t.deps && t.deps.length > 0) {
            const depsEl = document.createElement('div'); depsEl.className = 'text-sm text-slate-400 mt-2';
            const depNames = t.deps.map(d => {
                const dep = state.tasks.find(x => x.id === d); return dep ? (dep.title + (dep.completed ? ' ✓' : ' ✗')) : '(missing)';
            }).join(' · ');
            depsEl.textContent = 'Depends on: ' + depNames;
            el.appendChild(depsEl);
        }

        tasksList.appendChild(el);
    });
}

function scoreTask(task) {
    // higher is better
    const pri = (task.priority === 'High' ? 30 : task.priority === 'Medium' ? 18 : 8);
    let urgency = 0;
    if (task.due) {
        const days = Math.max(0, Math.floor((new Date(task.due) - new Date()) / (1000 * 60 * 60 * 24)));
        urgency = days <= 0 ? 20 : days <= 2 ? 12 : days <= 7 ? 6 : 0;
    }
    // shorter tasks slightly preferred
    const lengthBonus = Math.max(0, 10 - Math.log(task.duration + 1));
    return pri + urgency + lengthBonus;
}

function recommend(minutes) {
    const available = Number(minutes) || 0;
    if (available <= 0) return { best: null, alternatives: [] };
    const candidates = state.tasks.filter(t => !t.completed && !isBlocked(t));
    const fitting = candidates.filter(t => t.duration <= available);
    const scored = fitting.map(t => ({ t, score: scoreTask(t) })).sort((a, b) => b.score - a.score);
    const best = scored.length ? scored[0].t : null;
    const alternatives = scored.slice(1, 5).map(s => s.t);
    // if nothing fits, maybe suggest the highest priority unblocked task (flag as long)
    if (!best) {
        const fallback = candidates.map(t => ({ t, score: scoreTask(t) })).sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.t);
        return { best: null, alternatives: fallback };
    }
    return { best, alternatives };
}

function renderRecommendation(res, minutes) {
    recommendationPanel.innerHTML = '';
    if (!res || (!res.best && res.alternatives.length === 0)) {
        recommendationPanel.textContent = 'No available tasks to recommend.'; return;
    }
    if (res.best) {
        const card = document.createElement('div'); card.className = 'js-panel rounded-xl';
        const title = document.createElement('div'); title.className = 'font-semibold'; title.textContent = res.best.title + ` — ${res.best.duration}m`;
        const meta = document.createElement('div'); meta.className = 'text-sm text-slate-300 mt-1'; meta.textContent = `${res.best.priority} priority${res.best.due ? ' · due ' + humanDue(res.best) : ''}`;
        const actBtn = document.createElement('button'); actBtn.textContent = 'Start'; actBtn.className = 'mt-3 px-3 py-1 rounded-md bg-emerald-400 text-slate-900 font-semibold'; actBtn.onclick = () => { toggleComplete(res.best.id); recommendationPanel.innerHTML = ''; renderAll(); };
        card.appendChild(title); card.appendChild(meta); card.appendChild(actBtn);
        recommendationPanel.appendChild(card);
    } else {
        const note = document.createElement('div'); note.textContent = `No task fits within ${minutes}m — top priorities you could start:`; recommendationPanel.appendChild(note);
    }

    if (res.alternatives && res.alternatives.length > 0) {
        const list = document.createElement('div'); list.className = 'mt-2 space-y-2';
        res.alternatives.forEach(t => {
            const el = document.createElement('div'); el.className = 'flex justify-between py-2';
            const left = document.createElement('div'); left.className = 'text-sm text-slate-200'; left.textContent = `${t.title} — ${t.duration}m · ${t.priority}`;
            const right = document.createElement('div');
            const start = document.createElement('button'); start.textContent = 'Start'; start.className = 'px-3 py-1 rounded-md bg-white/5 text-sm'; start.onclick = () => { toggleComplete(t.id); renderAll(); recommendationPanel.innerHTML = ''; };
            right.appendChild(start);
            el.appendChild(left); el.appendChild(right);
            list.appendChild(el);
        });
        recommendationPanel.appendChild(list);
    }
}

function renderAll() {
    renderDepsOptions(); renderTasks();
}

// wire up chips
// manage active chip styles (Tailwind classes)
function clearDurationActive() {
    durationChips.querySelectorAll('button').forEach(x => {
        x.classList.remove('bg-sky-500', 'text-slate-900', 'font-semibold');
        x.classList.add('bg-white/5', 'text-slate-200');
    });
}
function clearPriorityActive() {
    priorityChips.querySelectorAll('button').forEach(x => {
        x.classList.remove('bg-amber-400', 'text-slate-900', 'font-semibold');
        x.classList.add('bg-white/5', 'text-slate-200');
    });
}
durationChips.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    clearDurationActive();
    b.classList.remove('bg-white/5', 'text-slate-200');
    b.classList.add('bg-sky-500', 'text-slate-900', 'font-semibold');
    selectedDuration = Number(b.dataset.min);
    customDuration.value = '';
});
priorityChips.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    clearPriorityActive();
    b.classList.remove('bg-white/5', 'text-slate-200');
    b.classList.add('bg-amber-400', 'text-slate-900', 'font-semibold');
    selectedPriority = b.dataset.priority;
});

form.addEventListener('submit', addTask);
recommendBtn.addEventListener('click', () => {
    const mins = Number(availableMinutesInput.value);
    const res = recommend(mins);
    renderRecommendation(res, mins);
});

// initial sample data (only if empty)
if (state.tasks.length === 0) {
    state.tasks.push({ id: uid(), title: 'Write project outline', duration: 30, priority: 'High', deps: [], completed: false, due: null, createdAt: new Date().toISOString() });
    state.tasks.push({ id: uid(), title: 'Read research notes', duration: 60, priority: 'Medium', deps: [], completed: false, due: null, createdAt: new Date().toISOString() });
    state.tasks.push({ id: uid(), title: 'Email collaborator', duration: 10, priority: 'High', deps: [], completed: false, due: null, createdAt: new Date().toISOString() });
    save(state);
}

renderAll();
