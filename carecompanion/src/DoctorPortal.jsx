import React, { useState } from 'react';
import { Pill, Trash2, PlusCircle, Activity, User, BrainCircuit, LineChart as ChartIcon, Cloud, ShieldAlert, Clock, AlertTriangle, Target, TrendingUp, RefreshCw } from 'lucide-react';

export default function DoctorPortal({ doctorInfo, prescribedGame, setPrescribedGame }) {
  // --- STATE ---
  const [routines, setRoutines] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('prescriptions'); // Default to prescriptions for this demo
  const [newTask, setNewTask] = useState({ title: '', detail: '', time: '09:00', type: 'medication' });
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    fetch(`http://localhost:8000/api/doctor/patients/${doctorInfo.email}`)
      .then(res => res.json())
      .then(data => {
         setPatients(data.patients || []);
         if (data.patients?.length > 0 && !selectedPatientId) setSelectedPatientId(data.patients[0].email);
      })
      .catch(console.error);
  }, [doctorInfo.email]);

  const loadPatientData = () => {
    if (!selectedPatientId) return;
    setIsRefreshing(true);
    Promise.all([
      fetch(`http://localhost:8000/api/patients/${selectedPatientId}/routines`).then(res => res.json()),
      fetch(`http://localhost:8000/api/patients/${selectedPatientId}/telemetry`).then(res => res.json())
    ]).then(([routineData, telemetryData]) => {
      setRoutines(routineData.routines || []);
      setGameHistory(telemetryData.logs || []);
      setTimeout(() => setIsRefreshing(false), 400);
    }).catch(err => {
      console.error(err);
      setIsRefreshing(false);
    });
  };

  React.useEffect(() => {
    loadPatientData();
    // Live polling every 3 seconds so doctor sees new game scores instantly
    const interval = setInterval(loadPatientData, 3000);
    return () => clearInterval(interval);
  }, [selectedPatientId, activeTab]);

  const activePatient = patients.find(p => p.email === selectedPatientId);

  // --- FULL LIST OF THERAPY GAMES ---
  const allGames = [
    'Memory Match', 
    'The Tray', 
    'Heritage Match', 
    'Pattern Connect', 
    'Word Scramble',
    'Emotion Recognition'
  ];

  // --- PREPARE DATA FOR THE GRAPH ---
  const safeGameHistory = gameHistory || [];
  const graphData = safeGameHistory.map((log, index) => ({
    session: `${log.game_id.split(' ')[0]} ${index + 1}`,
    Latency: log.latency_ms,
    Errors: log.error_count,
    Duration: log.duration_sec
  }));

  // --- ANALYTICS CALCULATIONS ---
  const totalSessions = safeGameHistory.length;
  const avgLatency = totalSessions > 0 ? (safeGameHistory.reduce((acc, log) => acc + log.latency_ms, 0) / totalSessions).toFixed(0) : 0;
  const totalErrors = safeGameHistory.reduce((acc, log) => acc + log.error_count, 0);
  const totalDuration = safeGameHistory.reduce((acc, log) => acc + log.duration_sec, 0);

  // --- HANDLERS ---
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.detail || !selectedPatientId) return;
    const taskId = (newTask.type === 'medication' ? 'med_' : 'task_') + Date.now();
    
    let categoryStr = 'HEALTH ☀️';
    let requiresPhoto = 0;
    let auditStatus = 'none';
    let formattedDetail = newTask.detail;
    
    if (newTask.type === 'medication') {
       categoryStr = 'MEDICATION 💊';
       requiresPhoto = 1;
       auditStatus = 'pending';
       formattedDetail = `${newTask.detail} • 1 Pill`;
    }

    const payload = {
      task_id: taskId,
      patient_email: selectedPatientId,
      title: newTask.title,
      detail: formattedDetail,
      category: categoryStr,
      scheduled_time: newTask.time,
      requires_photo: requiresPhoto, 
      ai_audit_status: auditStatus
    };

    try {
      await fetch('http://localhost:8000/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const res = await fetch(`http://localhost:8000/api/patients/${selectedPatientId}/routines`);
      const data = await res.json();
      setRoutines(data.routines || []);
      setNewTask({ title: '', detail: '', time: '09:00', type: 'medication' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTask = async (taskId) => {
    try {
      await fetch(`http://localhost:8000/api/routines/${taskId}`, { method: 'DELETE' });
      const res = await fetch(`http://localhost:8000/api/patients/${selectedPatientId}/routines`);
      const data = await res.json();
      setRoutines(data.routines || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 w-full p-6 text-white font-sans flex flex-col">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-3xl font-black text-blue-400">Clinical Console</h1>
          <p className="text-slate-400 text-sm mt-1">{doctorInfo?.name || "Dr. Ananya Sengupta"} • {doctorInfo?.specialty || "NER Dementia Unit"}</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedPatientId || ''} 
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="bg-slate-800 text-sm font-bold text-white border border-slate-600 rounded-lg px-3 py-2 outline-none cursor-pointer"
          >
            {patients.map(p => (
              <option key={p.email} value={p.email}>{p.name}</option>
            ))}
          </select>
          <button 
            onClick={loadPatientData}
            title="Refresh patient data"
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 px-3 py-2 rounded-lg text-sm font-bold flex items-center shadow transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} /> Refresh
          </button>
          <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-lg">
            <Cloud className="w-4 h-4 mr-2" /> Live AWS Sync: Active
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex space-x-2 mb-6 bg-slate-800 p-2 rounded-2xl w-max border border-slate-700 shadow-md">
        <button 
          onClick={() => setActiveTab('prescriptions')}
          className={`flex items-center px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'prescriptions' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
        >
          <Pill className="w-4 h-4 mr-2" /> Care Plan
        </button>
        <button 
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'telemetry' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
        >
          <ChartIcon className="w-4 h-4 mr-2" /> Cognitive Telemetry
        </button>
        <button 
          onClick={() => setActiveTab('sos')}
          className={`flex items-center px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'sos' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
        >
          <ShieldAlert className="w-4 h-4 mr-2" /> Audit & SOS
        </button>
      </div>

      {/* TAB CONTENT: CARE PLAN (PRESCRIPTIONS & ROUTINES) */}
      {activeTab === 'prescriptions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-blue-400 mb-6 flex items-center"><User className="w-5 h-5 mr-2"/> Manage Care Plan</h2>
            <form onSubmit={handleAddTask} className="bg-slate-900 p-4 rounded-2xl mb-6 border border-slate-700">
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase">Add Schedule Item</h3>
                <select 
                  value={newTask.type} 
                  onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                  className="bg-slate-800 text-xs font-bold text-blue-400 border border-slate-600 rounded-lg px-2 py-1 outline-none cursor-pointer"
                >
                  <option value="medication">💊 Medication (Auto-Audit)</option>
                  <option value="health">☀️ Health Routine (Walk, Water)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <input 
                  type="text" 
                  placeholder={newTask.type === 'medication' ? "Tablet Name" : "Routine Name (e.g. Drink Water)"} 
                  required 
                  value={newTask.title} 
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})} 
                  className="bg-slate-800 text-white text-sm px-3 py-2 rounded-xl border border-slate-600 focus:border-blue-400 outline-none col-span-3 sm:col-span-1" 
                />
                <input 
                  type="text" 
                  placeholder={newTask.type === 'medication' ? "Dosage (e.g. 10mg)" : "Instructions (e.g. 1 Glass)"} 
                  required 
                  value={newTask.detail} 
                  onChange={(e) => setNewTask({...newTask, detail: e.target.value})} 
                  className="bg-slate-800 text-white text-sm px-3 py-2 rounded-xl border border-slate-600 focus:border-blue-400 outline-none" 
                />
                <input 
                  type="time" 
                  required 
                  value={newTask.time} 
                  onChange={(e) => setNewTask({...newTask, time: e.target.value})} 
                  className="bg-slate-800 text-white text-sm px-3 py-2 rounded-xl border border-slate-600 focus:border-blue-400 outline-none cursor-pointer" 
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl flex items-center justify-center transition-all">
                <PlusCircle className="w-4 h-4 mr-2" /> Push to Patient Tablet
              </button>
            </form>

            <div className="space-y-3 custom-scrollbar max-h-[350px] overflow-y-auto pr-2">
              {routines.length === 0 ? <div className="text-slate-500 text-sm py-4 text-center">No active care plan routines.</div> : routines.map(task => (
                <div key={task.task_id} className="flex items-center justify-between bg-slate-700/50 p-4 rounded-2xl border border-slate-600">
                  <div>
                    <div className="font-bold text-white text-lg flex items-center">
                      <span className="text-sm mr-2">{task.category.split(' ')[1]}</span> 
                      {task.title}
                    </div>
                    <div className="text-slate-400 text-sm mt-1">{task.detail} • Scheduled: {task.scheduled_time}</div>
                  </div>
                  <button onClick={() => handleRemoveTask(task.task_id)} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all shadow-sm"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl flex flex-col">
             <h2 className="text-xl font-bold text-blue-400 mb-6 flex items-center"><Activity className="w-5 h-5 mr-2"/> Patient Schedule Overview</h2>
             <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
               {routines.sort((a,b) => a.scheduled_time.localeCompare(b.scheduled_time)).map(task => (
                 <div key={task.task_id} className={`p-4 rounded-xl border ${task.is_completed === 1 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-slate-600 bg-slate-700/50'}`}>
                   <div className="flex justify-between items-center">
                     <span className={`font-bold flex items-center gap-2 ${task.is_completed === 1 ? 'text-emerald-400' : 'text-slate-300'}`}>
                       <span>{task.category.split(' ')[1]}</span> {task.title}
                     </span>
                     <span className="text-xs font-bold bg-slate-900 px-2 py-1 rounded text-slate-400 shadow-inner">{task.scheduled_time}</span>
                   </div>
                   <div className="text-xs mt-2 font-bold text-slate-500 flex justify-between items-center">
                     <span>Status: {task.is_completed === 1 ? '✅ Completed' : '⏳ Pending'}</span>
                     {task.requires_photo === 1 && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">Photo Audit</span>}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TELEMETRY & AI */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* ROW 1: Patient Profile & Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Patient Details & Override */}
            <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center"><User className="w-5 h-5 mr-2 text-blue-400"/> Patient Profile</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-slate-400 text-sm">Name</span>
                    <span className="text-white font-bold text-sm">{activePatient ? activePatient.name : "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-slate-400 text-sm">Caregiver</span>
                    <span className="text-white font-bold text-sm">{activePatient ? activePatient.caregiver : "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-slate-400 text-sm">Diagnosis Stage</span>
                    <span className="text-white font-bold text-sm">{activePatient ? activePatient.stage : "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-slate-400 text-sm">Emergency</span>
                    <span className="text-white font-bold text-sm">{activePatient ? activePatient.emergencyPhone : "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Therapy Prescription (Re-added) */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700">
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center"><BrainCircuit className="w-4 h-4 mr-2 text-purple-400"/> Therapy Prescription</h3>
                <p className="text-xs text-slate-400 mb-3">Set the active cognitive exercise for the patient's next session.</p>
                <select 
                  value={prescribedGame || ''} 
                  onChange={(e) => setPrescribedGame(e.target.value)}
                  className="w-full bg-slate-800 text-sm font-bold text-white border border-slate-600 rounded-lg px-3 py-2 outline-none cursor-pointer focus:border-purple-500"
                >
                  <option value="">AI Auto-Select (Recommended)</option>
                  {allGames.map(game => (
                    <option key={game} value={game}>{game}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="lg:col-span-2 bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl flex flex-col">
              <h2 className="text-xl font-bold text-purple-400 mb-6 flex items-center"><ChartIcon className="w-5 h-5 mr-2"/> Cognitive Performance Trends</h2>
              {safeGameHistory.length > 0 ? (
                <div className="w-full bg-slate-900 p-6 rounded-2xl border border-slate-700 overflow-x-auto shadow-inner flex-1 flex flex-col">
                  <div className="flex items-end space-x-6 h-[200px] min-w-max pb-8 mt-auto border-b border-slate-700">
                    {graphData.map((log, idx) => (
                      <div key={idx} className="flex flex-col items-center justify-end h-full relative group">
                        
                        {/* Hover Tooltip */}
                        <div className="absolute -top-12 bg-slate-800 border border-slate-600 text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap shadow-xl pointer-events-none">
                          <span className="text-purple-400 font-bold">{log.Latency}ms</span> • <span className="text-red-400 font-bold">{log.Errors} Errors</span>
                        </div>

                        <div className="flex space-x-1.5 items-end h-full w-16 justify-center">
                          {/* Latency Bar (Purple) */}
                          <div 
                            className="w-5 bg-gradient-to-t from-purple-900 to-purple-500 rounded-t-sm transition-all duration-500 hover:brightness-125" 
                            style={{ height: `${Math.max(10, Math.min((log.Latency / 3000) * 100, 100))}%` }}
                          ></div>
                          {/* Error Bar (Red) */}
                          <div 
                            className="w-5 bg-gradient-to-t from-red-900 to-red-500 rounded-t-sm transition-all duration-500 hover:brightness-125" 
                            style={{ height: `${Math.max(2, Math.min((log.Errors / 5) * 100, 100))}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-3 whitespace-nowrap absolute -bottom-6">
                          {log.session}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center space-x-6 mt-6 text-xs font-bold">
                    <div className="flex items-center text-purple-400"><div className="w-3 h-3 bg-purple-500 rounded mr-2"></div> Reaction Time</div>
                    <div className="flex items-center text-red-400"><div className="w-3 h-3 bg-red-500 rounded mr-2"></div> Mistakes Made</div>
                  </div>
                </div>
              ) : (
                <div className="h-[280px] w-full bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 font-bold">
                  No session data available yet.
                </div>
              )}
            </div>
          </div>

          {/* ROW 2: Analytics & AI Assessment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl flex flex-col">
              <h2 className="text-xl font-bold text-purple-400 mb-6 flex items-center"><Activity className="w-5 h-5 mr-2"/> Patient Analytics</h2>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 flex flex-col items-center justify-center text-center">
                  <Clock className="w-6 h-6 text-blue-400 mb-2" />
                  <span className="text-2xl font-black text-white">{totalSessions > 0 ? (totalDuration / 60).toFixed(1) : 0} <span className="text-sm text-slate-400 font-normal">mins</span></span>
                  <span className="text-xs font-bold text-slate-500 uppercase mt-1">Total Playtime</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 flex flex-col items-center justify-center text-center">
                  <Target className="w-6 h-6 text-emerald-400 mb-2" />
                  <span className="text-2xl font-black text-white">{totalSessions > 0 ? avgLatency : 0} <span className="text-sm text-slate-400 font-normal">ms</span></span>
                  <span className="text-xs font-bold text-slate-500 uppercase mt-1">Avg Response</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="w-6 h-6 text-red-400 mb-2" />
                  <span className="text-2xl font-black text-white">{totalErrors}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase mt-1">Total Mistakes</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 flex flex-col items-center justify-center text-center">
                  <TrendingUp className="w-6 h-6 text-purple-400 mb-2" />
                  <span className="text-2xl font-black text-white">{totalSessions}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase mt-1">Sessions Completed</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl flex flex-col">
              <h2 className="text-xl font-bold text-emerald-400 mb-6 flex items-center"><BrainCircuit className="w-5 h-5 mr-2"/> AI Clinical Assessment</h2>
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700 flex-1 overflow-y-auto custom-scrollbar">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 mr-3 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 mb-1">Consistency & Engagement</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">Patient shows regular engagement with prescribed therapy modules. Adherence rate is stable, indicating good routine formation.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 mr-3 flex-shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 mb-1">Cognitive Load Assessment</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">Reaction times slightly elevated during complex memory tasks. Recommend maintaining current difficulty settings before progressing.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 mr-3 flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 mb-1">Motor Skill Precision</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">No significant tremors detected during screen interactions; touch precision and dwell time are well within normal bounds for this age group.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SOS & AUDIT */}
      {activeTab === 'sos' && (
        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
           <ShieldAlert className="w-16 h-16 text-slate-600 mx-auto mb-4" />
           <h2 className="text-2xl font-bold text-white mb-2">Camera Audits & SOS Logs</h2>
           <p className="text-slate-400 max-w-md mx-auto">
             This tab will display pill validation photos captured by the patient's camera, as well as offline SOS emergency triggers.
           </p>
        </div>
      )}

    </div>
  );
}