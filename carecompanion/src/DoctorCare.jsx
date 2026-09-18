import React, { useState } from 'react';
import { 
  Smile, Puzzle, ClipboardCheck, Stethoscope, 
  Video, FileText, HeartPulse, X, FileIcon, Loader
} from 'lucide-react';
import { useT } from './LanguageContext';

export default function DoctorCare({ onNavigate, currentScreen, currentUser }) {
  const { t } = useT();
  const [showLabs, setShowLabs] = useState(false);
  const [labReports, setLabReports] = useState([]);
  const [isLoadingLabs, setIsLoadingLabs] = useState(false);

  const fetchLabReports = async () => {
    if (!currentUser) return;
    setIsLoadingLabs(true);
    setShowLabs(true);
    try {
      const { rtdb } = await import('./firebase');
      const { ref, get } = await import('firebase/database');
      const emailKey = currentUser.email.replace(/\./g, ',');
      const snapshot = await get(ref(rtdb, `users/${emailKey}/lab_reports`));
      if (snapshot.exists()) {
        setLabReports(Object.values(snapshot.val()));
      } else {
        setLabReports([]);
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoadingLabs(false);
  };

  const navItems = [
    { id: 'daily_fun', labelKey: 'nav_daily_fun', icon: Smile },
    { id: 'therapy', labelKey: 'nav_therapy_games', icon: Puzzle },
    { id: 'tasks', labelKey: 'nav_tasks', icon: ClipboardCheck },
    { id: 'doctor', labelKey: 'nav_doctor', icon: Stethoscope },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-800 flex justify-center items-start p-2 sm:p-4 select-none font-sans relative">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden relative min-h-[850px]">

        {/* HEADER */}
        <header className="px-4 py-4 bg-[#0A5C4A] text-white flex items-center space-x-3">
          <Stethoscope className="w-6 h-6" />
          <h1 className="font-bold text-lg">{t('my_doctor')}</h1>
        </header>

        <div className="p-6 flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
          <div className="w-24 h-24 bg-white rounded-full shadow-lg border-4 border-emerald-100 flex items-center justify-center mb-6">
            <HeartPulse className="w-12 h-12 text-emerald-600 animate-pulse" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2">{t('telehealth_portal')}</h2>
          <p className="text-center text-sm font-medium text-slate-500 mb-8 px-4">
            {t('telehealth_desc')}
          </p>

          <div className="w-full space-y-3">
            <button className="w-full bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-emerald-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-xl"><Video className="w-5 h-5" /></div>
                <span className="font-bold text-slate-700 text-sm">{t('join_video_call')}</span>
              </div>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded">{t('next_appt')}</span>
            </button>

            <button onClick={fetchLabReports} className="w-full bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-emerald-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="bg-amber-100 text-amber-600 p-2 rounded-xl"><FileText className="w-5 h-5" /></div>
                <span className="font-bold text-slate-700 text-sm">{t('view_lab_reports')}</span>
              </div>
            </button>
          </div>
        </div>

        {/* LAB REPORTS MODAL */}
        {showLabs && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col">
            <div className="px-4 py-4 bg-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6" />
                <h1 className="font-bold text-lg">{t('my_lab_reports')}</h1>
              </div>
              <button onClick={() => setShowLabs(false)} className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {isLoadingLabs ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Loader className="w-8 h-8 animate-spin mb-4" />
                  <p className="font-bold text-sm">{t('fetching_reports')}</p>
                </div>
              ) : labReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <FileText className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-bold">{t('no_reports')}</p>
                </div>
              ) : (
                labReports.map((report) => (
                  <a
                    key={report.id}
                    href={report.data}
                    download={report.name}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:border-amber-300 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                      <FileIcon className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-slate-800 truncate">{report.name}</h3>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{new Date(report.date).toLocaleDateString()}</p>
                    </div>
                    <div className="px-3 py-1.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                      {t('download')}
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        )}

        {/* BOTTOM NAV */}
        <nav className="absolute bottom-0 w-full border-t border-slate-100 bg-white px-2 py-2 flex items-center justify-between z-10 rounded-b-3xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)} className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all ${isActive ? "bg-emerald-200/50 text-[#0A5C4A]" : "text-slate-500 hover:text-slate-700"}`}>
                <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                <span className={`text-[10px] ${isActive ? "font-extrabold" : "font-medium"}`}>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
