import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, AlertTriangle, Volume2, CheckCircle2, 
  ChevronLeft, ChevronRight, Sparkles, Camera, 
  Smile, Puzzle, ClipboardCheck, Stethoscope,
  Moon, Pill, Palette, Coffee, Sun, Droplets, Eye, Brain, Layout,
  Music, Play, Pause 
} from 'lucide-react';

const GAME_UI = {
  MemoryMatch: { title: "Heritage Match", detail: "Match pairs of local birds", icon: Eye, color: "bg-emerald-50 text-emerald-600 border-emerald-200", tip: "Clinically exercises your visual recall!" },
  RoutineRecall: { title: "Routine Flowchart", detail: "Order your daily schedule", icon: Layout, color: "bg-blue-50 text-blue-600 border-blue-200", tip: "Maintains executive functioning & logic." },
  TrayGame: { title: "Remember the Tray", detail: "Memorize the hidden objects", icon: Brain, color: "bg-amber-50 text-amber-600 border-amber-200", tip: "Strengthens short-term working memory." }
};

export default function PatientDashboard({ onNavigate, currentScreen, gameHistory = [] }) {
  const [dayPhase, setDayPhase] = useState('morning');
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showSosModal, setShowSosModal] = useState(false);
  
  // --- AUDIO PLAYER STATE & REF ---
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef(null);

  const toggleMusic = () => {
    // Initialize the audio object on the very first click
    if (!audioRef.current) {
      audioRef.current = new Audio('/calming-music.mp3'); // Points to the file in your public folder
      audioRef.current.loop = true; // Loops the song continuously 
    }

    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().catch(err => console.error("Audio playback blocked:", err));
      setIsPlayingMusic(true);
    }
  };

  // --- CLEANUP (Stops music if they switch tabs) ---
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // --- AI RECOMMENDATION ENGINE ---
  const getRecommendedGame = () => {
    const pool = ['MemoryMatch', 'RoutineRecall', 'TrayGame'];
    if (gameHistory.length === 0) return 'MemoryMatch';

    const stats = {};
    gameHistory.forEach(g => {
      if (!stats[g.gameId]) stats[g.gameId] = { errors: 0, count: 0 };
      stats[g.gameId].errors += g.errors;
      stats[g.gameId].count += 1;
    });

    let worstGame = pool[0];
    let maxErrorRate = -1;

    pool.forEach(game => {
      const gameStats = stats[game];
      if (!gameStats) {
        maxErrorRate = 999;
        worstGame = game;
      } else {
        const rate = gameStats.errors / gameStats.count;
        if (rate > maxErrorRate) {
          maxErrorRate = rate;
          worstGame = game;
        }
      }
    });
    return worstGame;
  };

  const recommendedGameId = getRecommendedGame();
  const gameData = GAME_UI[recommendedGameId];

  // --- AUTO-VERIFICATION ---
  const todayStr = new Date().toDateString();
  const hasPlayedGameToday = gameHistory.some(g => 
    new Date(g.timestamp).toDateString() === todayStr && 
    ['MemoryMatch', 'RoutineRecall', 'TrayGame'].includes(g.gameId)
  );

  // --- DYNAMIC TASK LIST ---
  const TASKS = [
    {
      id: 'physical_task', category: "HEALTH ☀️", title: "Drink Water & Walk", detail: "1 Large Glass + 5 mins gentle morning sun",
      tip: "Keeps memory sharp and body hydrated!", icon: Droplets, color: "bg-cyan-50 text-cyan-600 border-cyan-200"
    },
    {
      id: 'cognitive_task', category: "AI RECOMMENDED 🧠", title: gameData.title, detail: gameData.detail,
      tip: gameData.tip, icon: gameData.icon, color: gameData.color
    }
  ];

  const [manualCompletedTasks, setManualCompletedTasks] = useState([]);
  const isTaskCompleted = (taskId) => {
    if (taskId === 'cognitive_task') return hasPlayedGameToday;
    return manualCompletedTasks.includes(taskId);
  };

  const handleTaskComplete = () => {
    const currentTaskId = TASKS[currentTaskIndex].id;
    if (currentTaskId === 'cognitive_task' && !hasPlayedGameToday) {
      onNavigate('therapy');
      return;
    }
    
    if (!manualCompletedTasks.includes(currentTaskId)) {
      setManualCompletedTasks([...manualCompletedTasks, currentTaskId]);
    }
    if (currentTaskIndex < TASKS.length - 1) {
      setTimeout(() => setCurrentTaskIndex(currentTaskIndex + 1), 600);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      const hour = now.getHours();
      setDayPhase(hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening');
    };
    updateTime();
    const int = setInterval(updateTime, 60000);
    return () => clearInterval(int);
  }, []);

  const currentTask = TASKS[currentTaskIndex];
  const isCurrentCompleted = isTaskCompleted(currentTask.id);

  return (
    <div className="min-h-screen bg-[#F4F9F7] text-slate-800 flex justify-center items-start p-2 sm:p-4 select-none font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden relative min-h-[850px]">
        
        {/* HEADER */}
        <header className="p-4 pb-2 bg-white flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-bold text-lg text-slate-800 tracking-tight">CareCompanion</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">● Offline</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">🔒 SQLCipher Synced</p>
            </div>
          </div>
          <button onClick={() => setShowSosModal(true)} className="flex items-center space-x-1 bg-red-600 text-white font-black px-3.5 py-2 rounded-2xl shadow-md animate-pulse">
            <AlertTriangle className="w-4 h-4 fill-white" /> <span className="text-sm tracking-wide">SOS</span>
          </button>
        </header>

        {/* MASCOT / COMPANION BANNER */}
        <section className="mx-4 my-3 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-2xl border shadow-inner flex items-center justify-center text-2xl border-slate-200">🐕</div>
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                <span className="uppercase">DADU'S SPARK ☀️</span>
                <span className="text-slate-400 font-normal">• {currentTimeStr}</span>
              </div>
              <p className="text-xs text-slate-700 font-medium mt-0.5">"{hasPlayedGameToday ? "Great job doing your therapy!" : "Ready for today's puzzle?"}"</p>
            </div>
          </div>
          <Volume2 className="w-5 h-5 text-amber-800" />
        </section>

        <div className="flex-1 overflow-y-auto pb-32 [&::-webkit-scrollbar]:hidden">
          {/* MAIN INTERACTIVE TASK CARD */}
          <main className="p-4">
            <div className="border-2 border-emerald-600 rounded-3xl p-5 bg-white shadow-sm flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span className="text-xs font-black tracking-wider text-emerald-800 uppercase">Current Action</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Step {currentTaskIndex + 1} of {TASKS.length}</span>
                </div>

                <div className="mt-4 flex items-start space-x-4">
                  <div className={`p-4 rounded-2xl border ${currentTask.color} flex items-center justify-center`}>
                    {React.createElement(currentTask.icon, { className: "w-8 h-8" })}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">{currentTask.category}</span>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-tight mt-0.5">{currentTask.title}</h2>
                    <p className="text-sm font-medium text-slate-600 mt-1.5">{currentTask.detail}</p>
                  </div>
                </div>

                <div className="mt-5 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-slate-700 font-medium pr-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="leading-tight">{currentTask.tip}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button 
                  onClick={handleTaskComplete} 
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 shadow-md active:scale-[0.98] transition-all ${isCurrentCompleted ? "bg-slate-100 text-emerald-700 border-2 border-emerald-500" : "bg-[#0A5C4A] text-white"}`}
                >
                  <CheckCircle2 className={`w-6 h-6 ${isCurrentCompleted ? "text-emerald-600" : "text-emerald-300"}`} />
                  <span>
                    {isCurrentCompleted 
                      ? "Completed! 🎉" 
                      : currentTask.id === 'cognitive_task' ? `Play ${currentTask.title} Now` : "Done! Tap Here To Finish"}
                  </span>
                </button>

                <div className="flex items-center justify-between mt-4 px-2">
                  <button disabled={currentTaskIndex === 0} onClick={() => setCurrentTaskIndex(currentTaskIndex - 1)} className="flex items-center space-x-1 text-xs font-bold text-slate-500 disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" /> <span>Previous</span>
                  </button>
                  <div className="flex space-x-1.5">
                    {TASKS.map((_, idx) => (
                      <span key={idx} className={`h-2 rounded-full transition-all ${idx === currentTaskIndex ? "w-6 bg-emerald-600" : "w-2 bg-slate-200"}`} />
                    ))}
                  </div>
                  <button disabled={currentTaskIndex === TASKS.length - 1} onClick={() => setCurrentTaskIndex(currentTaskIndex + 1)} className="flex items-center space-x-1 text-xs font-bold text-slate-500 disabled:opacity-30">
                    <span>Next Task</span> <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </main>

          {/* PASSIVE COGNITIVE THERAPY (CALMING ANCHOR) */}
          <section className="mx-4 mb-8 space-y-3">
            <h3 className="text-[11px] font-black tracking-widest text-slate-400 uppercase ml-1">Calming Anchor</h3>
            
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
              <p className="text-sm font-semibold text-slate-600 italic">
                "Breathe in the calm. You are safe, you are loved, and you are right where you need to be."
              </p>
            </div>

            {/* FULLY FUNCTIONAL AUDIO PLAYER */}
            <div className={`bg-[#0A5C4A] p-4 rounded-2xl shadow-md flex items-center justify-between text-white transition-all duration-500 ${isPlayingMusic ? "shadow-emerald-900/30 ring-4 ring-emerald-500/20" : ""}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${isPlayingMusic ? "bg-emerald-400/30 animate-pulse" : "bg-white/20"}`}>
                  <Music className="w-6 h-6 text-emerald-100" />
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-0.5">Evening Radio</h3>
                  <p className="text-sm font-extrabold text-white">Classic Calming Flute</p>
                </div>
              </div>
              <button 
                onClick={toggleMusic}
                className="w-12 h-12 bg-white text-[#0A5C4A] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                {isPlayingMusic ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
              </button>
            </div>
          </section>
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="absolute bottom-0 w-full border-t border-slate-100 bg-white px-2 py-2 flex items-center justify-between z-10 rounded-b-3xl">
          {[
            { id: 'daily_fun', label: 'Daily Fun', icon: Smile },
            { id: 'therapy', label: 'Therapy Games', icon: Puzzle },
            { id: 'tasks', label: 'Tasks', icon: ClipboardCheck },
            { id: 'doctor', label: 'Doctor Care', icon: Stethoscope },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)} className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all ${isActive ? "bg-emerald-200/50 text-[#0A5C4A]" : "text-slate-500 hover:text-slate-700"}`}>
                <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                <span className={`text-[10px] ${isActive ? "font-extrabold" : "font-medium"}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}