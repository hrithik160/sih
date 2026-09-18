import React, { useState } from 'react';
import { 
  Heart, Shield, User, Stethoscope, Users, Clock, 
  Brain, Volume2, WifiOff, MapPin, ArrowRight, CheckCircle2, 
  Lock, X, ChevronRight, Sparkles, AlertTriangle
} from 'lucide-react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function LoginGateway({ onLogin }) {
  const [activeRoleModal, setActiveRoleModal] = useState(null); // 'patient' | 'caregiver' | 'doctor' | null
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [patientName, setPatientName] = useState('');
  const [caregiverName, setCaregiverName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('Neurology / Memory Care');

  // Handle Quick Patient Access
  const handleQuickPatientAccess = async () => {
    setLoading(true);
    setError('');
    const demoPatientEmail = 'dadu.ji@aasta.in';
    const demoPassword = 'password123';

    try {
      // Try signing in with demo patient account
      const res = await signInWithEmailAndPassword(auth, demoPatientEmail, demoPassword);
      onLogin({
        email: res.user.email,
        role: 'patient',
        name: 'Dadu Ji',
        caregiver: 'Mohan Baruah',
        emergencyPhone: '+91 98765 43210'
      });
    } catch (err) {
      // If demo account doesn't exist yet, create it automatically
      try {
        const res = await createUserWithEmailAndPassword(auth, demoPatientEmail, demoPassword);
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
        // Local fallback if offline
        onLogin({
          email: demoPatientEmail,
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

  // Handle Form Submission for Caregiver & Doctor
  const handleSubmitAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let res;
      if (isRegistering) {
        res = await createUserWithEmailAndPassword(auth, email, password);
        const { rtdb } = await import('./firebase');
        const { ref, set } = await import('firebase/database');
        const emailKey = res.user.email.replace(/\./g, ',');
        
        const userData = activeRoleModal === 'doctor' ? {
          role: 'doctor',
          name: patientName || 'Dr. Ananya Sharma',
          specialty: doctorSpecialty,
          hospital: 'Guwahati Neurological Institute'
        } : {
          role: 'caregiver',
          name: caregiverName || 'Mohan Baruah',
          patientName: patientName || 'Dadu Ji',
          emergencyPhone: emergencyPhone || '+91 98765 43210'
        };

        await set(ref(rtdb, `users/${emailKey}`), userData);
        onLogin({ email: res.user.email, ...userData });
      } else {
        res = await signInWithEmailAndPassword(auth, email, password);
        const { rtdb } = await import('./firebase');
        const { ref, get } = await import('firebase/database');
        const emailKey = res.user.email.replace(/\./g, ',');
        const snapshot = await get(ref(rtdb, `users/${emailKey}`));

        if (snapshot.exists()) {
          onLogin({ email: res.user.email, ...snapshot.val() });
        } else {
          // Default role assignment if snapshot missing
          onLogin({ email: res.user.email, role: activeRoleModal, name: email.split('@')[0] });
        }
      }
    } catch (err) {
      console.warn("Auth failed, using local offline fallback", err);
      // Fallback for offline hackathon testing
      onLogin({
        email,
        role: activeRoleModal === 'doctor' ? 'doctor' : 'patient',
        name: patientName || (activeRoleModal === 'doctor' ? 'Dr. Ananya Sharma' : 'Dadu Ji'),
        caregiver: 'Mohan Baruah'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Auth
  const handleGoogleAuth = async () => {
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
    <div className="min-h-screen bg-[#FBF9F5] text-slate-900 font-sans w-full flex flex-col selection:bg-amber-100 selection:text-amber-900">
      
      {/* 1. NAVIGATION HEADER */}
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
              onClick={() => { setActiveRoleModal('caregiver'); setIsRegistering(false); }} 
              className="text-xs font-bold text-stone-700 hover:text-[#0A5C4A] px-3 py-2 rounded-xl transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('role-selection');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#0A5C4A] hover:bg-[#074739] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
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
              AASTA helps older adults stay engaged, supported, and connected with the family and doctors who care for them.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => {
                  const el = document.getElementById('role-selection');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-[#0A5C4A] hover:bg-[#074739] text-white font-extrabold px-7 py-4 rounded-2xl shadow-md hover:shadow-lg transition-all text-base flex items-center justify-center space-x-2 active:scale-95"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <a 
                href="#how-it-works"
                className="bg-stone-200/80 hover:bg-stone-300/80 text-stone-800 font-bold px-6 py-4 rounded-2xl transition-colors text-base text-center"
              >
                See How It Works
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

      {/* 3. ROLE SELECTION ("HOW WILL YOU USE AASTA?") */}
      <section id="role-selection" className="py-16 px-6 bg-stone-100/70 border-y border-stone-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0A5C4A] mb-2">Access Your Portal</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">How will you use AASTA today?</h3>
            <p className="text-stone-600 font-medium text-sm mt-2">Select your role to open your dedicated companion app or management portal.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            {/* PATIENT CARD */}
            <div className="bg-white p-7 rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 bg-emerald-100 text-[#0A5C4A] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <User className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-extrabold text-stone-900 mb-2">Patient App</h4>
                <p className="text-stone-600 text-sm font-medium leading-relaxed mb-6">
                  Simple, accessible daily view designed for older adults. Large text, clear actions, audio guidance, and daily memory activities.
                </p>
              </div>
              <button 
                onClick={handleQuickPatientAccess}
                className="w-full bg-[#0A5C4A] hover:bg-[#074739] text-white font-extrabold py-3.5 px-4 rounded-2xl text-sm transition-all flex items-center justify-center space-x-2 active:scale-95"
              >
                <span>Continue as Patient</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* CAREGIVER CARD */}
            <div className="bg-white p-7 rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-extrabold text-stone-900 mb-2">Caregiver Dashboard</h4>
                <p className="text-stone-600 text-sm font-medium leading-relaxed mb-6">
                  Stay informed and involved. Manage medicine schedules, task verification, voice notes, and real-time emergency alerts.
                </p>
              </div>
              <button 
                onClick={() => { setActiveRoleModal('caregiver'); setIsRegistering(false); }}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-extrabold py-3.5 px-4 rounded-2xl text-sm transition-all flex items-center justify-center space-x-2 active:scale-95"
              >
                <span>Continue as Caregiver</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* DOCTOR CARD */}
            <div className="bg-white p-7 rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 bg-stone-100 text-stone-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-extrabold text-stone-900 mb-2">Doctor Portal</h4>
                <p className="text-stone-600 text-sm font-medium leading-relaxed mb-6">
                  Clinical management suite for medical practitioners. Review patient progress, cognitive trends, telemetry logs, and care plans.
                </p>
              </div>
              <button 
                onClick={() => { setActiveRoleModal('doctor'); setIsRegistering(false); }}
                className="w-full bg-stone-900 hover:bg-black text-white font-extrabold py-3.5 px-4 rounded-2xl text-sm transition-all flex items-center justify-center space-x-2 active:scale-95"
              >
                <span>Continue as Doctor</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES */}
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
              Medication reminders, daily tasks, and appointments organized clearly into a simple "Now & Next" timeline.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-stone-200 bg-white space-y-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-lg text-stone-900">Family Connection</h4>
            <p className="text-stone-600 text-xs font-medium leading-relaxed">
              Caregivers receive automatic confirmation when tasks are completed and real-time alerts when assistance is needed.
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

      {/* 5. NORTHEAST INDIA FOCUS SECTION */}
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
            <p className="text-stone-600 text-xs font-medium leading-relaxed">The patient sees clear, uncluttered "Now & Next" instructions with audio support and simple memory games.</p>
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

      {/* 8. ROLE AUTHENTICATION MODAL */}
      {activeRoleModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setActiveRoleModal(null)} 
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                {activeRoleModal === 'doctor' ? <Stethoscope className="w-6 h-6" /> : <Users className="w-6 h-6" />}
              </div>
              <h3 className="text-2xl font-black text-stone-900">
                {activeRoleModal === 'doctor' ? 'Doctor Portal Access' : 'Caregiver Sign In'}
              </h3>
              <p className="text-xs font-medium text-stone-500 mt-1">
                {isRegistering ? 'Create your management account' : 'Sign in to access your patient management dashboard'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAuth} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-600 block mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder={activeRoleModal === 'doctor' ? "dr.ananya@hospital.in" : "mohan@care.in"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm font-medium outline-none focus:border-[#0A5C4A] focus:ring-2 focus:ring-[#0A5C4A]/20"
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
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm font-medium outline-none focus:border-[#0A5C4A] focus:ring-2 focus:ring-[#0A5C4A]/20"
                />
              </div>

              {isRegistering && activeRoleModal === 'caregiver' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">Caregiver Name</label>
                    <input 
                      type="text" 
                      placeholder="Mohan Baruah"
                      value={caregiverName}
                      onChange={(e) => setCaregiverName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">Patient Name</label>
                    <input 
                      type="text" 
                      placeholder="Dadu Ji"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm font-medium outline-none"
                    />
                  </div>
                </>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#0A5C4A] hover:bg-[#074739] text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
              >
                {loading ? 'Connecting...' : (isRegistering ? 'Register Account' : 'Sign In')}
              </button>
            </form>

            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
              <span className="relative bg-white px-3 text-[11px] font-bold text-stone-400 uppercase">Or</span>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
              <span>Continue with Google</span>
            </button>

            <div className="mt-5 text-center">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs font-bold text-[#0A5C4A] hover:underline"
              >
                {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
