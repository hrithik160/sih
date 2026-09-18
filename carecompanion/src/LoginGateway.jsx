import React, { useState } from 'react';
import { 
  Heart, Shield, User, Stethoscope, Users, Clock, 
  Brain, Volume2, WifiOff, MapPin, ArrowRight, CheckCircle2, 
  Lock, X, ChevronRight, Sparkles, AlertTriangle, BrainCircuit
} from 'lucide-react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const BaselineGame = ({ onComplete }) => {
  const [cards, setCards] = useState([
    { id: 1, icon: '🍎' }, { id: 2, icon: '🍎' },
    { id: 3, icon: '🚗' }, { id: 4, icon: '🚗' },
    { id: 5, icon: '🐶' }, { id: 6, icon: '🐶' },
    { id: 7, icon: '🌟' }, { id: 8, icon: '🌟' },
  ].map(c => ({ ...c, flipped: false, matched: false })).sort(() => Math.random() - 0.5));
  
  const [flipped, setFlipped] = useState([]);
  const [errors, setErrors] = useState(0);
  const [startTime] = useState(Date.now());
  const [won, setWon] = useState(false);

  const handleFlip = (i) => {
    if (flipped.length === 2 || cards[i].flipped || cards[i].matched) return;
    const newCards = [...cards];
    newCards[i].flipped = true;
    setCards(newCards);
    const newFlipped = [...flipped, i];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setTimeout(() => {
        const [f, s] = newFlipped;
        const finalCards = [...cards];
        if (finalCards[f].icon === finalCards[s].icon) {
          finalCards[f].matched = true;
          finalCards[s].matched = true;
        } else {
          setErrors(e => e + 1);
          finalCards[f].flipped = false;
          finalCards[s].flipped = false;
        }
        setCards(finalCards);
        setFlipped([]);
        if (finalCards.every(c => c.matched)) {
          setWon(true);
          const latencySecs = (Date.now() - startTime) / 1000;
          setTimeout(() => onComplete(latencySecs, errors), 1500);
        }
      }, 1000);
    }
  };

  if (won) return (
    <div className="text-center p-6 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in zoom-in">
      <div className="text-4xl mb-2">🏆</div>
      <p className="text-[#0A5C4A] font-extrabold text-base mb-1">Baseline Calibration Complete!</p>
      <p className="text-xs text-stone-600 font-medium">Setting up initial memory activities...</p>
    </div>
  );

  return (
    <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 text-center animate-in fade-in space-y-4">
      <div className="flex items-center justify-center space-x-2 text-[#0A5C4A] font-extrabold text-sm">
        <BrainCircuit className="w-5 h-5 text-amber-600" />
        <span>Memory & Recall Calibration</span>
      </div>
      <p className="text-xs text-stone-600 font-medium">Match pairs of cards to complete initial cognitive calibration.</p>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, i) => (
          <button 
            key={i} 
            onClick={() => handleFlip(i)} 
            className={`h-14 text-2xl flex items-center justify-center rounded-xl transition-all shadow-sm ${card.flipped || card.matched ? 'bg-white border-2 border-[#0A5C4A]' : 'bg-[#0A5C4A] text-white hover:bg-[#074739]'}`}
          >
            <span className={card.flipped || card.matched ? 'opacity-100' : 'opacity-0'}>{card.icon}</span>
          </button>
        ))}
      </div>
      <div className="text-xs font-bold text-stone-600 bg-white px-3 py-1 rounded-full border border-stone-200 inline-block">
        Tries: {errors}
      </div>
    </div>
  );
};

