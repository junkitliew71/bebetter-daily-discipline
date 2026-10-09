"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, CheckCircle2, Moon, Pencil, Plus, Sun, Trash2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

type Task = { id: string; title: string; completed: boolean; createdAt: number };
type Store = Record<string, { tasks: Task[] }>;
const STORAGE_KEY = "bebetter.daily-discipline.v1";
const dateKey = (date = new Date()) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const progressFor = (tasks: Task[]) => tasks.length ? Math.round(tasks.filter((task) => task.completed).length / tasks.length * 100) : 0;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

export default function Home() {
  const [today, setToday] = useState(dateKey());
  const [store, setStore] = useState<Store>({});
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [dark, setDark] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("bebetter.theme");
    const prefersDark = savedTheme === "dark" || (!savedTheme && matchMedia("(prefers-color-scheme: dark)").matches);
    setStore(readStore()); setDark(prefersDark); document.documentElement.classList.toggle("dark", prefersDark); setReady(true);
  }, []);
  useEffect(() => { const timer = window.setInterval(() => setToday(dateKey()), 30_000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }, [store, ready]);

  const tasks = store[today]?.tasks ?? [];
  const completed = tasks.filter((task) => task.completed).length;
  const progress = progressFor(tasks);
  const updateTasks = useCallback((updater: (tasks: Task[]) => Task[]) => setStore((current) => {
    const key = dateKey();
    return { ...current, [key]: { tasks: updater(current[key]?.tasks ?? []) } };
  }), []);
  const addTask = useCallback((title: string) => {
    const clean = title.trim();
    if (!clean) throw new Error("Task title cannot be empty.");
    const task = { id: crypto.randomUUID(), title: clean, completed: false, createdAt: Date.now() };
    updateTasks((current) => [...current, task]); return task;
  }, [updateTasks]);
  const submitTask = (event: FormEvent) => { event.preventDefault(); if (!draft.trim()) return; addTask(draft); setDraft(""); inputRef.current?.focus(); };
  const toggleTask = (id: string) => updateTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task));
  const removeTask = (id: string) => updateTasks((current) => current.filter((task) => task.id !== id));
  const saveEdit = (id: string) => { const clean = editingText.trim(); if (!clean) return; updateTasks((current) => current.map((task) => task.id === id ? { ...task, title: clean } : task)); setEditingId(null); };
  const toggleTheme = () => { const next = !dark; setDark(next); document.documentElement.classList.toggle("dark", next); localStorage.setItem("bebetter.theme", next ? "dark" : "light"); };
  const history = useMemo(() => Object.entries(store).filter(([key]) => key < today).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7), [store, today]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => unknown } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: unknown) => { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })); } catch {} };
    register({ name: "add_daily_task", title: "Add daily task", description: "Add a task to today's BeBetter list.", inputSchema: { type: "object", properties: { title: { type: "string", minLength: 1 } }, required: ["title"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input: unknown) => { const title = (input as { title?: unknown })?.title; if (typeof title !== "string" || !title.trim()) throw new Error("A non-empty title is required."); const task = addTask(title); return { id: task.id, title: task.title, completed: false }; } });
    register({ name: "read_daily_progress", title: "Read daily progress", description: "Read today's task totals and completion percentage.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: () => ({ date: today, completed, total: tasks.length, percentage: progress }) });
    return () => lifecycle.abort();
  }, [addTask, completed, progress, tasks.length, today]);

  const todayLabel = new Intl.DateTimeFormat("en-SG", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-8"><div className="mx-auto max-w-[1120px]">
      <header className="mb-7 flex items-center justify-between sm:mb-10"><a href="#today" className="brand" aria-label="BeBetter home"><span>be</span>better<span className="brand-dot">.</span></a><button className="icon-button" onClick={toggleTheme} aria-label={dark ? "Use light mode" : "Use dark mode"}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button></header>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7">
        <section id="today" className="panel task-panel"><div className="mb-7"><p className="eyebrow">{todayLabel}</p><h1>One step at a time.</h1></div>
          <form onSubmit={submitTask} className="task-form"><label className="sr-only" htmlFor="new-task">What do you want to accomplish today?</label><input ref={inputRef} id="new-task" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="What do you want to accomplish today?" autoComplete="off" /><button type="submit" disabled={!draft.trim()}><Plus size={19} /><span>Add task</span></button></form>
          <div className="mt-6 space-y-3" aria-live="polite">{!ready ? <div className="empty-state">Loading your day…</div> : tasks.length === 0 ? <div className="empty-state"><span className="empty-icon"><CheckCircle2 size={25} /></span><p>Your day is wide open.</p><span>Add your first task and begin.</span></div> : tasks.map((task) => <article key={task.id} className={`task-card ${task.completed ? "is-complete" : ""}`}><Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} aria-label={`Mark ${task.title} as ${task.completed ? "incomplete" : "complete"}`} className="task-checkbox" />{editingId === task.id ? <form className="edit-form" onSubmit={(event) => { event.preventDefault(); saveEdit(task.id); }}><input autoFocus value={editingText} onChange={(event) => setEditingText(event.target.value)} aria-label="Edit task title" /><button type="submit" aria-label="Save task"><Check size={17} /></button><button type="button" onClick={() => setEditingId(null)} aria-label="Cancel editing"><X size={17} /></button></form> : <><p>{task.title}</p><div className="task-actions"><button onClick={() => { setEditingId(task.id); setEditingText(task.title); }} aria-label={`Edit ${task.title}`}><Pencil size={16} /></button><button onClick={() => removeTask(task.id)} aria-label={`Delete ${task.title}`}><Trash2 size={16} /></button></div></>}</article>)}</div>
        </section>
        <aside className="space-y-5"><section className="panel progress-panel"><div className="section-label"><span>Today&apos;s progress</span><span className="pulse-dot" /></div><div className="percentage"><span>{progress}</span>%</div><Progress value={progress} className="progress-track" aria-label={`${progress}% complete`} /><div className="progress-meta"><span>{completed} of {tasks.length} tasks completed</span><span>{tasks.length ? (progress === 100 ? "Day complete" : "Keep going") : "Ready when you are"}</span></div></section>
          <section className="panel history-panel"><div className="section-label"><span>Recent days</span><CalendarDays size={17} /></div>{history.length === 0 ? <p className="history-empty">Your completed days will appear here.</p> : <div className="history-list">{history.map(([key, record]) => { const percent = progressFor(record.tasks); const label = new Intl.DateTimeFormat("en-SG", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${key}T12:00:00`)); return <div className="history-row" key={key}><div><strong>{label}</strong><span>{record.tasks.filter((task) => task.completed).length}/{record.tasks.length} completed</span></div><div className="history-score" style={{ "--score": `${percent}%` } as React.CSSProperties}>{percent}%</div></div>; })}</div>}</section>
        </aside>
      </div><footer>Small steps. Stronger days.</footer>
    </div></main>
  );
}
