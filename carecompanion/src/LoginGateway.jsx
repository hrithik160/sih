import React, { useState } from 'react';
import { 
  ShieldCheck, Stethoscope, User, HeartPulse, 
  WifiOff, Cloud, Lock, ArrowRight, Activity, Globe
} from 'lucide-react';

export default function LoginGateway({ onLogin }) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handlePatientLogin = () => {
    onLogin({
      role: 'patient',
      id: 'PT-NER-104',
      name: 'Biren Baruah (Dadu Ji)',
      caregiver: 'Mohan Baruah',
      stage: 'Moderate (Level 2)',
      doctorName: 'Dr. Ananya Sengupta',
      emergencyPhone: '+91 98765 43210'
    });
  };

  const handleDoctorLogin = () => {
    onLogin({
      role: 'doctor',
      id: 'DOC-AIIMS-08',
      name: 'Dr. Ananya Sengupta',
      specialty: 'Cognitive Neurologist (NER Clinical Lead)',
      hospital: 'Guwahati Neurological Institute'
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 font-sans select-none">
      
      {/* BRANDING HEADER */}
      <div className="text-center mb-8 max-w-md">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-emerald-400 text-xs font-bold mb-3 tracking-wide">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SMART INDIA HACKATHON 2026 • TEAM MERAKI</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          AASTA <span className="text-emerald-400">CareLink</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-2 font-medium leading-relaxed">
          AI-Powered Cognitive Care Ecosystem for the North Eastern Region
        </p>

        {/* REGIONAL LANGUAGE ACCENT BADGES */}
        <div className="flex items-center justify-center space-x-2 mt-4 text-[11px] font-semibold text-slate-400">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">অসমীয়া</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">বাংলা</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">बड़ो</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">English</span>
        </div>
      </div>

      {/* LOGIN CARDS CONTAINER */}
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CARD 1: PATIENT & CAREGIVER TABLET */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-emerald-500/40 hover:border-emerald-500 transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-800 font-bold text-[10px] px-3 py-1 rounded-bl-2xl flex items-center space-x-1">
            <WifiOff className="w-3 h-3" />
            <span>100% OFFLINE READY</span>
          </div>

          <div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 shadow-sm">
              <HeartPulse className="w-6 h-6" />
            </div>

            <div className="text-xs font-black uppercase tracking-wider text-emerald-800">
              Assigned Patient Unit
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">Patient Tablet</h2>
            <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed">
              Local encrypted database with offline voice interaction, daily routines, cognitive therapy, and SOS triggers.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="text-slate-700 font-bold flex items-center justify-between">
                <span>Profile: Dadu Ji</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Level 2</span>
              </div>
              <div className="text-slate-500 text-[11px]">Primary Caregiver: Mohan</div>
            </div>
          </div>

          <button 
            onClick={handlePatientLogin}
            className="mt-6 w-full bg-[#0A5C4A] hover:bg-[#08483a] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md active:scale-95 transition-all text-sm"
          >
            <span>Launch Patient Tablet</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* CARD 2: DOCTOR CLINICAL WEB PORTAL */}
        <div className="bg-slate-800/90 rounded-3xl p-6 shadow-xl border-2 border-blue-500/40 hover:border-blue-500 transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-300 font-bold text-[10px] px-3 py-1 rounded-bl-2xl flex items-center space-x-1 border-b border-l border-blue-500/30">
            <Cloud className="w-3 h-3 text-blue-400" />
            <span>AWS CLOUD PORTAL</span>
          </div>

          <div>
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20 shadow-sm">
              <Stethoscope className="w-6 h-6" />
            </div>

            <div className="text-xs font-black uppercase tracking-wider text-blue-400">
              Provider Authentication
            </div>
            <h2 className="text-xl font-black text-white mt-1">Doctor Web Portal</h2>
            <p className="text-xs font-medium text-slate-400 mt-2 leading-relaxed">
              Multi-patient clinical dashboard with decision-tree telemetry, medication photo auditing, and schedule overrides.
            </p>

            <div className="mt-4 p-3 bg-slate-900/60 rounded-xl border border-slate-700 text-xs space-y-1">
              <div className="text-slate-200 font-bold flex items-center justify-between">
                <span>Dr. Ananya Sengupta</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">MD, Neuro</span>
              </div>
              <div className="text-slate-400 text-[11px]">NER Dementia Care Unit</div>
            </div>
          </div>

          <button 
            onClick={handleDoctorLogin}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md active:scale-95 transition-all text-sm"
          >
            <span>Access Clinical Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* FOOTER NOTICE */}
      <div className="mt-8 text-center text-slate-500 text-xs flex items-center space-x-2">
        <Lock className="w-3.5 h-3.5" />
        <span>End-to-End Encrypted Session • Compliant with Offline-First Standards</span>
      </div>

    </div>
  );
}