import React, { useState } from 'react';
import { 
  Stethoscope, LineChart, ListChecks, Brain, 
  Trash2, Plus, Settings2, Activity
} from 'lucide-react';

export default function DoctorPortal({ routines, setRoutines, gameHistory, prescribedGame, setPrescribedGame }) {
  const [activeTab, setActiveTab] = useState('analytics');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');

  const generateChartData = () => {
    if (gameHistory.length === 0) {
      return [
        { day: 'Mon', score: 45 }, { day: 'Tue', score: 55 }, 
        { day: 'Wed', score: 50 }, { day: 'Thu', score: 65 }, { day: 'Fri', score: 70 }
      ];
    }
    return gameHistory.slice(-5).map((g, i) => ({
      day: `S${i+1}`,
      score: Math.max(0, 100 - (g.errors * 15))
    }));
  };

  const chartData = generateChartData();

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskTime) return;
    setRoutines([...routines, { id: Date.now(), title: newTaskTitle, time: newTaskTime, status: 'pending', requiresPhoto: false }].sort((a, b) => a.time.localeCompare(b.time)));
    setNewTaskTitle('');
    setNewTaskTime('');
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-slate-800 flex flex-col overflow-hidden relative min-h-[850px]">
      {/* DOCTOR HEADER */}
      <header className="px-4 py-4 bg-[#0F172A] text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
            <Stethoscope className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-slate-300">CareCompanion AWS Portal</h1>
            <div className="text-lg font-black tracking-wide flex items-center">
              Patient: Dadu Ji
            </div>
          </div>
        </div>
        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold border border-emerald-500/30 flex items-center">
          <Activity className="w-3 h-3 mr-1 animate-pulse" /> CLOUD
        </span>
      </header>

      {/* SUB-NAVIGATION */}
      <div className="bg-[#0F172A] px-2 pb-2">
        <div className="flex bg-slate-800 p-1 rounded-xl">
          <button onClick={() => setActiveTab('analytics')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${activeTab === 'analytics' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400'}`}>
            <LineChart className="w-3.5 h-3.5" /> <span>Analytics</span>
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${activeTab === 'tasks' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400'}`}>
            <ListChecks className="w-3.5 h-3.5" /> <span>Tasks</span>
          </button>
          <button onClick={() => setActiveTab('rx')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${activeTab === 'rx' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400'}`}>
            <Brain className="w-3.5 h-3.5" /> <span>Therapy Rx</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        {/* TAB 1: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="p-4 animate-in fade-in">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Cognitive Score Trend</h2>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
              <div className="flex items-end justify-between h-40 mb-2 gap-2">
                {chartData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="w-full bg-slate-100 rounded-t-md flex items-end relative overflow-hidden group-hover:bg-slate-200 h-full">
                      <div className="w-full bg-blue-500 rounded-t-md transition-all duration-1000 ease-out" style={{ height: `${data.score}%` }}></div>
                      <span className="absolute bottom-1 w-full text-center text-[10px] font-black text-white mix-blend-overlay">{data.score}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 border-t border-slate-100 pt-2">
                {chartData.map((data, i) => <span key={i} className="flex-1 text-center">{data.day}</span>)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Task Completion</span>
                <div className="text-2xl font-black text-emerald-900 mt-1">
                  {routines.length > 0 ? Math.round((routines.filter(r=>r.status==='done').length / routines.length) * 100) : 0}%
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-amber-600 uppercase">Avg Errors</span>
                <div className="text-2xl font-black text-amber-900 mt-1">
                  {gameHistory.length > 0 ? (gameHistory.reduce((acc, g) => acc + g.errors, 0) / gameHistory.length).toFixed(1) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TASKS */}
        {activeTab === 'tasks' && (
          <div className="p-4 animate-in fade-in">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Patient Schedule Override</h2>
            <form onSubmit={handleAddTask} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm mb-4">
              <div className="flex space-x-2 mb-2">
                <input type="text" placeholder="Clinical Task (e.g. Test Blood Sugar)" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none" />
                <input type="time" value={newTaskTime} onChange={(e) => setNewTaskTime(e.target.value)} className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm font-medium outline-none" />
              </div>
              <button type="submit" className="w-full bg-[#0F172A] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center">
                <Plus className="w-4 h-4 mr-1" /> Inject Task to Patient Device
              </button>
            </form>

            <div className="space-y-2">
              {routines.map(routine => (
                <div key={routine.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{routine.title}</h3>
                    <span className="text-xs font-medium text-slate-500">{new Date(`2000-01-01T${routine.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <button onClick={() => setRoutines(routines.filter(r => r.id !== routine.id))} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: THERAPY RX */}
        {activeTab === 'rx' && (
          <div className="p-4 animate-in fade-in">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Prescribe Cognitive Game</h2>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex items-start space-x-3 mb-6">
              <Settings2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-blue-900 leading-relaxed">
                Force a specific game to appear on the patient's dashboard to target a specific cognitive deficit, overriding the AI.
              </p>
            </div>

            <div className="space-y-3">
              <button onClick={() => setPrescribedGame(null)} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${prescribedGame === null ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-200'}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><Brain className="w-5 h-5" /></div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-900 text-sm">Auto-Adaptive (AI Engine)</h3>
                  </div>
                </div>
                {prescribedGame === null && <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded">ACTIVE</span>}
              </button>

              {[
                { id: 'MemoryMatch', title: 'Heritage Match', desc: 'Prescribe for Visual Memory' },
                { id: 'RoutineRecall', title: 'Routine Flowchart', desc: 'Prescribe for Logic & Flow' },
                { id: 'TrayGame', title: 'Remember the Tray', desc: 'Prescribe for Working Memory' }
              ].map(game => (
                <button key={game.id} onClick={() => setPrescribedGame(game.id)} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${prescribedGame === game.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
                  <div className="flex items-center space-x-3">
                    <div className="text-left">
                      <h3 className="font-bold text-slate-900 text-sm">{game.title}</h3>
                      <p className="text-[10px] text-slate-500 font-medium">{game.desc}</p>
                    </div>
                  </div>
                  {prescribedGame === game.id && <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded">PRESCRIBED</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}