export default function LoginGateway({ onLogin }) {
  const [activeRoleModal, setActiveRoleModal] = useState(null); // 'patient' | 'doctor' | null
  const [authStep, setAuthStep] = useState('login'); // 'login' | 'register_details' | 'baseline_game'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields for Patient/Caregiver Registration
  const [patientData, setPatientData] = useState({
    name: '', caregiver: '', emergencyPhone: '', doctor_email: '', dementia_level: 1, stage: 'Mild'
  });

  // Form Fields for Doctor Registration
  const [doctorData, setDoctorData] = useState({
    name: '', specialty: '', hospital: '', certificate: ''
  });

  // Quick 1-Tap Patient Access
  const handleQuickPatientAccess = async () => {
    setLoading(true);
    setError('');
    const demoEmail = 'dadu.ji@aasta.in';
    const demoPassword = 'password123';

    try {
      const res = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      onLogin({
        email: res.user.email,
        role: 'patient',
        name: 'Dadu Ji',
        caregiver: 'Mohan Baruah',
        emergencyPhone: '+91 98765 43210'
      });
    } catch (err) {
      try {
        const res = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
        const { rtdb } = await import('./firebase');
        const { ref, set } = await import('firebase/database');
        const emailKey = res.user.email.replace(/\./g, ',');
        const userData = {
          role: 'patient',
          name: 'Dadu Ji',
          caregiver: 'Mohan Baruah',
          emergencyPhone: '+91 98765 43210',
          dementia_level: 1,
          stage: 'Mild'
        };
        await set(ref(rtdb, `users/${emailKey}`), userData);
        onLogin({ email: res.user.email, ...userData });
      } catch (createErr) {
        onLogin({
          email: demoEmail,
          role: 'patient',
          name: 'Dadu Ji',
          caregiver: 'Mohan Baruah',
          emergencyPhone: '+91 98765 43210'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const { rtdb } = await import('./firebase');
      const { ref, get } = await import('firebase/database');
      const emailKey = res.user.email.replace(/\./g, ',');
      const snapshot = await get(ref(rtdb, `users/${emailKey}`));

      if (snapshot.exists()) {
        onLogin({ email: res.user.email, ...snapshot.val() });
      } else {
        onLogin({ email: res.user.email, role: activeRoleModal || 'patient', name: email.split('@')[0] });
      }
    } catch (err) {
      // Offline fallback
      onLogin({
        email,
        role: activeRoleModal === 'doctor' ? 'doctor' : 'patient',
        name: activeRoleModal === 'doctor' ? 'Dr. Ananya Sharma' : 'Dadu Ji',
        caregiver: 'Mohan Baruah'
      });
    } finally {
      setLoading(false);
    }
  };

  // Registration Submit for Patient or Doctor
  const handleRegisterComplete = async (dementiaLevel = 1) => {
    setLoading(true);
    setError('');

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const { rtdb } = await import('./firebase');
      const { ref, set } = await import('firebase/database');
      const emailKey = res.user.email.replace(/\./g, ',');

      const userData = activeRoleModal === 'doctor' ? {
        role: 'doctor',
        name: doctorData.name || 'Dr. Ananya Sharma',
        specialty: doctorData.specialty || 'Neurology / Memory Care',
        hospital: doctorData.hospital || 'Guwahati Neurological Institute',
        certificate: doctorData.certificate || ''
      } : {
        role: 'patient',
        name: patientData.name || 'Dadu Ji',
        caregiver: patientData.caregiver || 'Mohan Baruah',
        emergencyPhone: patientData.emergencyPhone || '+91 98765 43210',
        doctor_email: patientData.doctor_email || '',
        dementia_level: dementiaLevel,
        stage: dementiaLevel === 1 ? 'Mild' : dementiaLevel === 2 ? 'Moderate' : 'Severe'
      };

      await set(ref(rtdb, `users/${emailKey}`), userData);
      onLogin({ email: res.user.email, ...userData });
    } catch (err) {
      onLogin({
        email,
        role: activeRoleModal === 'doctor' ? 'doctor' : 'patient',
        name: activeRoleModal === 'doctor' ? (doctorData.name || 'Dr. Ananya Sharma') : (patientData.name || 'Dadu Ji'),
        caregiver: patientData.caregiver || 'Mohan Baruah'
      });
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const { rtdb } = await import('./firebase');
      const { ref, get, set } = await import('firebase/database');
      const emailKey = res.user.email.replace(/\./g, ',');
      const snapshot = await get(ref(rtdb, `users/${emailKey}`));

      if (snapshot.exists()) {
        onLogin({ email: res.user.email, ...snapshot.val() });
      } else {
        const userData = {
          role: activeRoleModal || 'patient',
          name: res.user.displayName || 'User',
          caregiver: 'Mohan Baruah'
        };
        await set(ref(rtdb, `users/${emailKey}`), userData);
        onLogin({ email: res.user.email, ...userData });
      }
    } catch (err) {
      setError('Google Sign-In failed or was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900 font-sans w-full flex flex-col selection:bg-amber-100 selection:text-amber-900">
      
      {/* 1. HEADER */}
      <header className="sticky top-0 z-40 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-stone-200/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#0A5C4A] text-white rounded-xl flex items-center justify-center font-black shadow-sm">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#0A5C4A]">AASTA</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-stone-500 border-l border-stone-300 pl-2">
                Memory & Cognitive Care
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-stone-600">
            <a href="#how-it-works" className="hover:text-[#0A5C4A] transition-colors">How It Works</a>
            <a href="#northeast" className="hover:text-[#0A5C4A] transition-colors">Northeast Focus</a>
            <a href="#features" className="hover:text-[#0A5C4A] transition-colors">Features</a>
          </nav>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => { setActiveRoleModal('patient'); setAuthStep('login'); }} 
              className="text-xs font-bold text-stone-700 hover:text-[#0A5C4A] px-3 py-2 rounded-xl transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('portals');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#0A5C4A] hover:bg-[#074739] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO */}
      <section className="px-6 pt-12 pb-16 md:pt-20 md:pb-24 max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 bg-amber-100/80 border border-amber-300/60 text-amber-900 px-3.5 py-1.5 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Offline-First Dementia & Cognitive Support</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 leading-[1.1] tracking-tight">
              Memory care that fits into everyday life.
            </h1>

            <p className="text-lg sm:text-xl font-medium text-stone-600 max-w-xl leading-relaxed">
              AASTA helps older adults stay engaged, supported, and connected with family and doctors.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={handleQuickPatientAccess}
                className="bg-[#0A5C4A] hover:bg-[#074739] text-white font-extrabold px-7 py-4 rounded-2xl shadow-md hover:shadow-lg transition-all text-base flex items-center justify-center space-x-2 active:scale-95"
              >
                <span>Launch Patient & Caregiver App</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <a 
                href="#portals"
                className="bg-stone-200/80 hover:bg-stone-300/80 text-stone-800 font-bold px-6 py-4 rounded-2xl transition-colors text-base text-center"
              >
                Choose Portal
              </a>
            </div>

            <div className="pt-4 flex items-center space-x-6 text-xs font-semibold text-stone-500 border-t border-stone-200">
              <span className="flex items-center"><CheckCircle2 className="w-4 h-4 text-[#0A5C4A] mr-1.5" /> Offline-First Architecture</span>
              <span className="flex items-center"><CheckCircle2 className="w-4 h-4 text-[#0A5C4A] mr-1.5" /> Regional Language Support</span>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-stone-200">
              <img 
                src="/aasta_hero_family.jpg" 
                alt="Grandfather and caregiver using AASTA tablet at home" 
                className="w-full h-auto object-cover aspect-[4/3]"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-stone-200/80 shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center font-bold text-lg shrink-0">
                    👴
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-stone-900">Dadu Ji • Morning Routine</div>
                    <div className="text-[11px] font-medium text-stone-500">"Time for morning medicine & memory recall game"</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PORTALS SECTION (PATIENT & CAREGIVER VS DOCTOR) */}
      <section id="portals" className="py-16 px-6 bg-stone-100/70 border-y border-stone-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0A5C4A] mb-2">Select Access</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">How will you use AASTA?</h3>
            <p className="text-stone-600 font-medium text-sm mt-2">Open the patient companion & caregiver management app or the clinical doctor portal.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* PORTAL 1: PATIENT & CAREGIVER COMPANION APP */}
            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-16 h-16 bg-emerald-100 text-[#0A5C4A] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <User className="w-8 h-8" />
                </div>
                <div className="inline-block bg-emerald-100 text-[#0A5C4A] text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                  Patient & Caregiver App
                </div>
                <h4 className="text-2xl font-extrabold text-stone-900 mb-3">Patient & Family Access</h4>
                <p className="text-stone-600 text-sm font-medium leading-relaxed mb-6">
                  Simple daily companion for older adults featuring memory games, medicine alarms, audio guidance, SOS distress calls, and an embedded Caregiver Routine Setup mode.
                </p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleQuickPatientAccess}
                  className="w-full bg-[#0A5C4A] hover:bg-[#074739] text-white font-extrabold py-4 px-4 rounded-2xl text-sm transition-all flex items-center justify-center space-x-2 active:scale-95 shadow-md"
                >
                  <span>1-Tap Patient Quick Start</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => { setActiveRoleModal('patient'); setAuthStep('login'); }}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3 px-4 rounded-2xl text-xs transition-colors text-center"
                >
                  Sign In / Register Account
                </button>
              </div>
            </div>

            {/* PORTAL 2: DOCTOR CLINICAL PORTAL */}
            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-16 h-16 bg-stone-100 text-stone-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <div className="inline-block bg-stone-100 text-stone-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                  Doctor Clinical Suite
                </div>
                <h4 className="text-2xl font-extrabold text-stone-900 mb-3">Doctor Portal</h4>
                <p className="text-stone-600 text-sm font-medium leading-relaxed mb-6">
                  Clinical workspace for doctors to review assigned patients, track cognitive performance trends, audit telemetry logs, and issue prescriptions or care plan updates.
                </p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => { setActiveRoleModal('doctor'); setAuthStep('login'); }}
                  className="w-full bg-stone-900 hover:bg-black text-white font-extrabold py-4 px-4 rounded-2xl text-sm transition-all flex items-center justify-center space-x-2 active:scale-95 shadow-md"
                >
                  <span>Doctor Sign In / Register</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. FEATURES */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0A5C4A] mb-2">Designed for Real Life</h2>
          <h3 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">Built specifically for elderly care needs</h3>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="p-6 rounded-2xl border border-stone-200 bg-white space-y-3">
            <div className="w-10 h-10 bg-emerald-100 text-[#0A5C4A] rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-lg text-stone-900">Cognitive Activities</h4>
            <p className="text-stone-600 text-xs font-medium leading-relaxed">
              Short, enjoyable daily activities designed to keep memory, attention, and executive reasoning engaged without stress.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-stone-200 bg-white space-y-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-lg text-stone-900">Daily Support & Routines</h4>
            <p className="text-stone-600 text-xs font-medium leading-relaxed">
              Medication reminders, daily tasks, and appointments organized clearly into a simple timeline.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-stone-200 bg-white space-y-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-lg text-stone-900">Caregiver Mode Inside</h4>
            <p className="text-stone-600 text-xs font-medium leading-relaxed">
              Caregivers can configure schedules, record family voice reminders, and review task completions directly within the app.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-stone-200 bg-white space-y-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-xl flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-lg text-stone-900">Voice & Regional Languages</h4>
            <p className="text-stone-600 text-xs font-medium leading-relaxed">
              Family members can record personal voice notes to reassure elders during medicine alarms in their native language.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-stone-200 bg-white space-y-3">
            <div className="w-10 h-10 bg-stone-100 text-stone-800 rounded-xl flex items-center justify-center">
              <WifiOff className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-lg text-stone-900">Offline-First Design</h4>
            <p className="text-stone-600 text-xs font-medium leading-relaxed">
              All essential routines and memory activities remain fully functional without active internet connection.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-stone-200 bg-white space-y-3">
            <div className="w-10 h-10 bg-red-100 text-red-800 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-lg text-stone-900">Emergency SOS System</h4>
            <p className="text-stone-600 text-xs font-medium leading-relaxed">
              1-tap emergency call and location distress beacon connected directly to family members and doctors.
            </p>
          </div>

        </div>
      </section>

      {/* 5. NORTHEAST FOCUS */}
      <section id="northeast" className="py-16 px-6 bg-[#0A5C4A] text-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-white/10 text-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
              <MapPin className="w-3.5 h-3.5" />
              <span>SIH Problem Statement 26003 Focus</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">Designed for Northeast India</h3>
            <p className="text-emerald-100 text-sm sm:text-base font-medium leading-relaxed">
              Built specifically around regional language support, familiar local activities, and offline-first reliability for environments where mobile data connectivity may fluctuate.
            </p>
          </div>

          <div className="md:col-span-5 bg-white/10 p-6 rounded-3xl border border-white/20">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-emerald-200 mb-3">Supported Languages</h4>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {['Assamese', 'Hindi', 'Bengali', 'Bodo', 'Khasi', 'Mizo', 'Manipuri'].map(lang => (
                <span key={lang} className="bg-white text-[#0A5C4A] px-3 py-1.5 rounded-xl shadow-sm">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0A5C4A] mb-2">Simple Workflow</h2>
          <h3 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">How AASTA works in 3 steps</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="space-y-4 p-6 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="w-12 h-12 bg-[#0A5C4A] text-white rounded-2xl flex items-center justify-center font-black mx-auto text-lg">01</div>
            <h4 className="font-extrabold text-xl text-stone-900">Set Up</h4>
            <p className="text-stone-600 text-xs font-medium leading-relaxed">A caregiver or family member configures daily medicine times, tasks, and emergency contacts.</p>
          </div>

          <div className="space-y-4 p-6 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="w-12 h-12 bg-[#0A5C4A] text-white rounded-2xl flex items-center justify-center font-black mx-auto text-lg">02</div>
            <h4 className="font-extrabold text-xl text-stone-900">Use Daily</h4>
            <p className="text-stone-600 text-xs font-medium leading-relaxed">The patient sees clear, uncluttered instructions with audio support and simple memory games.</p>
          </div>

          <div className="space-y-4 p-6 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="w-12 h-12 bg-[#0A5C4A] text-white rounded-2xl flex items-center justify-center font-black mx-auto text-lg">03</div>
            <h4 className="font-extrabold text-xl text-stone-900">Stay Connected</h4>
            <p className="text-stone-600 text-xs font-medium leading-relaxed">Caregivers and doctors receive automated notifications, compliance logs, and cognitive progress metrics.</p>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-stone-900 text-stone-400 py-12 px-6 border-t border-stone-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-medium">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 bg-[#0A5C4A] text-white rounded-lg flex items-center justify-center font-black">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <span className="font-bold text-white text-sm">AASTA — Memory & Cognitive Care</span>
          </div>

          <div>Built by Team MERAKI • Smart India Hackathon 2026</div>

          <div className="flex space-x-6 text-stone-300">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#northeast" className="hover:text-white transition-colors">Northeast Focus</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
          </div>
        </div>
      </footer>

      {/* 8. AUTHENTICATION MODAL */}
      {activeRoleModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => { setActiveRoleModal(null); setAuthStep('login'); }} 
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* LOGIN STEP */}
            {authStep === 'login' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-emerald-100 text-[#0A5C4A] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    {activeRoleModal === 'doctor' ? <Stethoscope className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  <h3 className="text-2xl font-black text-stone-900">
                    {activeRoleModal === 'doctor' ? 'Doctor Portal Access' : 'Patient & Caregiver Sign In'}
                  </h3>
                  <p className="text-xs font-medium text-stone-500 mt-1">
                    Sign in with your email & password to access your portal
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      placeholder={activeRoleModal === 'doctor' ? "dr.ananya@hospital.in" : "dadu.ji@aasta.in"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm font-medium outline-none focus:border-[#0A5C4A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">Password</label>
                    <input 
                      type="password" 
                      required 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm font-medium outline-none focus:border-[#0A5C4A]"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#0A5C4A] hover:bg-[#074739] text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
                  >
                    {loading ? 'Connecting...' : 'Sign In'}
                  </button>
                </form>

                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
                  <span className="relative bg-white px-3 text-[11px] font-bold text-stone-400 uppercase">Or</span>
                </div>

                <button 
                  type="button" 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                  <span>Sign in with Google</span>
                </button>

                <div className="mt-4 text-center">
                  <button 
                    onClick={() => setAuthStep('register_details')}
                    className="text-xs font-bold text-[#0A5C4A] hover:underline"
                  >
                    Don't have an account? Register
                  </button>
                </div>
              </>
            )}

            {/* REGISTER DETAILS STEP */}
            {authStep === 'register_details' && (
              <>
                <div className="text-center mb-5">
                  <h3 className="text-2xl font-black text-stone-900">
                    Register {activeRoleModal === 'doctor' ? 'Doctor' : 'Patient & Caregiver'}
                  </h3>
                  <p className="text-xs font-medium text-stone-500 mt-1">
                    Enter profile details to set up your account
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">Email</label>
                    <input 
                      type="email" required placeholder="user@email.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">Password</label>
                    <input 
                      type="password" required placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-medium outline-none"
                    />
                  </div>

                  {activeRoleModal === 'patient' ? (
                    <>
                      <div>
                        <label className="text-xs font-bold text-stone-600 block mb-1">Patient Name</label>
                        <input 
                          type="text" placeholder="Dadu Ji"
                          value={patientData.name} onChange={e => setPatientData({ ...patientData, name: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-medium outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-stone-600 block mb-1">Caregiver Name</label>
                        <input 
                          type="text" placeholder="Mohan Baruah"
                          value={patientData.caregiver} onChange={e => setPatientData({ ...patientData, caregiver: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-medium outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-stone-600 block mb-1">Emergency Phone</label>
                        <input 
                          type="text" placeholder="+91 98765 43210"
                          value={patientData.emergencyPhone} onChange={e => setPatientData({ ...patientData, emergencyPhone: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-medium outline-none"
                        />
                      </div>

                      <button 
                        onClick={() => setAuthStep('baseline_game')}
                        className="w-full bg-[#0A5C4A] hover:bg-[#074739] text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-md mt-2"
                      >
                        Next: Optional Memory Calibration →
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-bold text-stone-600 block mb-1">Doctor Name</label>
                        <input 
                          type="text" placeholder="Dr. Ananya Sharma"
                          value={doctorData.name} onChange={e => setDoctorData({ ...doctorData, name: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-medium outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-stone-600 block mb-1">Specialty</label>
                        <input 
                          type="text" placeholder="Neurology / Memory Care"
                          value={doctorData.specialty} onChange={e => setDoctorData({ ...doctorData, specialty: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-medium outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-stone-600 block mb-1">Hospital / Clinic</label>
                        <input 
                          type="text" placeholder="Guwahati Neurological Institute"
                          value={doctorData.hospital} onChange={e => setDoctorData({ ...doctorData, hospital: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-medium outline-none"
                        />
                      </div>

                      <button 
                        onClick={() => handleRegisterComplete()}
                        className="w-full bg-stone-900 hover:bg-black text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-md mt-2"
                      >
                        Complete Doctor Registration
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-4 text-center">
                  <button 
                    onClick={() => setAuthStep('login')}
                    className="text-xs font-bold text-stone-500 hover:underline"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </>
            )}

            {/* BASELINE GAME STEP */}
            {authStep === 'baseline_game' && (
              <div>
                <BaselineGame onComplete={(latencySecs, errors) => {
                  const dementiaLevel = errors > 3 ? 3 : errors > 1 ? 2 : 1;
                  handleRegisterComplete(dementiaLevel);
                }} />
                <button 
                  onClick={() => handleRegisterComplete(1)}
                  className="w-full mt-3 text-xs font-bold text-stone-500 hover:text-stone-800 text-center block"
                >
                  Skip calibration & complete registration
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
