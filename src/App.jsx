import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'focus-minutes:v1'
const PREFS_KEY = 'focus-minutes:prefs:v1'

function uid() { return Math.random().toString(36).slice(2, 9) }

function loadState() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : { tasks: [] } } catch (e) { return { tasks: [] } } }
function saveState(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }

export default function App() {
    const [state, setState] = useState(loadState())
    const [title, setTitle] = useState('')
    const [customDuration, setCustomDuration] = useState('')
    const [selectedDuration, setSelectedDuration] = useState(30)
    const [selectedPriority, setSelectedPriority] = useState('Medium')
    const [deps, setDeps] = useState([])
    const [due, setDue] = useState('')
    const [available, setAvailable] = useState('')
    const [recommendation, setRecommendation] = useState(null)

    useEffect(() => { // load prefs
        try { const p = JSON.parse(localStorage.getItem(PREFS_KEY)); if (p) { if (p.selectedDuration) setSelectedDuration(p.selectedDuration); if (p.selectedPriority) setSelectedPriority(p.selectedPriority); } } catch (e) { }
    }, [])

    useEffect(() => { saveState(state) }, [state])

    function addTask(e) {
        e?.preventDefault()
        if (!title.trim()) return
        const dur = customDuration && Number(customDuration) > 0 ? Number(customDuration) : selectedDuration
        const t = { id: uid(), title: title.trim(), duration: dur, priority: selectedPriority, deps, completed: false, due: due || null, createdAt: new Date().toISOString() }
        const next = { ...state, tasks: [...state.tasks, t] }
        setState(next)
        setTitle(''); setCustomDuration(''); setDeps([]); setDue('')
        // persist prefs
        try { localStorage.setItem(PREFS_KEY, JSON.stringify({ selectedDuration, selectedPriority })) } catch (e) { }
    }

    function toggleComplete(id) {
        const tasks = state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
        setState({ ...state, tasks })
    }
    function deleteTask(id) {
        const tasks = state.tasks.filter(t => t.id !== id).map(t => ({ ...t, deps: t.deps.filter(d => d !== id) }))
        setState({ ...state, tasks })
    }

    function isBlocked(task) { if (!task.deps || task.deps.length === 0) return false; for (const d of task.deps) { const dep = state.tasks.find(x => x.id === d); if (!dep || !dep.completed) return true } return false }

    function scoreTask(task) {
        const pri = task.priority === 'High' ? 30 : task.priority === 'Medium' ? 18 : 8
        let urgency = 0
        if (task.due) { const days = Math.max(0, Math.floor((new Date(task.due) - new Date()) / (1000 * 60 * 60 * 24))); urgency = days <= 0 ? 20 : days <= 2 ? 12 : days <= 7 ? 6 : 0 }
        const lengthBonus = Math.max(0, 10 - Math.log(task.duration + 1))
        return pri + urgency + lengthBonus
    }

    function recommend(minutes) {
        const available = Number(minutes) || 0
        if (available <= 0) return { best: null, alternatives: [] }
        const candidates = state.tasks.filter(t => !t.completed && !isBlocked(t))
        const fitting = candidates.filter(t => t.duration <= available)
        const scored = fitting.map(t => ({ t, score: scoreTask(t) })).sort((a, b) => b.score - a.score)
        const best = scored.length ? scored[0].t : null
        const alternatives = scored.slice(1, 5).map(s => s.t)
        if (!best) { const fallback = candidates.map(t => ({ t, score: scoreTask(t) })).sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.t); return { best: null, alternatives: fallback } }
        return { best, alternatives }
    }

    function runRecommend() { const res = recommend(available); setRecommendation(res) }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <header className="mb-4">
                <h1 className="text-2xl font-semibold">Focus Minutes</h1>
                <p className="text-sm text-white/80">Turn spare minutes into meaningful wins</p>
            </header>

            <section className="bg-white/5 p-4 rounded-xl mb-4">
                <form onSubmit={addTask} className="space-y-3">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="New task title" className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/5 text-white" />

                    <div>
                        <div className="text-sm text-white/80">Duration</div>
                        <div className="flex gap-2 mt-2">
                            {[10, 30, 60].map(m => (
                                <button key={m} type="button" onClick={() => { setSelectedDuration(m); try { localStorage.setItem(PREFS_KEY, JSON.stringify({ selectedDuration: m, selectedPriority })) } catch (e) { } }} className={`px-3 py-1 rounded-full text-sm transition-colors duration-150 ${selectedDuration === m ? 'bg-sky-500 text-slate-900 font-semibold' : 'bg-white/5 text-white'}`}>{m}m</button>
                            ))}
                            <input value={customDuration} onChange={e => setCustomDuration(e.target.value)} placeholder="custom (min)" className="w-28 px-2 py-1 rounded-md bg-transparent border border-white/5 text-white" />
                        </div>
                    </div>

                    <div>
                        <div className="text-sm text-white/80">Priority</div>
                        <div className="flex gap-2 mt-2">
                            {['Low', 'Medium', 'High'].map(p => (
                                <button key={p} type="button" onClick={() => { setSelectedPriority(p); try { localStorage.setItem(PREFS_KEY, JSON.stringify({ selectedDuration, selectedPriority: p })) } catch (e) { } }} className={`px-3 py-1 rounded-full text-sm transition-colors duration-150 ${selectedPriority === p ? 'bg-sky-500 text-slate-900 font-semibold' : 'bg-white/5 text-white'}`}>{p}</button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="text-sm text-white/80">Depends on</div>
                        <select multiple size={3} value={deps} onChange={e => setDeps(Array.from(e.target.selectedOptions).map(o => o.value))} className="w-full mt-2 px-2 py-2 rounded-md bg-transparent border border-white/5 text-white">
                            {state.tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-2 items-center">
                        <input type="date" value={due} onChange={e => setDue(e.target.value)} className="px-2 py-1 rounded-md bg-transparent border border-white/5 text-white" />
                        <button className="px-4 py-2 rounded-lg bg-sky-500 text-slate-900 font-semibold">Add task</button>
                    </div>
                </form>
            </section>

            <section className="bg-white/5 p-4 rounded-xl mb-4">
                <h2 className="text-lg font-medium text-white">Find a task for spare time</h2>
                <div className="flex gap-2 mt-3">
                    <input value={available} onChange={e => setAvailable(e.target.value)} placeholder="Available minutes (e.g., 30)" className="w-40 px-2 py-1 rounded-md bg-transparent border border-white/5 text-white" />
                    <button onClick={runRecommend} className="px-3 py-1 rounded-md bg-emerald-400 text-slate-900 font-semibold">Recommend</button>
                </div>
                <div className="mt-3">
                    {recommendation ? (
                        <div>
                            {recommendation.best ? (
                                <div className="js-panel rounded-xl p-3">
                                    <div className="font-semibold">{recommendation.best.title} — {recommendation.best.duration}m</div>
                                    <div className="text-sm text-white/80 mt-1">{recommendation.best.priority} priority{recommendation.best.due ? ' · due ' + new Date(recommendation.best.due).toLocaleDateString() : ''}</div>
                                    <button onClick={() => { toggleComplete(recommendation.best.id); setRecommendation(null) }} className="mt-3 px-3 py-1 rounded-md bg-emerald-400 text-slate-900 font-semibold">Start</button>
                                </div>
                            ) : (
                                <div>No task fits within {available}m — top priorities you could start:</div>
                            )}
                            {recommendation.alternatives && recommendation.alternatives.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    {recommendation.alternatives.map(t => (
                                        <div key={t.id} className="flex justify-between py-2">
                                            <div className="text-sm text-white">{t.title} — {t.duration}m · {t.priority}</div>
                                            <div><button onClick={() => { toggleComplete(t.id); setRecommendation(null) }} className="px-3 py-1 rounded-md bg-white/5 text-sm">Start</button></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </section>

            <section>
                <h2 className="text-lg font-medium text-white">Tasks</h2>
                <div className="mt-3 space-y-3">
                    {state.tasks.length === 0 ? <small className="text-white/70">No tasks yet — add one above.</small> : (
                        state.tasks.sort((a, b) => (a.completed === b.completed ? (a.priority === b.priority ? new Date(a.createdAt) - new Date(b.createdAt) : (b.priority === 'High' ? 1 : b.priority === 'Medium' ? 2 : 3) - (a.priority === 'High' ? 1 : a.priority === 'Medium' ? 2 : 3)) : a.completed ? 1 : -1)).map(t => (
                            <div key={t.id} className="flex justify-between items-start p-3 rounded-xl bg-white/3 border border-white/5">
                                <div className="flex gap-3 items-start">
                                    <div>
                                        <div className={`font-medium ${t.completed ? 'opacity-50 line-through' : ''}`}>{t.title}</div>
                                        <div className="flex gap-2 items-center text-sm text-white/80 mt-2">
                                            <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-white">{t.duration}m</span>
                                            <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-white">{t.priority}</span>
                                            {t.due && <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-white">Due: {new Date(t.due).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${isBlocked(t) ? 'bg-rose-500 text-white' : 'bg-emerald-400 text-slate-900'}`}>{isBlocked(t) ? 'Blocked' : 'Ready'}</span>
                                    <button onClick={() => toggleComplete(t.id)} className="px-2 py-1 rounded-md bg-white/5 text-sm">{t.completed ? 'Undo' : 'Done'}</button>
                                    <button onClick={() => { if (confirm('Delete task?')) deleteTask(t.id) }} className="px-2 py-1 rounded-md bg-white/5 text-sm">Delete</button>
                                </div>
                                {t.deps && t.deps.length > 0 && <div className="text-sm text-white/80 mt-2">Depends on: {t.deps.map(d => { const dep = state.tasks.find(x => x.id === d); return dep ? dep.title + (dep.completed ? ' ✓' : ' ✗') : '(missing)' }).join(' · ')}</div>}
                            </div>
                        ))
                    )}
                </div>
            </section>

            <footer className="mt-6 text-sm text-white/80">Minimal, offline-first. Data saved in browser storage.</footer>
        </div>
    )
}
