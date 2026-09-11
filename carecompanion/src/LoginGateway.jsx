import React, { useState } from 'react';
import { 
  ShieldCheck, Stethoscope, User, HeartPulse, 
  Lock, ArrowRight, BrainCircuit, Clock
} from 'lucide-react';
import { db } from './db';
import { auth, db as firebaseDb } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
    <div className="text-center p-6 bg-slate-800 rounded-2xl border border-slate-700 animate-in zoom-in">
      <div className="text-4xl mb-4">🏆</div>
      <p className="text-emerald-400 font-bold mb-2">Evaluation Complete!</p>
      <p className="text-sm text-slate-400 animate-pulse">AI is calculating your baseline...</p>
    </div>
  );

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center animate-in fade-in">
      <p className="text-sm text-slate-300 font-bold mb-4 flex items-center justify-center">
        <BrainCircuit className="w-5 h-5 mr-2 text-purple-400" /> AI Baseline Test
      </p>
      <p className="text-xs text-slate-400 mb-6">Match the pairs as quickly as possible to calibrate your therapy level.</p>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, i) => (
          <button key={i} onClick={() => handleFlip(i)} className={`h-16 text-2xl flex items-center justify-center rounded-xl transition-all shadow-md ${card.flipped || card.matched ? 'bg-white' : 'bg-purple-600 rotate-180 hover:bg-purple-500'}`}>
            <span className={card.flipped || card.matched ? 'opacity-100' : 'opacity-0'}>{card.icon}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 text-xs font-bold text-slate-500 bg-slate-900 px-3 py-1.5 rounded-full inline-block border border-slate-700">Mistakes: {errors}</div>
    </div>
  );
};

