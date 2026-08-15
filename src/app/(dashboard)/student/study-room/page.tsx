"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, CheckCircle2, Circle, Plus, Trash2, Headphones, Coffee, Brain, Timer } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

export default function StudyRoomPage() {
  const { uiMode } = useTheme();
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [todos, setTodos] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [showPlayer, setShowPlayer] = useState(false);

  // Load/Save Todos from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("study_room_todos");
    if (saved) setTodos(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("study_room_todos", JSON.stringify(todos));
  }, [todos]);

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
      audio.play().catch(() => {});
      toast.success(mode === "focus" ? "Fokus Selesai! Waktunya istirahat." : "Istirahat Selesai! Kembali fokus.");
      switchMode(mode === "focus" ? "break" : "focus");
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "focus" ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: "focus" | "break") => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === "focus" ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setTodos([{ id: Date.now().toString(), text: newTodo, done: false }, ...todos]);
    setNewTodo("");
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const totalTime = mode === "focus" ? 25 * 60 : 5 * 60;
  const strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;

  return (
    <div 
      className={cn(
        "min-h-[calc(100vh-100px)] overflow-hidden relative flex flex-col transition-all",
        uiMode === 'clean' 
          ? "bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] shadow-sm p-6 md:p-8" 
          : "rounded-3xl p-6 md:p-10 text-slate-100 shadow-xl bg-slate-900 bg-cover bg-center bg-no-repeat"
      )}
      style={uiMode === 'fun' ? { backgroundImage: `url('https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=2070')` } : {}}
    >
      {/* Background Overlay for Fun Mode */}
      {uiMode === 'fun' && (
        <>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-0" />
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 mix-blend-overlay opacity-50">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/30 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/30 blur-[120px] rounded-full" />
          </div>
        </>
      )}

      <div className="relative z-10 flex-1 flex flex-col max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50">
          <div>
            <h1 className={cn("text-3xl font-black tracking-tight flex items-center gap-3", uiMode === 'clean' ? "text-slate-800" : "text-white")}>
              {uiMode === 'clean' ? <Timer className="w-8 h-8 text-[#108B96]" /> : <Brain className="w-8 h-8 text-emerald-400" />}
              Ruang Belajar
            </h1>
            <p className={cn("font-medium mt-1", uiMode === 'clean' ? "text-slate-500" : "text-slate-400")}>Fokus belajar dengan Pomodoro dan musik Lofi.</p>
          </div>
          
          <button 
            onClick={() => setShowPlayer(!showPlayer)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all",
              uiMode === 'clean' 
                ? (showPlayer ? "bg-[#108B96] text-white shadow-md shadow-[#108B96]/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                : (showPlayer ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "bg-slate-800 text-slate-300 hover:bg-slate-700")
            )}
          >
            <Headphones className="w-5 h-5" /> 
            <span className="hidden sm:inline">Lofi Radio</span>
          </button>
        </div>

        {/* Lofi Player (Hidden by default) */}
        {showPlayer && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={cn(
              "mb-8 rounded-2xl overflow-hidden",
              uiMode === 'clean' ? "border border-slate-200 bg-slate-50 shadow-sm p-2" : "bg-slate-800 border-2 border-slate-700"
            )}
          >
            <iframe 
              width="100%" 
              height="150" 
              src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=0" 
              title="lofi hip hop radio - beats to relax/study to" 
              frameBorder="0" 
              className={cn(uiMode === 'clean' ? "rounded-xl" : "")}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row gap-10 items-center justify-center flex-1">
          
          {/* Timer Section */}
          <div className="flex flex-col items-center flex-1 w-full">
            <div className={cn(
              "flex items-center gap-2 p-1.5 rounded-2xl mb-10",
              uiMode === 'clean' ? "bg-white border border-[var(--border)] shadow-sm" : "bg-slate-800 border border-slate-700 rounded-full"
            )}>
              <button
                onClick={() => switchMode("focus")}
                className={cn(
                  "px-6 py-2 font-bold text-sm transition-all",
                  uiMode === 'clean' ? "rounded-xl" : "rounded-full",
                  mode === "focus" 
                    ? (uiMode === 'clean' ? "bg-[#108B96] text-white shadow-sm" : "bg-emerald-500 text-white shadow-md shadow-emerald-500/20")
                    : (uiMode === 'clean' ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-white")
                )}
              >
                Fokus (25m)
              </button>
              <button
                onClick={() => switchMode("break")}
                className={cn(
                  "px-6 py-2 font-bold text-sm transition-all flex items-center gap-2",
                  uiMode === 'clean' ? "rounded-xl" : "rounded-full",
                  mode === "break" 
                    ? (uiMode === 'clean' ? "bg-amber-500 text-white shadow-sm" : "bg-indigo-500 text-white shadow-md shadow-indigo-500/20")
                    : (uiMode === 'clean' ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-white")
                )}
              >
                <Coffee className="w-4 h-4" /> Istirahat (5m)
              </button>
            </div>

            <div className="relative flex items-center justify-center w-[300px] h-[300px] mb-10">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 260 260">
                <circle
                  cx="130"
                  cy="130"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className={uiMode === 'clean' ? "text-slate-100" : "text-slate-800"}
                />
                <motion.circle
                  cx="130"
                  cy="130"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={
                    mode === "focus" 
                      ? (uiMode === 'clean' ? "text-[#108B96]" : "text-emerald-500") 
                      : (uiMode === 'clean' ? "text-amber-500" : "text-indigo-500")
                  }
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={cn("text-6xl font-black tabular-nums tracking-tight", uiMode === 'clean' ? "text-slate-800" : "text-white")}>
                  {formatTime(timeLeft)}
                </span>
                <span className={cn("font-bold mt-2 uppercase tracking-widest text-sm", uiMode === 'clean' ? "text-slate-400" : "text-slate-400")}>
                  {mode === "focus" ? "Stay Focused" : "Take a Break"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTimer}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center text-white transition-transform active:scale-95 shadow-xl",
                  isActive 
                    ? (uiMode === 'clean' ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-700 hover:bg-slate-600")
                    : (mode === "focus" 
                        ? (uiMode === 'clean' ? "bg-[#108B96] hover:bg-[#0d737d] shadow-[#108B96]/20" : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20")
                        : (uiMode === 'clean' ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20" : "bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/20")
                      )
                )}
              >
                {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
              </button>
              <button
                onClick={resetTimer}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95",
                  uiMode === 'clean' 
                    ? "bg-white border-2 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    : "bg-slate-800 border-2 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700"
                )}
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Todo List Section */}
          <div className={cn(
            "w-full lg:w-96 p-6 flex flex-col h-[500px]",
            uiMode === 'clean' 
              ? "bg-white border border-[var(--border)] shadow-sm rounded-2xl"
              : "bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-[24px]"
          )}>
            <h2 className={cn("text-xl font-bold mb-6", uiMode === 'clean' ? "text-slate-800" : "text-white")}>Target Fokus</h2>
            
            <form onSubmit={addTodo} className="relative mb-6">
              <input
                type="text"
                placeholder="Apa yang ingin kamu selesaikan?"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                className={cn(
                  "w-full pl-4 pr-12 py-3 text-sm transition-all focus:outline-none",
                  uiMode === 'clean' 
                    ? "bg-[var(--bg-secondary)] border border-[var(--border)] text-slate-800 placeholder-slate-400 focus:border-[#108B96] focus:ring-1 focus:ring-[#108B96] rounded-xl"
                    : "bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl"
                )}
              />
              <button 
                type="submit"
                disabled={!newTodo.trim()}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white rounded-lg disabled:opacity-50 transition-all",
                  uiMode === 'clean' 
                    ? "bg-[#108B96] disabled:bg-slate-300" 
                    : "bg-emerald-500 disabled:bg-slate-700"
                )}
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {todos.length === 0 ? (
                <div className={cn("text-center mt-10 text-sm font-medium", uiMode === 'clean' ? "text-slate-400" : "text-slate-500")}>
                  Belum ada target. Tambahkan tugas pertamamu di atas!
                </div>
              ) : (
                todos.map(todo => (
                  <div key={todo.id} className={cn(
                    "group flex items-start gap-3 p-3 rounded-xl transition-all border",
                    uiMode === 'clean'
                      ? (todo.done ? "bg-slate-100/50 border-slate-100" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm")
                      : (todo.done ? "bg-slate-900/50 border-slate-800" : "bg-slate-800 border-slate-700 hover:border-slate-600")
                  )}>
                    <button onClick={() => toggleTodo(todo.id)} className="mt-0.5 shrink-0">
                      {todo.done ? (
                        <CheckCircle2 className={cn("w-5 h-5", uiMode === 'clean' ? "text-[#108B96]" : "text-emerald-500")} />
                      ) : (
                        <Circle className={cn("w-5 h-5 transition-colors", uiMode === 'clean' ? "text-slate-300 hover:text-[#108B96]" : "text-slate-500 hover:text-emerald-400")} />
                      )}
                    </button>
                    <span className={cn(
                      "flex-1 text-sm",
                      todo.done 
                        ? (uiMode === 'clean' ? "text-slate-400 line-through" : "text-slate-500 line-through")
                        : (uiMode === 'clean' ? "text-slate-700 font-medium" : "text-slate-200")
                    )}>
                      {todo.text}
                    </span>
                    <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
