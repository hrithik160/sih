import React, { useState, useEffect } from 'react';
import PatientDashboard from './PatientDashboard';
import TherapySuite from './TherapySuite';
import TaskDashboard from './TaskDashboard';
import DoctorCare from './DoctorCare';
import DoctorPortal from './DoctorPortal'; // IMPORT THE NEW PORTAL
import { Clock, AlertTriangle, CheckCircle2, User, Stethoscope } from 'lucide-react';

export default function App() {
  // HACKATHON DEMO SWITCH: Toggles between Patient Tablet and Doctor Web Portal
  const [appMode, setAppMode] = useState('patient'); // 'patient' or 'doctor'

  const [currentScreen, setCurrentScreen] = useState('daily_fun');
  const [activeAlarm, setActiveAlarm] = useState(null);

  const [gameHistory, setGameHistory] = useState(() => {
    const saved = localStorage.getItem('smritiner_game_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('smritiner_game_history', JSON.stringify(gameHistory));
  }, [gameHistory]);

  const saveGameResult = (gameId, latency, errors, durationSec) => {
    const newRecord = { id: Date.now(), gameId, timestamp: new Date().toISOString(), latency, errors, durationSec };
    setGameHistory(prev => [...prev, newRecord]);
  };

  const [routines, setRoutines] = useState([
    { id: 1, title: 'Warm Water', time: '08:00', status: 'done', requiresPhoto: false },
    { id: 2, title: 'Morning Walk', time: '09:30', status: 'done', requiresPhoto: false },
    { id: 3, title: 'Blood Pressure Pill', time: '19:30', status: 'pending', requiresPhoto: true }, 
  ]);

  const [prescribedGame, setPrescribedGame] = useState(null);

  // ALARM CLOCK (Only ring if we are looking at the Patient App)
  useEffect(() => {
    if (appMode === 'doctor') return; // Don't ring alarm on doctor's computer

    const checkAlarms = setInterval(() => {
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const dueTask = routines.find(r => r.time === timeString && r.status === 'pending');
      if (dueTask && (!activeAlarm || activeAlarm.id !== dueTask.id)) setActiveAlarm(dueTask);
    }, 10000);
    return () => clearInterval(checkAlarms);
  }, [routines, activeAlarm, appMode]);

  const quickDismissTask = (taskId) => {
    setRoutines(routines.map(r => r.id === taskId ? { ...r, status: 'done' } : r));
    setActiveAlarm(null);
  };

  const renderPatientApp = () => {
    if (currentScreen === 'therapy') return <TherapySuite onNavigate={setCurrentScreen} currentScreen={currentScreen} saveGameResult={saveGameResult} />;
    if (currentScreen === 'tasks') return <TaskDashboard onNavigate={setCurrentScreen} currentScreen={currentScreen} routines={routines} setRoutines={setRoutines} />;
    if (currentScreen === 'doctor') return <DoctorCare onNavigate={setCurrentScreen} currentScreen={currentScreen} />;
    return <PatientDashboard onNavigate={setCurrentScreen} currentScreen={currentScreen} gameHistory={gameHistory} prescribedGame={prescribedGame} />;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${appMode === 'doctor' ? 'bg-slate-900' : 'bg-[#F4F9F7]'}`}>
      
      {/* --- HACKATHON DEMO TOGGLE BUTTON --- */}
      <div className="fixed top-4 right-4 z-[100] bg-white p-1 rounded-full shadow-xl flex items-center border border-slate-200">
        <button 
          onClick={() => setAppMode('patient')} 
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center space-x-2 transition-all ${appMode === 'patient' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <User className="w-4 h-4" /> <span>Patient Tablet</span>
        </button>
        <button 
          onClick={() => setAppMode('doctor')} 
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center space-x-2 transition-all ${appMode === 'doctor' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Stethoscope className="w-4 h-4" /> <span>Doctor Web Portal</span>
        </button>
      </div>
      {/* ------------------------------------ */}

      {/* RENDER THE SELECTED APP */}
      {appMode === 'patient' ? renderPatientApp() : (
        <DoctorPortal 
          routines={routines} 
          setRoutines={setRoutines} 
          gameHistory={gameHistory} 
          prescribedGame={prescribedGame} 
          setPrescribedGame={setPrescribedGame} 
        />
      )}

      {/* PATIENT GLOBAL ALARM OVERLAY */}
      {activeAlarm && appMode === 'patient' && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border-[3px] border-red-500 animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-100 text-red-700 font-extrabold px-3 py-1.5 rounded-full text-xs flex items-center animate-pulse">
                <Clock className="w-4 h-4 mr-1.5" /> TASK DUE NOW
              </div>
              <span className="text-slate-500 font-bold text-sm">
                 {new Date(`2000-01-01T${activeAlarm.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">{activeAlarm.title}</h2>
            {activeAlarm.requiresPhoto ? (
              <button onClick={() => { setActiveAlarm(null); setCurrentScreen('tasks'); }} className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 text-lg mt-6">Open Camera Audit</button>
            ) : (
              <button onClick={() => quickDismissTask(activeAlarm.id)} className="w-full bg-[#0A5C4A] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 text-lg flex justify-center items-center mt-6"><CheckCircle2 className="w-6 h-6 mr-2" /> Mark as Done</button>
            )}
            <button onClick={() => setActiveAlarm(null)} className="w-full bg-slate-100 text-slate-500 font-bold py-3 rounded-2xl text-sm hover:bg-slate-200 mt-3">Remind me later</button>
          </div>
        </div>
      )}
    </div>
  );
}