export default function LoginGateway({ onLogin }) {
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false);
  
  const [patientData, setPatientData] = useState({
    name: '', caregiver: '', emergencyPhone: '', dementia_level: 1, stage: 'Mild', doctor_email: ''
  });

  const [scheduleData, setScheduleData] = useState({
    wakeTime: '08:00', breakfastTime: '09:00', lunchTime: '13:00', dinnerTime: '19:00', sleepTime: '21:00'
  });

  const [doctorData, setDoctorData] = useState({
    name: '', specialty: '', hospital: '', certificate: ''
  });

  const handleLogin = async () => {
    try {
      setError('');
      setIsGoogleSignIn(false);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(firebaseDb, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        onLogin({ email, ...userDoc.data() });
      } else {
        setStep('choose_role');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to login. If you don't have an account, please click Register.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userDoc = await getDoc(doc(firebaseDb, 'users', result.user.uid));
      if (userDoc.exists()) {
        onLogin({ email: result.user.email, ...userDoc.data() });
      } else {
        setIsGoogleSignIn(true);
        setEmail(result.user.email || '');
        setStep('choose_role');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google.");
    }
  };

  const handleBaselineComplete = (latency, errors) => {
    let level = 1;
    let stage = 'Mild';
    if (errors >= 4 || latency > 40) { level = 3; stage = 'Severe'; }
    else if (errors >= 2 || latency > 20) { level = 2; stage = 'Moderate'; }
    setPatientData({...patientData, dementia_level: level, stage: stage});
    setStep('link_doctor');
  };

  const submitPatientRegister = async () => {
    try {
      setError('');
      let uid;
      if (isGoogleSignIn && auth.currentUser && auth.currentUser.email === email) {
        uid = auth.currentUser.uid;
      } else {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          uid = userCredential.user.uid;
        } catch (authErr) {
          if (authErr.code === 'auth/email-already-in-use') {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            uid = userCredential.user.uid;
          } else {
            throw authErr;
          }
        }
      }

      const userData = { role: 'patient', email, ...patientData };
      await setDoc(doc(firebaseDb, 'users', uid), userData);

      const routinesToCreate = [
        { title: 'Wake Up & Water', detail: '1 Large Glass of water', category: 'HEALTH ☀️', time: scheduleData.wakeTime, reqPhoto: 0 },
        { title: 'Breakfast & Meds', detail: 'Morning routine', category: 'MEAL 🍲', time: scheduleData.breakfastTime, reqPhoto: 1 },
        { title: 'Lunch', detail: 'Afternoon meal', category: 'MEAL 🍲', time: scheduleData.lunchTime, reqPhoto: 0 },
        { title: 'Dinner', detail: 'Evening meal', category: 'MEAL 🍲', time: scheduleData.dinnerTime, reqPhoto: 0 },
        { title: 'Sleep Preparation', detail: 'Wind down', category: 'HEALTH 🌙', time: scheduleData.sleepTime, reqPhoto: 0 }
      ];

      const localRoutinesToSave = [];

      for (const r of routinesToCreate) {
        const task_id = 'task_' + Math.random().toString(36).substr(2, 9);
        localRoutinesToSave.push({
          task_id,
          title: r.title,
          detail: r.detail,
          category: r.category,
          scheduled_time: r.time,
          is_completed: 0,
          requires_photo: r.reqPhoto,
          ai_audit_status: r.reqPhoto ? 'pending' : 'none'
        });

        // We can keep the API call if the backend is still used for other things
        try {
          await fetch('http://localhost:8000/api/routines', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              task_id,
              patient_email: email,
              title: r.title,
              detail: r.detail,
              category: r.category,
              scheduled_time: r.time,
              requires_photo: r.reqPhoto,
              ai_audit_status: r.reqPhoto ? 'pending' : 'none'
            })
          });
        } catch (fetchErr) {
          console.warn("Could not sync routine to backend, but saved locally.", fetchErr);
        }
      }

      await db.schedule_and_audit.bulkAdd(localRoutinesToSave);
      onLogin({ role: 'patient', email, ...patientData });

    } catch (err) {
      console.error(err);
      setError(err.message || "Registration error: Failed to create patient account.");
    }
  };

  const submitDoctorRegister = async () => {
    try {
      setError('');
      let uid;
      if (isGoogleSignIn && auth.currentUser && auth.currentUser.email === email) {
        uid = auth.currentUser.uid;
      } else {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          uid = userCredential.user.uid;
        } catch (authErr) {
          if (authErr.code === 'auth/email-already-in-use') {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            uid = userCredential.user.uid;
          } else {
            throw authErr;
          }
        }
      }
      
      const userData = { role: 'doctor', email, ...doctorData };
      await setDoc(doc(firebaseDb, 'users', uid), userData);
      
      onLogin({ role: 'doctor', email, ...doctorData });
    } catch (err) {
      console.error(err);
      setError(err.message || "Registration error: Failed to create doctor account.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 font-sans select-none text-white">
      
      <div className="text-center mb-8 max-w-md">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-emerald-400 text-xs font-bold mb-3 tracking-wide">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>CareLink Authentication</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          AASTA <span className="text-emerald-400">CareLink</span>
        </h1>
      </div>

      <div className="w-full max-w-md bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-700">
        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm font-bold">{error}</div>}

        {step === 'login' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Login or Register</h2>
            <input 
              type="email" placeholder="Enter your email" 
              className="w-full p-3 rounded bg-slate-900 border border-slate-700 text-white"
              value={email} onChange={e => setEmail(e.target.value)}
            />
            <input 
              type="password" placeholder="Enter your password" 
              className="w-full p-3 rounded bg-slate-900 border border-slate-700 text-white"
              value={password} onChange={e => setPassword(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={handleLogin} className="w-1/2 bg-emerald-600 hover:bg-emerald-500 py-3 rounded font-bold">
                Login <ArrowRight className="inline w-4 h-4 ml-1" />
              </button>
              <button onClick={() => {
                setError('');
                if(!email || !password) {
                  setError("Please enter email and password to register");
                  return;
                }
                setStep('choose_role');
              }} className="w-1/2 bg-slate-600 hover:bg-slate-500 py-3 rounded font-bold">
                Register
              </button>
            </div>
            <div className="mt-4">
              <button onClick={handleGoogleSignIn} className="w-full bg-red-600 hover:bg-red-500 py-3 rounded font-bold flex items-center justify-center gap-2">
                Sign in with Google
              </button>
            </div>
          </div>
        )}

        {step === 'choose_role' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Account Not Found</h2>
            <p className="text-sm text-slate-400">Would you like to register as a Patient or Doctor?</p>
            <button onClick={() => setStep('patient_details')} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded font-bold flex items-center justify-center space-x-2">
              <HeartPulse className="w-5 h-5"/> <span>Register as Patient</span>
            </button>
            <button onClick={() => setStep('doctor_register')} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold flex items-center justify-center space-x-2">
              <Stethoscope className="w-5 h-5"/> <span>Register as Doctor</span>
            </button>
          </div>
        )}

        {step === 'patient_details' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Patient Details</h2>
            <input type="text" placeholder="Patient Name" className="w-full p-3 rounded bg-slate-900 border border-slate-700"
              value={patientData.name} onChange={e => setPatientData({...patientData, name: e.target.value})} />
            <input type="text" placeholder="Caregiver Name" className="w-full p-3 rounded bg-slate-900 border border-slate-700"
              value={patientData.caregiver} onChange={e => setPatientData({...patientData, caregiver: e.target.value})} />
            <input type="text" placeholder="Emergency Phone" className="w-full p-3 rounded bg-slate-900 border border-slate-700"
              value={patientData.emergencyPhone} onChange={e => setPatientData({...patientData, emergencyPhone: e.target.value})} />
            <button onClick={() => setStep('patient_schedule')} className="w-full bg-emerald-600 py-3 rounded font-bold">Next: Daily Schedule</button>
          </div>
        )}

        {step === 'patient_schedule' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4 flex items-center"><Clock className="w-5 h-5 mr-2 text-blue-400"/> Daily Routine</h2>
            <p className="text-sm text-slate-400">Set your usual schedule to automatically configure the Care Plan.</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-2 rounded border border-slate-700">
                <label className="text-xs text-slate-400 block mb-1">Wake Up</label>
                <input type="time" className="w-full bg-transparent outline-none" value={scheduleData.wakeTime} onChange={e => setScheduleData({...scheduleData, wakeTime: e.target.value})} />
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-700">
                <label className="text-xs text-slate-400 block mb-1">Breakfast</label>
                <input type="time" className="w-full bg-transparent outline-none" value={scheduleData.breakfastTime} onChange={e => setScheduleData({...scheduleData, breakfastTime: e.target.value})} />
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-700">
                <label className="text-xs text-slate-400 block mb-1">Lunch</label>
                <input type="time" className="w-full bg-transparent outline-none" value={scheduleData.lunchTime} onChange={e => setScheduleData({...scheduleData, lunchTime: e.target.value})} />
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-700">
                <label className="text-xs text-slate-400 block mb-1">Dinner</label>
                <input type="time" className="w-full bg-transparent outline-none" value={scheduleData.dinnerTime} onChange={e => setScheduleData({...scheduleData, dinnerTime: e.target.value})} />
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-700 col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Sleep Time</label>
                <input type="time" className="w-full bg-transparent outline-none" value={scheduleData.sleepTime} onChange={e => setScheduleData({...scheduleData, sleepTime: e.target.value})} />
              </div>
            </div>

            <button onClick={() => setStep('dementia_test')} className="w-full bg-emerald-600 py-3 rounded font-bold mt-2">Next: AI Evaluation</button>
          </div>
        )}

        {step === 'dementia_test' && (
          <BaselineGame onComplete={handleBaselineComplete} />
        )}

        {step === 'link_doctor' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Link Your Doctor</h2>
            <p className="text-sm text-slate-400">Enter your doctor's email to share your portal with them.</p>
            <input type="email" placeholder="Doctor's Email" className="w-full p-3 rounded bg-slate-900 border border-slate-700"
              value={patientData.doctor_email} onChange={e => setPatientData({...patientData, doctor_email: e.target.value})} />
            
            <button onClick={submitPatientRegister} className="w-full bg-emerald-600 py-3 rounded font-bold">Complete Registration</button>
          </div>
        )}

        {step === 'doctor_register' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Doctor Details</h2>
            <input type="text" placeholder="Doctor Name" className="w-full p-3 rounded bg-slate-900 border border-slate-700"
              value={doctorData.name} onChange={e => setDoctorData({...doctorData, name: e.target.value})} />
            <input type="text" placeholder="Specialty" className="w-full p-3 rounded bg-slate-900 border border-slate-700"
              value={doctorData.specialty} onChange={e => setDoctorData({...doctorData, specialty: e.target.value})} />
            <input type="text" placeholder="Hospital/Clinic" className="w-full p-3 rounded bg-slate-900 border border-slate-700"
              value={doctorData.hospital} onChange={e => setDoctorData({...doctorData, hospital: e.target.value})} />
            <input type="text" placeholder="Medical Certificate/License No." className="w-full p-3 rounded bg-slate-900 border border-slate-700"
              value={doctorData.certificate} onChange={e => setDoctorData({...doctorData, certificate: e.target.value})} />
            <button onClick={submitDoctorRegister} className="w-full bg-blue-600 py-3 rounded font-bold">Register as Doctor</button>
          </div>
        )}

      </div>
    </div>
  );
}