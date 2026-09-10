import React, { useState, useEffect } from 'react';
import { liveQuery } from 'dexie'; // <-- Using Dexie's native query instead
import { db, seedInitialData } from './db';

import LoginGateway from './LoginGateway';
import PatientDashboard from './PatientDashboard';
import TherapySuite from './TherapySuite';
import TaskDashboard from './TaskDashboard';
import DoctorCare from './DoctorCare';
import DoctorPortal from './DoctorPortal';
import { Clock, AlertTriangle, CheckCircle2, LogOut } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('daily_fun');
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [prescribedGame, setPrescribedGame] = useState(null);

  // --- NEW: Bulletproof state for local DB ---
  const [gameHistory, setGameHistory] = useState([]);
  const [routines, setRoutines] = useState([]);

  // --- 1. INITIALIZE DATABASE ---
  useEffect(() => {
    seedInitialData().catch(console.error);
  }, []);

  // --- 2. NATIVE DEXIE SUBSCRIPTIONS (Bypassing the buggy hook) ---
  useEffect(() => {
    // Create live data streams
    const historyStream = liveQuery(() => db.telemetry_logs.toArray());
    const routinesStream = liveQuery(() => db.schedule_and_audit.toArray());

    // Subscribe to the streams to update React state instantly
    const historySub = historyStream.subscribe({
      next: (data) => setGameHistory(data || []),
      error: (err) => console.error(err)
    });

    const routinesSub = routinesStream.subscribe({
      next: (data) => setRoutines(data || []),
      error: (err) => console.error(err)
    });

    // Cleanup subscriptions when app closes
    return () => {
      historySub.unsubscribe();
      routinesSub.unsubscribe();
    };
  }, []);

  // --- 3. BACKGROUND ALARM CHECK ---
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'patient') return;

    const checkAlarms = setInterval(() => {
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const dueTask = routines.find(r => r.scheduled_time === timeString && r.is_completed === 0);
      
      if (dueTask && (!activeAlarm || activeAlarm.task_id !== dueTask.task_id)) {
        setActiveAlarm(dueTask);
      }
    }, 10000);
    return () => clearInterval(checkAlarms);
  }, [routines, activeAlarm, currentUser]);
  const currentUserRef = React.useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // --- 5. BACKGROUND AWS SYNC ENGINE (STORE & FORWARD) ---
  useEffect(() => {
    const syncDataToAWS = async () => {
      // 1. If the device has no Wi-Fi, don't even try.
      if (!navigator.onLine) return;

      try {
        // 2. Scoop up all local records that haven't been synced yet
        const unsyncedLogs = await db.telemetry_logs.where({ sync_status: 0 }).toArray();
        if (unsyncedLogs.length === 0) return; // Nothing to sync!

        const currentEmail = currentUserRef.current?.email || 'unknown';
        const logsWithEmail = unsyncedLogs.map(log => ({
           ...log,
           patient_email: (log.patient_email && log.patient_email !== 'unknown') ? log.patient_email : currentEmail
        }));

        // 3. Send the batch to the FastAPI Cloud Receiver
        const response = await fetch('http://localhost:8000/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: logsWithEmail })
        });

        if (response.ok) {
          // 4. Success! Mark all of these records as synced in the local database
          await Promise.all(
            unsyncedLogs.map(log => db.telemetry_logs.update(log.id, { sync_status: 1 }))
          );
          console.log(`☁️ Synced ${unsyncedLogs.length} records to AWS.`);
        }
      } catch (err) {
        // 5. If the server is down, fail silently. It will just try again later.
        console.warn("Backend unreachable. Keeping data in local offline storage.");
      }
    };

    // Run the sync engine every 5 seconds in the background
    const syncInterval = setInterval(syncDataToAWS, 5000);
    
    // Instantly try to sync the exact second the Wi-Fi turns back on
    window.addEventListener('online', syncDataToAWS);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('online', syncDataToAWS);
    };
  }, []);

  // --- 4. UPDATE DATABASE DIRECTLY WHEN TASK IS DONE ---
  const quickDismissTask = async (taskId) => {
    await db.schedule_and_audit.update(taskId, { is_completed: 1 });
    setActiveAlarm(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('daily_fun');
    setActiveAlarm(null);
  };

  if (!currentUser) {
    return <LoginGateway onLogin={(user) => setCurrentUser(user)} />;
  }

  const renderPatientView = () => {
    if (currentScreen === 'therapy') return <TherapySuite onNavigate={setCurrentScreen} currentScreen={currentScreen} currentUser={currentUser} />;
    if (currentScreen === 'tasks') return <TaskDashboard onNavigate={setCurrentScreen} currentScreen={currentScreen} routines={routines} />;
    if (currentScreen === 'doctor') return <DoctorCare onNavigate={setCurrentScreen} currentScreen={currentScreen} />;
    
    return <PatientDashboard onNavigate={setCurrentScreen} currentScreen={currentScreen} gameHistory={gameHistory} prescribedGame={prescribedGame} />;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-2 relative ${currentUser.role === 'doctor' ? 'bg-slate-900' : 'bg-[#F4F9F7]'}`}>
      
      <button onClick={handleLogout} className="fixed top-3 right-3 z-50 bg-white/90 backdrop-blur-md border border-slate-300 hover:border-red-400 text-slate-700 hover:text-red-600 px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all active:scale-95">
        <LogOut className="w-3.5 h-3.5" />
        <span>Exit / Switch Role</span>
      </button>

      {currentUser.role === 'patient' ? renderPatientView() : (
        <DoctorPortal 
          doctorInfo={currentUser}
          prescribedGame={prescribedGame} 
          setPrescribedGame={setPrescribedGame} 
        />
      )}

      {/* PATIENT GLOBAL ALARM POPUP */}
      {activeAlarm && currentUser.role === 'patient' && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border-[3px] border-red-500 animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-100 text-red-700 font-extrabold px-3 py-1.5 rounded-full text-xs flex items-center animate-pulse">
                <Clock className="w-4 h-4 mr-1.5" /> TASK DUE NOW
              </div>
              <span className="text-slate-500 font-bold text-sm">
                {new Date(`2000-01-01T${activeAlarm.scheduled_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">{activeAlarm.title}</h2>
            {activeAlarm.requires_photo === 1 ? (
              <button onClick={() => { setActiveAlarm(null); setCurrentScreen('tasks'); }} className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 text-lg mt-6">
                Open Camera Audit
              </button>
            ) : (
              <button onClick={() => quickDismissTask(activeAlarm.task_id)} className="w-full bg-[#0A5C4A] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 text-lg flex justify-center items-center mt-6">
                <CheckCircle2 className="w-6 h-6 mr-2" /> Mark as Done
              </button>
            )}
            <button onClick={() => setActiveAlarm(null)} className="w-full bg-slate-100 text-slate-500 font-bold py-3 rounded-2xl text-sm hover:bg-slate-200 mt-3">Remind me later</button>
          </div>
        </div>
      )}
    </div>
  );
}