import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, Volume2, Camera, 
  CheckCircle2, Clock, CalendarCheck, Stethoscope, 
  User, Plus, Trash2, Shield, Smile, Puzzle, 
  ClipboardCheck, Power, Hand
} from 'lucide-react';

export default function TaskDashboard({ onNavigate, currentScreen, routines = [], setRoutines = () => {} }) {
  const [activeTab, setActiveTab] = useState('alarm'); // alarm, routine, doctor
  const [cameraState, setCameraState] = useState('idle'); // idle, captured, verified
  
  // Form input state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newRequiresPhoto, setNewRequiresPhoto] = useState(false);

  // Safe time formatter: converts "19:30" to "7:30 PM", or leaves plain text intact
  const formatTime = (timeString) => {
    if (!timeString) return '';
    if (timeString.includes(':')) {
      const [h, m] = timeString.split(':');
      const d = new Date();
      d.setHours(parseInt(h, 10), parseInt(m, 10), 0);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return timeString;
  };

  const handleTakePhoto = () => {
    setCameraState('captured');
    setTimeout(() => setCameraState('verified'), 1000);
  };

  const handleSilenceAlarm = () => {
    alert("Camera audit saved to encrypted local storage!");
    setCameraState('idle');
    setActiveTab('routine');
    
    // Mark the pending photo task as completed
    const pendingPhotoTask = routines.find(r => r.requiresPhoto && r.status === 'pending');
    if (pendingPhotoTask) {
      setRoutines(routines.map(r => r.id === pendingPhotoTask.id ? { ...r, status: 'done' } : r));
    }
  };

  const handleAddRoutine = (e) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskTime) return;
    
    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      time: newTaskTime,
      status: 'pending',
      requiresPhoto: newRequiresPhoto
    };

    setRoutines([...routines, newTask].sort((a, b) => a.time.localeCompare(b.time)));
    setNewTaskTitle('');
    setNewTaskTime('');
    setNewRequiresPhoto(false);
  };

  const handleDeleteRoutine = (id) => {
    setRoutines(routines.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-800 flex justify-center items-start p-2 sm:p-4 select-none font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden relative min-h-[850px]">
        
        {/* HEADER */}
        <header className="px-4 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h1 className="font-bold text-base text-[#0A5C4A] tracking-tight">AASTA</h1>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                    <Power className="w-3 h-3 mr-0.5" /> Offline
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-1 bg-orange-100 text-orange-800 px-2.5 py-1.5 rounded-lg text-xs font-bold">
                <Volume2 className="w-3.5 h-3.5" /> <span>Audio</span>
              </button>
              <button className="flex items-center space-x-1 bg-[#BC1A22] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5 fill-white" /> <span>SOS</span>
              </button>
            </div>
          </div>
          <div className="text-[11px] font-medium text-slate-500 flex items-center">
             <User className="w-3 h-3 mr-1" /> Dadi Ji • Caregiver: Mohan
          </div>
        </header>

        {/* SUB-NAVIGATION TABS */}
        <div className="bg-[#F8F9FB] p-3 border-b border-slate-200">
          <div className="flex space-x-2">
            <button 
              onClick={() => setActiveTab('alarm')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'alarm' ? 'bg-red-100 text-red-700 shadow-sm border border-red-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
            >
              <Clock className="w-4 h-4" />
              <span>Active Alarm</span>
            </button>
            <button 
              onClick={() => setActiveTab('routine')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'routine' ? 'bg-white text-[#0A5C4A] shadow-sm border border-[#0A5C4A]' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Routine ({routines.filter(r => r.status === 'done').length}/{routines.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('doctor')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'doctor' ? 'bg-white text-blue-600 shadow-sm border border-blue-600' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Desk</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ACTIVE ALARM VIEW */}
        {activeTab === 'alarm' && (
          <div className="flex-1 overflow-y-auto pb-48 pt-4 px-4 [&::-webkit-scrollbar]:hidden animate-in fade-in duration-300">
            <div className="border-2 border-[#0A5C4A] rounded-3xl p-4 bg-white shadow-md relative">
              <div className="flex justify-between items-center mb-4">
                <div className="bg-red-100 text-red-700 font-extrabold px-3 py-1.5 rounded-full text-xs flex items-center shadow-sm">
                  <Clock className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                  ALARM SOUNDING
                </div>
                <span className="text-red-700 font-black text-xl">10:00 AM</span>
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Heart & Memory Tablet</h2>
              <p className="text-sm font-medium text-[#0A5C4A] mb-4">Donepezil 5mg • 1 Pill with sips of water</p>

              <div className="bg-emerald-50 rounded-xl p-3 flex items-start space-x-2 mb-4 border border-emerald-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs font-bold text-emerald-800">Hold palm flat under camera to verify dose for <span className="underline">Dr. Ananya</span>.</span>
              </div>

              {/* Camera Simulation Viewport */}
              <div className="w-full h-48 rounded-2xl mb-4 overflow-hidden relative bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                {cameraState === 'idle' ? (
                  <button onClick={handleTakePhoto} className="flex flex-col items-center text-slate-400 hover:text-emerald-600 transition-colors">
                    <Camera className="w-12 h-12 mb-2" />
                    <span className="font-bold text-sm">Tap to Open Camera</span>
                  </button>
                ) : (
                  <div className="w-full h-full relative bg-amber-50/50 flex items-center justify-center">
                    <Hand className="w-32 h-32 text-amber-200 absolute opacity-50" />
                    <div className="w-8 h-8 bg-white rounded-full border-2 border-slate-300 shadow-md z-10 animate-pulse flex items-center justify-center">
                       <div className="w-10 h-10 border-2 border-dashed border-emerald-500 rounded-full absolute animate-spin-slow"></div>
                    </div>
                    
                    <div className="absolute top-2 left-2 font-black text-[10px] tracking-widest text-white bg-black/40 px-2 py-1 rounded">
                      [PALM DETECTED]
                    </div>
                    <div className="absolute top-2 right-2 font-bold text-[10px] text-white bg-black/40 px-2 py-1 rounded">
                      100% FOCUS
                    </div>
                    
                    {cameraState === 'verified' && (
                      <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md rounded-lg p-2 flex justify-between items-center text-white">
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold">Mohan logged</span>
                        </div>
                        <span className="text-[10px] font-medium">9:58 AM</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {cameraState !== 'idle' && (
                   <button onClick={() => setCameraState('idle')} className="w-full bg-[#0A5C4A] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 active:scale-95 transition-transform">
                     <Camera className="w-5 h-5" />
                     <span>Tap to Retake Palm Photo</span>
                   </button>
                )}
                <button 
                  onClick={handleSilenceAlarm}
                  disabled={cameraState !== 'verified'}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${cameraState === 'verified' ? 'bg-[#0A5C4A] text-white active:scale-95 shadow-md' : 'bg-slate-100 text-slate-400'}`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirm & Silence Alarm</span>
                </button>
              </div>
            </div>
            
            <div className="mt-4 bg-[#F0F4F8] rounded-xl p-3 flex items-center justify-between border border-slate-200">
              <div className="flex items-center space-x-1.5 text-slate-500">
                <Shield className="w-4 h-4 text-[#0A5C4A]" />
                <span className="text-[10px] font-bold">Encrypted SQLCipher</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500">Auto-sync on connect</span>
            </div>
          </div>
        )}

        {/* TAB 2: ROUTINE MANAGER VIEW */}
        {activeTab === 'routine' && (
          <div className="flex-1 overflow-y-auto pb-24 pt-4 px-4 [&::-webkit-scrollbar]:hidden animate-in slide-in-from-right duration-300">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 mb-4">
              <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center">
                <CalendarCheck className="w-5 h-5 mr-2 text-blue-600" />
                Edit Daily Routine
              </h2>
              
              {/* Add Routine Form */}
              <form onSubmit={handleAddRoutine} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-6">
                <div className="flex space-x-2 mb-3">
                  <input 
                    type="text" 
                    placeholder="Task Name" 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
                  />
                  <input 
                    type="time" 
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="w-28 bg-white border border-slate-300 rounded-xl px-2 py-2 text-sm font-medium outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newRequiresPhoto}
                      onChange={(e) => setNewRequiresPhoto(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>Require Photo Audit?</span>
                  </label>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center">
                    <Plus className="w-4 h-4 mr-1" /> Add Task
                  </button>
                </div>
              </form>

              {/* Task Items List */}
              <div className="space-y-3">
                {routines.map(routine => (
                  <div key={routine.id} className={`flex items-center justify-between p-3 rounded-2xl border ${routine.status === 'done' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${routine.status === 'done' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {routine.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${routine.status === 'done' ? 'text-emerald-900 line-through' : 'text-slate-800'}`}>{routine.title}</h3>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-xs font-medium text-slate-500">{formatTime(routine.time)}</span>
                          {routine.requiresPhoto && <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Photo Req</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteRoutine(routine.id)} className="p-2 text-red-400 hover:text-red-600 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DOCTOR DESK VIEW */}
        {activeTab === 'doctor' && (
          <div className="flex-1 overflow-y-auto pb-24 pt-4 px-4 [&::-webkit-scrollbar]:hidden animate-in slide-in-from-right duration-300">
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Stethoscope className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-2">Doctor Portal Sync</h2>
                <p className="text-sm text-slate-500 font-medium mb-6">
                  Dr. Ananya's clinical adjustments and custom prescriptions will appear here once connected to AWS Cloud.
                </p>
                <div className="flex items-center space-x-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-bold">
                  <Power className="w-4 h-4 text-amber-500" />
                  <span>Awaiting Network Connection...</span>
                </div>
             </div>
          </div>
        )}

        {/* ROUTINE QUICK GLANCE FOOTER (Visible on Alarm tab) */}
        {activeTab === 'alarm' && (
          <div className="absolute bottom-20 w-full px-4 pb-2 bg-gradient-to-t from-[#F8F9FB] via-[#F8F9FB] to-transparent pt-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-3 shadow-sm">
              <div className="flex justify-between items-center mb-3 px-1">
                <div className="flex items-center space-x-2 text-[#0A5C4A]">
                  <CalendarCheck className="w-4 h-4" />
                  <span className="text-xs font-extrabold">Routine Quick Glance</span>
                </div>
                <button onClick={() => setActiveTab('routine')} className="text-xs font-bold text-blue-600">View All ({routines.length}) {'>'}</button>
              </div>
              <div className="flex space-x-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
                {routines.map((routine) => (
                  <div key={routine.id} className={`shrink-0 flex items-center space-x-2 px-3 py-2 border rounded-xl ${routine.status === 'done' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${routine.status === 'done' ? 'bg-emerald-200 text-emerald-700' : 'bg-amber-200 text-amber-700'}`}>
                      {routine.status === 'done' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${routine.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{routine.title.split(' ')[0]}...</div>
                      <div className="text-[10px] font-semibold text-slate-500">{routine.status === 'done' ? `Done ${formatTime(routine.time)}` : 'Tap to log'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
              <button 
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all ${
                  isActive ? "bg-emerald-200/50 text-[#0A5C4A]" : "text-slate-500 hover:text-slate-700"
                }`}
              >
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
