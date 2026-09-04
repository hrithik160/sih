import React from 'react';
import { 
  Smile, Puzzle, ClipboardCheck, Stethoscope, 
  Video, FileText, HeartPulse
} from 'lucide-react';

export default function DoctorCare({ onNavigate, currentScreen }) {
  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-800 flex justify-center items-start p-2 sm:p-4 select-none font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden relative min-h-[850px]">
        
        {/* HEADER */}
        <header className="px-4 py-4 bg-[#0A5C4A] text-white flex items-center space-x-3">
          <Stethoscope className="w-6 h-6" />
          <h1 className="font-bold text-lg">My Doctor</h1>
        </header>

        <div className="p-6 flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
          <div className="w-24 h-24 bg-white rounded-full shadow-lg border-4 border-emerald-100 flex items-center justify-center mb-6">
            <HeartPulse className="w-12 h-12 text-emerald-600 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 mb-2">Telehealth Portal</h2>
          <p className="text-center text-sm font-medium text-slate-500 mb-8 px-4">
            Connect securely with Dr. Ananya. Video calls are optimized for low-bandwidth networks.
          </p>

          <div className="w-full space-y-3">
            <button className="w-full bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-emerald-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-xl"><Video className="w-5 h-5" /></div>
                <span className="font-bold text-slate-700 text-sm">Join Video Call</span>
              </div>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded">Next: 3:00 PM</span>
            </button>

            <button className="w-full bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-emerald-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="bg-amber-100 text-amber-600 p-2 rounded-xl"><FileText className="w-5 h-5" /></div>
                <span className="font-bold text-slate-700 text-sm">View Lab Reports</span>
              </div>
            </button>
          </div>
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