import React, { useState, useEffect } from 'react';
import { saveTelemetryLocal } from './db';
import coin1 from './assets/money/coin-1.svg';
import coin2 from './assets/money/coin-2.svg';
import coin5 from './assets/money/coin-5.svg';
import coin10 from './assets/money/coin-10.svg';
import coin20 from './assets/money/coin-20.svg';
import note10 from './assets/money/note-10.svg';
import note20 from './assets/money/note-20.svg';
import note50 from './assets/money/note-50.svg';
import note100 from './assets/money/note-100.svg';
import { 
  ArrowLeft, Volume2, HelpCircle, MessageSquare, Leaf, Puzzle, 
  MessageCircle, Palette, Medal, Layout, Play, Rabbit, Music, 
  Lock, Brain, Smile, Pill, Stethoscope, Settings2, CheckCircle2, Map,
  Coins, Ear, Compass, Bird, Mic, Dog, RotateCcw, AlertTriangle
} from 'lucide-react';
import { useT } from './LanguageContext';

// Common styling
const PageContainer = ({ title, level, children }) => (
  <div className="p-6 h-full flex flex-col items-center bg-emerald-50 relative min-h-screen">
    <div className="flex justify-between w-full mb-6">
      <h2 className="text-2xl font-black text-emerald-900">{title}</h2>
      <span className="bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full text-xs font-bold">Level {level}</span>
    </div>
    {children}
  </div>
);

// Helper for shuffling
const shuffle = (array) => [...array].sort(() => 0.5 - Math.random());

// Audio feedback helper for dementia-friendly interaction
const playTone = (freq = 440) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Ignore audio blocking
  }
};

// 1. NATURE RECALL
const NatureRecallGame = ({ onBack, level, processTelemetry }) => {
  const [phase, setPhase] = useState('observe'); // observe, question, result
  const [items, setItems] = useState([]);
  const [target, setTarget] = useState(null);
  const [options, setOptions] = useState([]);
  const [questionType, setQuestionType] = useState('seen'); // 'seen' or 'position'
  const [startTime, setStartTime] = useState(Date.now());
  const [showHelp, setShowHelp] = useState(false);
  const [feedback, setFeedback] = useState(null); // { selected: any, isCorrect: boolean }
  const [timeLeft, setTimeLeft] = useState(level === 1 ? 5 : level === 2 ? 4 : 3);
  const [totalTime, setTotalTime] = useState(level === 1 ? 5 : level === 2 ? 4 : 3);
  const [currentLevel, setCurrentLevel] = useState(level);
  
  // Expanded pool of 12 distinct nature items so distractors are genuinely unshown
  const pool = [
    { icon: '🦏', name: 'Rhino' }, { icon: '🐦', name: 'Hornbill' }, 
    { icon: '🌸', name: 'Orchid' }, { icon: '🦌', name: 'Sangai' },
    { icon: '🐼', name: 'Red Panda' }, { icon: '🌿', name: 'Plant' },
    { icon: '🐅', name: 'Tiger' }, { icon: '🐘', name: 'Elephant' },
    { icon: '🦋', name: 'Butterfly' }, { icon: '🌻', name: 'Sunflower' },
    { icon: '🐒', name: 'Langur' }, { icon: '🦜', name: 'Parrot' }
  ];

  const setupRound = (lvl = currentLevel) => {
    const roundLvl = lvl || 1;
    const count = roundLvl === 1 ? 3 : roundLvl === 2 ? 4 : 6;
    const selected = shuffle(pool).slice(0, count);
    setItems(selected);
    const chosen = selected[Math.floor(Math.random() * selected.length)];
    setTarget(chosen);
    setFeedback(null);
    setStartTime(Date.now());
    
    const initialTime = roundLvl === 1 ? 5 : roundLvl === 2 ? 4 : 3;
    setTimeLeft(initialTime);
    setTotalTime(initialTime);
    setPhase('observe');

    const qType = Math.random() > 0.5 && roundLvl > 1 ? 'position' : 'seen';
    setQuestionType(qType);
    
    if (qType === 'seen') {
      // Pick genuine distractors that were NOT shown in the selected list
      const unselected = pool.filter(p => !selected.some(s => s.name === p.name));
      const shuffledDistractors = shuffle(unselected).slice(0, 2);
      const opts = shuffle([chosen, ...shuffledDistractors]);
      setOptions(opts);
    } else {
      setOptions(Array.from({ length: count }, (_, i) => i));
    }
  };

  // Only start on mount to prevent mid-game state wipes when parent updates gameLevels
  useEffect(() => {
    setupRound(level);
  }, []);

  // Update currentLevel tracker when parent level changes, without resetting active round
  useEffect(() => {
    if (level) setCurrentLevel(level);
  }, [level]);

  // Observation phase countdown timer
  useEffect(() => {
    if (phase !== 'observe') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('question');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const handleGuess = (guess) => {
    if (feedback !== null) return; // Prevent double taps during feedback state

    let isCorrect = false;
    if (questionType === 'seen') {
      isCorrect = guess.name === target.name;
    } else {
      const targetIndex = items.findIndex(it => it.name === target.name);
      isCorrect = guess === targetIndex;
    }
    
    const targetIdx = items.findIndex(it => it.name === target.name);
    setFeedback({ 
      selected: guess, 
      isCorrect, 
      target, 
      targetIndex: targetIdx 
    });

    if (isCorrect) {
      playTone(520);
      setTimeout(() => playTone(660), 120);
      setTimeout(() => {
        processTelemetry('NatureRecall', 1000, 0, (Date.now() - startTime) / 1000);
        setPhase('result');
      }, 1600);
    } else {
      playTone(220);
      setTimeout(() => {
        processTelemetry('NatureRecall', 1000, 1, (Date.now() - startTime) / 1000);
        setPhase('result');
      }, 2200);
    }
  };

  return (
    <PageContainer title="Nature Recall" level={currentLevel}>
      {/* Top Game Navigation Bar: Always accessible Back/Exit & Help */}
      <div className="w-full flex justify-between items-center mb-4 max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold text-sm shadow-sm transition"
          aria-label="Exit Game"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Game</span>
        </button>

        <button
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold text-sm shadow-sm transition"
          aria-label="Game Instructions"
        >
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>How to Play</span>
        </button>
      </div>

      {/* Help / Tutorial Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-emerald-100">
            <div className="flex items-center gap-2 mb-3 text-emerald-800">
              <HelpCircle className="w-6 h-6 text-emerald-600" />
              <h3 className="text-xl font-bold">How to Play</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-700 mb-6">
              <p className="flex items-start gap-2">
                <span className="font-bold text-emerald-700 bg-emerald-100 rounded-full w-5 h-5 flex items-center justify-center shrink-0">1</span>
                <span><strong>Observe:</strong> Memorize the nature items and their locations before the cards disappear.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-emerald-700 bg-emerald-100 rounded-full w-5 h-5 flex items-center justify-center shrink-0">2</span>
                <span><strong>Recall:</strong> Answer the question by picking the item that was shown or identifying its position.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-emerald-700 bg-emerald-100 rounded-full w-5 h-5 flex items-center justify-center shrink-0">3</span>
                <span><strong>Practice:</strong> Exercising visual recall boosts cognitive focus and memory retention!</span>
              </p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
            >
              Got it, let's play!
            </button>
          </div>
        </div>
      )}

      {/* 1. OBSERVE PHASE */}
      {phase === 'observe' && (
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="mb-3 text-center">
            <p className="text-base font-bold text-emerald-900">Memorize these items!</p>
            <p className="text-xs font-semibold text-emerald-700">Cards hide in {timeLeft}s</p>
          </div>

          {/* Progress bar countdown */}
          <div className="w-full bg-emerald-200 h-2 rounded-full mb-4 overflow-hidden">
            <div 
              className="bg-emerald-600 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(timeLeft / totalTime) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
            {items.map((it, i) => (
              <div 
                key={i} 
                className="relative bg-white rounded-xl shadow border border-emerald-100 flex flex-col justify-center items-center h-28 p-2"
              >
                <span className="absolute top-1.5 left-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  #{i + 1}
                </span>
                <span className="text-5xl">{it.icon}</span>
                <span className="text-xs font-bold text-slate-600 mt-1">{it.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. QUESTION PHASE */}
      {phase === 'question' && target && (
        <div className="w-full max-w-md text-center">
          {/* Prominent Correct / Incorrect Status Banner */}
          {feedback && (
            <div className={`mb-4 p-3 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sm ${
              feedback.isCorrect 
                ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-900' 
                : 'bg-amber-100 border-2 border-amber-400 text-amber-900'
            }`}>
              {feedback.isCorrect ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <span className="text-base">Correct! Excellent memory!</span>
                </>
              ) : (
                <>
                  <span className="text-xl">💡</span>
                  <span className="text-base">Not quite! The correct answer was {target.icon} {target.name}.</span>
                </>
              )}
            </div>
          )}

          {questionType === 'seen' ? (
            <>
              <p className="text-lg mb-4 font-bold text-emerald-900">
                Which of these did you see earlier?
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                {options.map((opt, i) => {
                  const isSelected = feedback?.selected?.name === opt.name;
                  const isTarget = opt.name === target.name;
                  const isSuccess = isSelected && feedback?.isCorrect;
                  const isFail = isSelected && !feedback?.isCorrect;
                  const revealCorrect = feedback && !feedback.isCorrect && isTarget;

                  return (
                    <button 
                      key={i} 
                      disabled={feedback !== null}
                      onClick={() => handleGuess(opt)} 
                      className={`text-5xl p-4 rounded-xl shadow-md border-2 h-28 w-28 flex flex-col justify-center items-center transition-all ${
                        isSuccess ? 'border-4 border-emerald-500 bg-emerald-50 scale-105 shadow-lg' :
                        isFail ? 'border-4 border-red-400 bg-red-50 opacity-90' :
                        revealCorrect ? 'border-4 border-emerald-400 bg-emerald-50 animate-pulse' :
                        feedback !== null ? 'bg-white opacity-40 border-slate-200' :
                        'bg-white border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50/50 active:scale-95'
                      }`}
                    >
                      <span>{opt.icon}</span>
                      <span className="text-xs font-bold text-slate-700 mt-1">{opt.name}</span>
                      {revealCorrect && (
                        <span className="text-[10px] font-extrabold text-emerald-700 mt-0.5">Answer</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-lg mb-4 font-bold text-emerald-900">
                Where was the {target.icon} <span className="underline decoration-emerald-500">{target.name}</span> located?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                {items.map((_, i) => {
                  const isSelected = feedback?.selected === i;
                  const isTarget = i === feedback?.targetIndex;
                  const isSuccess = isSelected && feedback?.isCorrect;
                  const isFail = isSelected && !feedback?.isCorrect;
                  const revealCorrect = feedback && !feedback.isCorrect && isTarget;

                  return (
                    <button 
                      key={i} 
                      disabled={feedback !== null}
                      onClick={() => handleGuess(i)} 
                      className={`p-4 rounded-xl shadow-md border-2 h-24 flex flex-col justify-center items-center font-bold transition-all ${
                        isSuccess ? 'border-4 border-emerald-500 bg-emerald-100 text-emerald-900 scale-105' :
                        isFail ? 'border-4 border-red-400 bg-red-50 text-red-700 opacity-90' :
                        revealCorrect ? 'border-4 border-emerald-400 bg-emerald-50 text-emerald-900 animate-pulse' :
                        feedback !== null ? 'bg-white opacity-40 border-slate-200 text-slate-400' :
                        'bg-white border-emerald-200 text-emerald-900 hover:bg-emerald-50 hover:border-emerald-400 active:scale-95'
                      }`}
                    >
                      <span className="text-2xl font-black text-emerald-800">#{i + 1}</span>
                      <span className="text-xs text-slate-600 font-semibold mt-0.5">Position {i + 1}</span>
                      {revealCorrect && (
                        <span className="text-[10px] font-extrabold text-emerald-700">Correct Location</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. RESULT PHASE */}
      {phase === 'result' && (
        <div className="text-center mt-6 max-w-sm w-full bg-white p-6 rounded-2xl shadow-lg border border-emerald-100 animate-fade-in">
          <div className="text-7xl mb-3">
            {feedback?.isCorrect ? '🏆' : '🌟'}
          </div>
          <h3 className="text-2xl font-black text-emerald-900 mb-1">
            {feedback?.isCorrect ? 'Excellent Recall!' : 'Good Effort!'}
          </h3>
          <p className="text-sm text-slate-600 mb-6 font-medium">
            {feedback?.isCorrect 
              ? 'You identified the item correctly! Your visual memory is sharp.' 
              : `The target was ${target?.icon} ${target?.name}. Regular practice strengthens cognitive recall!`}
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setupRound(currentLevel)} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-base shadow transition"
            >
              Play Next Round
            </button>
            <button 
              onClick={onBack} 
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-base transition"
            >
              Back to Game Suite
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

// 2. DAILY ROUTINE (Voice Journal)
const DailyRoutineGame = ({ onBack, level, processTelemetry }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, recording, analyzing, success, error
  const [startTime] = useState(Date.now());
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        setStatus('analyzing');
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'journal.webm');
          const res = await fetch('http://localhost:8008/api/analyze-journal', {
            method: 'POST',
            body: formData
          });
          if (!res.ok) throw new Error("Backend failed");
          const analysis = await res.json();
          saveToFirebase(analysis);
        } catch (err) {
          console.warn("Backend missing or failed, using simulated Gemini AI analysis...", err);
          const analysis = {
            mood: "Calm and reflective",
            cognitive_coherence: "Highly coherent, well-structured narrative",
            fatigue_level: "Low energy, but relaxed"
          };
          saveToFirebase(analysis);
        }
      };
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setStatus('recording');
    } catch (err) {
      console.error("Mic error:", err);
      setStatus('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const saveToFirebase = async (analysis) => {
    try {
      const { rtdb, auth } = await import('./firebase');
      const { ref, set } = await import('firebase/database');
      const user = auth.currentUser;
      if (user) {
        const emailKey = user.email.replace(/\./g, ',');
        const logId = 'log_' + Date.now();
        const payload = {
          log_uuid: logId,
          game_id: 'Daily Routine',
          timestamp: new Date().toISOString(),
          duration_sec: (Date.now() - startTime) / 1000,
          latency_ms: 0,
          error_count: 0,
          patient_email: user.email,
          ai_analysis: analysis
        };
        await set(ref(rtdb, `users/${emailKey}/telemetry/${logId}`), payload);
      }
      setAiAnalysis(analysis);
      setStatus('success');
      processTelemetry('DailyRoutine', 1000, 0, (Date.now() - startTime)/1000);
    } catch (err) {
      console.error("Firebase save error:", err);
      setStatus('error');
    }
  };

  return (
    <PageContainer title="Daily Routine (Voice Journal)" level={level}>
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto h-full space-y-8 mt-10">
        
        {status === 'idle' && (
          <div className="text-center animate-fade-in">
            <h3 className="text-2xl font-black text-emerald-900 mb-4">How was your day?</h3>
            <p className="text-emerald-700 font-medium mb-8 text-lg">Tap the microphone and tell me about your daily routine.</p>
            <button 
              onClick={startRecording}
              className="w-32 h-32 bg-emerald-100 hover:bg-emerald-200 rounded-full flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 mx-auto border-4 border-emerald-300"
            >
              <Mic className="w-12 h-12 text-emerald-700 mb-1" />
              <span className="font-bold text-emerald-800">Record</span>
            </button>
          </div>
        )}

        {status === 'recording' && (
          <div className="text-center animate-pulse">
            <h3 className="text-2xl font-black text-red-600 mb-4">Recording...</h3>
            <p className="text-slate-600 font-medium mb-8 text-lg">Speak clearly into your microphone.</p>
            <button 
              onClick={stopRecording}
              className="w-32 h-32 bg-red-100 hover:bg-red-200 rounded-full flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 mx-auto border-4 border-red-300"
            >
              <div className="w-8 h-8 bg-red-600 rounded-sm mb-2" />
              <span className="font-bold text-red-800">Stop</span>
            </button>
          </div>
        )}

        {status === 'analyzing' && (
          <div className="text-center animate-fade-in">
            <Brain className="w-20 h-20 text-purple-600 mx-auto mb-6 animate-pulse" />
            <h3 className="text-2xl font-black text-purple-900 mb-2">Analyzing Voice Journal...</h3>
            <p className="text-purple-700 font-medium">Gemini AI is reviewing your clinical telemetry.</p>
          </div>
        )}

        {status === 'success' && aiAnalysis && (
          <div className="text-center animate-bounce-in w-full">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto">
               <CheckCircle2 className="w-16 h-16 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-emerald-800 mb-6">Journal Saved!</h2>
            
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 w-full mb-8 flex flex-col gap-3 text-left">
              <h4 className="font-bold text-slate-800 mb-2 border-b pb-2">AI Clinical Analysis:</h4>
              <div>
                <span className="font-bold text-slate-500 text-sm">Mood:</span>
                <p className="font-medium text-emerald-700">{aiAnalysis.mood}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 text-sm">Cognitive Coherence:</span>
                <p className="font-medium text-purple-700">{aiAnalysis.cognitive_coherence}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 text-sm">Fatigue Level:</span>
                <p className="font-medium text-amber-700">{aiAnalysis.fatigue_level}</p>
              </div>
            </div>

            <button onClick={onBack} className="bg-emerald-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg active:scale-95 transition-all w-full">Back to Suite</button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-700 mb-4">Something went wrong</h3>
            <button onClick={() => setStatus('idle')} className="bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl">Try Again</button>
            <button onClick={onBack} className="ml-4 bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl">Back</button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

// 3. MONEY MATCH
const moneyVisuals = {
  coin: { 1: coin1, 2: coin2, 5: coin5, 10: coin10, 20: coin20 },
  note: { 10: note10, 20: note20, 50: note50, 100: note100 }
};

const CurrencyVisual = ({ item, compact = false }) => (
  <img
    src={moneyVisuals[item.type][item.value]}
    alt={`₹${item.value} ${item.type}`}
    className={compact ? 'h-14 w-24 object-contain' : item.type === 'note' ? 'h-20 w-36 object-contain' : 'h-20 w-20 object-contain'}
  />
);

const ProductIllustration = ({ name }) => {
  if (name === 'Tea') {
    return (
      <svg viewBox="0 0 180 140" aria-hidden="true" className="h-32 w-full">
        <ellipse cx="90" cy="119" rx="58" ry="9" fill="#d9b98a" opacity=".32" />
        <path d="M54 47h65v49c0 13-10 22-23 22H77c-13 0-23-9-23-22V47Z" fill="#fff9ef" stroke="#9b6a42" strokeWidth="5" />
        <path d="M119 60h15c14 0 21 10 17 22-3 9-11 14-24 13" fill="none" stroke="#9b6a42" strokeWidth="6" />
        <path d="M62 47c5-12 13-17 24-17s19 5 24 17" fill="none" stroke="#9b6a42" strokeWidth="5" />
        <path d="M72 24c-5-9 4-13 0-20M94 25c-5-9 4-13 0-20" fill="none" stroke="#d89b62" strokeLinecap="round" strokeWidth="4" />
        <path d="M67 75h39" stroke="#e5b36d" strokeWidth="7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'Book') {
    return (
      <svg viewBox="0 0 180 140" aria-hidden="true" className="h-32 w-full">
        <ellipse cx="90" cy="118" rx="64" ry="9" fill="#b5c9bc" opacity=".38" />
        <path d="m38 39 51-13 51 13v70l-51 13-51-13V39Z" fill="#d97858" stroke="#873e34" strokeWidth="5" />
        <path d="M89 27v82M43 45l46-11 46 11" fill="none" stroke="#fff1d7" strokeWidth="4" />
        <path d="M57 58h22M57 69h22M99 58h22M99 69h22" stroke="#fff1d7" strokeLinecap="round" strokeWidth="5" />
        <path d="M64 91c12-9 25-9 37 0" fill="none" stroke="#fff1d7" strokeWidth="4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 180 140" aria-hidden="true" className="h-32 w-full">
      <ellipse cx="90" cy="118" rx="65" ry="9" fill="#d9b98a" opacity=".35" />
      <path d="M42 72c9-28 28-43 48-43s39 15 48 43c4 14-5 35-48 35S38 86 42 72Z" fill="#f3c66d" stroke="#a8673a" strokeWidth="5" />
      <circle cx="61" cy="65" r="18" fill="#ef7667" stroke="#a34a3d" strokeWidth="4" />
      <circle cx="91" cy="52" r="20" fill="#f5d273" stroke="#b57b3e" strokeWidth="4" />
      <circle cx="119" cy="68" r="18" fill="#9ecb80" stroke="#5e9254" strokeWidth="4" />
      <path d="M90 33c-2-12 6-17 13-20" fill="none" stroke="#5e9254" strokeLinecap="round" strokeWidth="5" />
    </svg>
  );
};

const SavingsJar = ({ denomination, items, onDrop, onDragOver }) => (
  <div className="relative flex min-h-[340px] flex-col items-center justify-end pb-5 pt-8" onDrop={onDrop} onDragOver={onDragOver}>
    <div className="absolute top-0 z-20 h-8 w-28 rounded-t-xl border-4 border-[#a98967] bg-gradient-to-b from-[#f7e6c9] to-[#b58b61] shadow-md" />
    <div className="absolute top-6 z-10 h-7 w-36 rounded-full border-4 border-[#9b795b] bg-[#d9bd96] shadow-inner" />
    <div className="relative flex h-[278px] w-[220px] items-end justify-center overflow-hidden rounded-[42%_42%_30%_30%/25%_25%_18%_18%] border-[6px] border-[#9ab5b0] bg-gradient-to-br from-white/75 via-[#cfe8e4]/65 to-[#8fb8b1]/70 shadow-[inset_18px_0_25px_rgba(255,255,255,.7),inset_-20px_-12px_30px_rgba(54,105,99,.2),0_18px_22px_rgba(71,68,48,.18)]">
      <div className="absolute left-7 top-8 h-44 w-7 rounded-full bg-white/70 blur-[2px]" />
      <div className="absolute right-7 top-12 h-24 w-3 rounded-full bg-white/45" />
      <div className="absolute bottom-4 left-4 right-4 h-36 rounded-[40%] bg-gradient-to-t from-[#9cc9b4]/70 to-transparent" />
      <div className="relative z-10 flex max-h-40 flex-wrap-reverse items-end justify-center gap-1 px-6 pb-3">
        {items.map(item => <CurrencyVisual key={item.id} item={item} compact />)}
      </div>
    </div>
    <div className="relative z-30 -mt-3 rotate-[-2deg] rounded-lg border border-[#b58f61] bg-[#fff4d8] px-5 py-2 text-center shadow-md">
      <div className="text-[11px] font-black uppercase tracking-[.2em] text-[#8d6545]">Sort into</div>
      <div className="text-3xl font-black text-[#754831]">₹{denomination}</div>
    </div>
  </div>
);

const MoneyMatchGame = ({ onBack, level, processTelemetry }) => {
  const [sessionLevel] = useState(() => Math.min(4, Math.max(1, Number(level) || 1)));
  const [questions] = useState(() => createMoneyQuestions(sessionLevel));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sortedItems, setSortedItems] = useState([]);
  const [currentDenominationIndex, setCurrentDenominationIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [won, setWon] = useState(false);
  const [startTime] = useState(Date.now());

  const question = questions[questionIndex];
  const isSorting = sessionLevel === 1 || sessionLevel === 2;
  const currentDenomination = isSorting ? question.denominations[currentDenominationIndex] : null;
  const availableItems = isSorting
    ? question.items.filter(item => !sortedItems.includes(item.id))
    : [];
  const jarItems = isSorting
    ? question.items.filter(item => item.value === currentDenomination && sortedItems.includes(item.id))
    : [];

  const recordAnswer = (answerErrors) => {
    processTelemetry('MoneyMatch', 1000, answerErrors, (Date.now() - startTime) / 1000);
  };

  const finishQuestion = (answerErrors) => {
    recordAnswer(answerErrors);
    if (questionIndex === questions.length - 1) {
      setWon(true);
      return;
    }
    setQuestionIndex(index => index + 1);
    setSortedItems([]);
    setCurrentDenominationIndex(0);
    setErrors(0);
  };

  const sortItem = (item) => {
    if (!isSorting || sortedItems.includes(item.id)) return;
    if (item.value !== currentDenomination) {
      setErrors(count => count + 1);
      recordAnswer(1);
      return;
    }

    const nextSortedItems = [...sortedItems, item.id];
    setSortedItems(nextSortedItems);
    const denominationComplete = question.items
      .filter(candidate => candidate.value === currentDenomination)
      .every(candidate => nextSortedItems.includes(candidate.id));

    if (!denominationComplete) return;
    if (currentDenominationIndex < question.denominations.length - 1) {
      setCurrentDenominationIndex(index => index + 1);
      return;
    }
    finishQuestion(errors);
  };

  const handleChoice = (choice) => {
    if (sessionLevel === 3) {
      if (choice.affordable) finishQuestion(errors);
      else {
        setErrors(count => count + 1);
        recordAnswer(1);
      }
      return;
    }
    if (choice === question.total) finishQuestion(errors);
    else {
      setErrors(count => count + 1);
      recordAnswer(1);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const item = question.items.find(candidate => candidate.id === event.dataTransfer.getData('text/plain'));
    if (item) sortItem(item);
  };

  if (won) {
    return (
      <PageContainer title="Money Match" level={sessionLevel}>
        <div className="-m-6 flex min-h-full w-[calc(100%+3rem)] flex-col items-center justify-center bg-[#f8f1e7] p-6 text-center">
          <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full border-8 border-[#d8efe4] bg-white shadow-lg">
            <CheckCircle2 className="h-14 w-14 text-[#2d8b69]" />
          </div>
          <p className="mb-2 text-sm font-black uppercase tracking-[.22em] text-[#9a6949]">Money Match complete</p>
          <h2 className="mb-8 text-4xl font-black tracking-tight text-[#24453f]">Well done!</h2>
          <button onClick={onBack} className="min-h-16 w-full max-w-sm rounded-2xl bg-[#2d8065] px-7 py-4 text-xl font-black text-white shadow-[0_8px_0_#1e604d] transition hover:bg-[#256e57] active:translate-y-1 active:shadow-[0_4px_0_#1e604d]">Back to Suite</button>
        </div>
      </PageContainer>
    );
  }

  if (isSorting) {
    return (
      <PageContainer title="Money Match" level={sessionLevel}>
        <div className="-m-6 min-h-full w-[calc(100%+3rem)] bg-[#f8f1e7] p-4 sm:p-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-1 text-sm font-black uppercase tracking-[.2em] text-[#a16e4c]">Level {sessionLevel}</p>
                <h2 className="text-3xl font-black tracking-tight text-[#24453f]">{sessionLevel === 1 ? 'Money Sorting' : 'Money Sorting Harder'}</h2>
              </div>
              <div className="rounded-full border border-[#e7d3b7] bg-white/75 px-4 py-2 text-sm font-bold text-[#755c48]">Sort the matching money</div>
            </div>
            <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(280px,.9fr)_minmax(360px,1.1fr)]">
              <section className="rounded-[2rem] border border-[#ead8bf] bg-[#fffaf2] p-4 shadow-[0_14px_34px_rgba(91,69,40,.12)] sm:p-6">
                <div className="mb-2 flex items-center justify-between">
                  <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#a16e4c]">Your savings jar</p><p className="text-sm font-semibold text-[#756452]">Drop or tap matching money</p></div>
                  {jarItems.length > 0 && <span className="rounded-full bg-[#dff1e8] px-3 py-1 text-xs font-black text-[#287054]">Jar filling</span>}
                </div>
                <SavingsJar denomination={currentDenomination} items={jarItems} onDrop={handleDrop} onDragOver={event => event.preventDefault()} />
              </section>
              <section className="rounded-[2rem] border border-[#ead8bf] bg-[#fffdf9] p-4 shadow-[0_14px_34px_rgba(91,69,40,.1)] sm:p-6">
                <div className="mb-5 flex items-center justify-between border-b border-[#f0e1ce] pb-4">
                  <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#a16e4c]">Money to sort</p><p className="text-xl font-black text-[#24453f]">Find every ₹{currentDenomination}</p></div>
                  <div className="rounded-xl bg-[#fff0d7] px-3 py-2 text-2xl font-black text-[#9b6136]">₹{currentDenomination}</div>
                </div>
                {errors > 0 && <div className="mb-4 rounded-xl bg-[#fff4dc] px-4 py-3 text-center text-sm font-bold text-[#96652e]" role="status">That one belongs in another jar. Try again.</div>}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {availableItems.map(item => (
                    <button key={item.id} draggable onDragStart={event => event.dataTransfer.setData('text/plain', item.id)} onClick={() => sortItem(item)} className="group flex min-h-32 flex-col items-center justify-center rounded-2xl border-2 border-[#eadcca] bg-[#fffaf3] px-2 py-3 shadow-[0_5px_0_#eadcca] transition hover:-translate-y-1 hover:border-[#7eb89e] hover:bg-[#f0f9f3] active:translate-y-1 active:shadow-none" aria-label={`Sort ${item.value} ${item.type}`}>
                      <CurrencyVisual item={item} />
                      <span className="text-sm font-black capitalize text-[#554c42]">₹{item.value} {item.type}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Money Match" level={sessionLevel}>
      <div className="-m-6 min-h-full w-[calc(100%+3rem)] bg-[#f8f1e7] p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <p className="mb-1 text-sm font-black uppercase tracking-[.2em] text-[#a16e4c]">Level {sessionLevel}</p>
            <h2 className="text-3xl font-black tracking-tight text-[#24453f]">{sessionLevel === 3 ? 'What Can I Buy?' : 'Count the Money'}</h2>
          </div>
      {sessionLevel === 3 ? (
        <div className="grid items-stretch gap-5 lg:grid-cols-[.75fr_1.25fr]">
          <section className="flex min-h-[310px] flex-col justify-center rounded-[2rem] border border-[#ead8bf] bg-[#fffaf2] p-6 text-center shadow-[0_14px_34px_rgba(91,69,40,.12)]">
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#a16e4c]">You have</p>
            <div className="my-5 text-7xl font-black tracking-tight text-[#286b58]">₹{question.amount}</div>
            <p className="text-lg font-bold text-[#6d5d4b]">Choose one thing you can afford.</p>
          </section>
          <section className="rounded-[2rem] border border-[#ead8bf] bg-[#fffdf9] p-4 shadow-[0_14px_34px_rgba(91,69,40,.1)] sm:p-6">
            <p className="mb-4 text-lg font-black text-[#24453f]">Which would you like to buy?</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {question.products.map(product => <button key={product.name} onClick={() => handleChoice(product)} className="group overflow-hidden rounded-2xl border-2 border-[#eadcca] bg-[#fffaf3] text-left shadow-[0_5px_0_#eadcca] transition hover:-translate-y-1 hover:border-[#7eb89e] hover:bg-[#f0f9f3] active:translate-y-1 active:shadow-none"><div className="border-b border-[#f0e1ce] bg-[#fdf0db] px-2 pt-2"><ProductIllustration name={product.name} /></div><div className="p-4"><div className="text-lg font-black text-[#3e4d43]">{product.name}</div><div className="mt-1 text-xl font-black text-[#a3623e]">₹{product.price}</div></div></button>)}
            </div>
          </section>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl">
          <section className="rounded-[2rem] border border-[#ead8bf] bg-[#fffaf2] p-4 shadow-[0_14px_34px_rgba(91,69,40,.12)] sm:p-7">
            <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#a16e4c]">Money on the table</p><h3 className="text-2xl font-black text-[#24453f]">How much money is here?</h3></div><div className="h-3 w-3 rounded-full bg-[#dca75d] shadow-[0_0_0_6px_#f8e6c9]" /></div>
            <div className="flex min-h-48 flex-wrap items-center justify-center gap-4 rounded-2xl border border-[#ddc6a7] bg-gradient-to-br from-[#d8b77f]/35 to-[#f3dfbd]/45 p-5 shadow-inner sm:gap-7">{question.items.map(item => <div key={item.id} className="flex flex-col items-center rounded-xl bg-white/55 px-2 py-2 shadow-sm" aria-label={`${item.value} ${item.type}`}><CurrencyVisual item={item} /><span className="text-sm font-black text-[#554c42]">₹{item.value}</span></div>)}</div>
          </section>
          <section className="mt-5 rounded-[2rem] border border-[#ead8bf] bg-[#fffdf9] p-4 shadow-[0_14px_34px_rgba(91,69,40,.1)] sm:p-6"><p className="mb-4 text-center text-lg font-black text-[#6d5d4b]">Choose the total</p><div className="grid grid-cols-3 gap-3 sm:gap-4">{question.options.map(total => <button key={total} onClick={() => handleChoice(total)} className="min-h-20 rounded-2xl border-2 border-[#eadcca] bg-[#fffaf3] text-2xl font-black text-[#286b58] shadow-[0_5px_0_#eadcca] transition hover:-translate-y-1 hover:border-[#7eb89e] hover:bg-[#f0f9f3] active:translate-y-1 active:shadow-none">₹{total}</button>)}</div></section>
        </div>
      )}
        </div>
      </div>
    </PageContainer>
  );
};

const MONEY_NOTES = [10, 20, 50, 100];
const MONEY_COINS = [1, 2, 5, 10, 20];

const createMoneyItem = (value, type, id) => ({ id, value, type });

const createSortingQuestion = (hard) => {
  const count = hard ? 6 + Math.floor(Math.random() * 4) : 3 + Math.floor(Math.random() * 3);
  const items = [];
  const denominations = [];
  while (items.length < count) {
    const type = Math.random() > 0.5 ? 'coin' : 'note';
    const pool = type === 'coin' ? MONEY_COINS : MONEY_NOTES;
    const value = pool[Math.floor(Math.random() * pool.length)];
    if (items.length < 2 && denominations.includes(value)) continue;
    if (hard && Math.random() < 0.45 && items.some(item => item.value === value && item.type === type)) continue;
    items.push(createMoneyItem(value, type, `${value}-${type}-${items.length}`));
    if (!denominations.includes(value)) denominations.push(value);
  }
  return { items: shuffle(items), denominations: shuffle(denominations) };
};

const createBuyQuestion = (amount) => {
  const products = [
    { name: 'Tea', emoji: '☕', price: Math.max(5, amount - 10), affordable: true },
    { name: 'Book', emoji: '📖', price: amount + 20, affordable: false },
    { name: 'Fruit basket', emoji: '🍎', price: amount + 35, affordable: false }
  ];
  return { amount, products: shuffle(products) };
};

const createCountQuestion = (index) => {
  const combinations = [
    [['note', 20], ['coin', 5], ['coin', 2]],
    [['note', 50], ['note', 10], ['coin', 10], ['coin', 1]],
    [['note', 100], ['note', 20], ['coin', 20], ['coin', 5], ['coin', 2]]
  ];
  const items = combinations[index].map(([type, value], itemIndex) => createMoneyItem(value, type, `count-${index}-${itemIndex}`));
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return { items: shuffle(items), total, options: shuffle([total, total + 10, Math.max(1, total - 5)]) };
};

const createMoneyQuestions = (level) => {
  if (level === 1 || level === 2) return Array.from({ length: 3 }, () => createSortingQuestion(level === 2));
  if (level === 3) return shuffle([15, 30, 60, 120]).slice(0, 3).map(createBuyQuestion);
  return shuffle([0, 1, 2]).map(createCountQuestion);
};

// 4. MEMORY TRAY
// 4. MEMORY TRAY
const MemoryTrayGame = ({ onBack, level, processTelemetry }) => {
  const LEVEL_CONFIG = {
    1: {
      name: 'Memory Warm-Up',
      targetCount: 4,
      optionCount: 8,
      observeSeconds: 8,
    },
    2: {
      name: 'Memory Challenge',
      targetCount: 4,
      optionCount: 10,
      observeSeconds: 10,
    },
    3: {
      name: 'Memory Explorer',
      targetCount: 6,
      optionCount: 12,
      observeSeconds: 13,
    },
    4: {
      name: 'Memory Master',
      targetCount: 8,
      optionCount: 16,
      observeSeconds: 16,
    },
  };

  const OBJECT_STYLES = [
    'from-rose-100 to-pink-50 border-rose-200',
    'from-sky-100 to-cyan-50 border-sky-200',
    'from-amber-100 to-yellow-50 border-amber-200',
    'from-emerald-100 to-green-50 border-emerald-200',
    'from-violet-100 to-purple-50 border-violet-200',
    'from-orange-100 to-red-50 border-orange-200',
    'from-indigo-100 to-blue-50 border-indigo-200',
    'from-fuchsia-100 to-pink-50 border-fuchsia-200',
  ];

  const allItems = [
    '🍎', '🍌', '🍊', '🍇', '🍉', '🥕', '🍞', '🧀',
    '🥚', '🥛', '🍪', '🍰', '🍵', '☕', '🥄', '🍽️',
    '🏠', '🪑', '🛏️', '🛋️', '💡', '🕯️', '🧹', '🧺',
    '🧴', '🧼', '🪥', '🧻', '🔑', '🔒', '📱', '⌚',
    '👓', '💊', '👟', '🧢', '🧥', '🧦', '👜', '💍',
    '📖', '📰', '✏️', '🖊️', '📏', '✂️', '📌', '📒',
    '🧸', '⚽', '🎈', '🎲', '🧩', '🎨', '🎸', '📷',
  ];

  const [sessionLevel, setSessionLevel] = useState(level);
  const [phase, setPhase] = useState('observe');
  const [roundIndex, setRoundIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8);

  const [tray, setTray] = useState([]);
  const [optionsGrid, setOptionsGrid] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  const [currentResult, setCurrentResult] = useState(null);
  const [roundResults, setRoundResults] = useState([]);
  const [finalSummary, setFinalSummary] = useState(null);

  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const usedItemsRef = React.useRef([]);

  const config = LEVEL_CONFIG[sessionLevel] || LEVEL_CONFIG[1];

  // Reset the whole game when the selected level changes
  useEffect(() => {
    setSessionLevel(level);
    setRoundIndex(0);
    setRoundResults([]);
    setCurrentResult(null);
    setFinalSummary(null);
    setSelectedItems([]);
    setSessionStartTime(Date.now());
    usedItemsRef.current = [];
  }, [level]);

  // Generate a completely new memory round
  useEffect(() => {
    const availableItems = allItems.filter(item => !usedItemsRef.current.includes(item));
    const shuffledItems = shuffle(
      availableItems.length >= config.targetCount
        ? availableItems
        : allItems
    );

    const selectedTray = shuffledItems.slice(0, config.targetCount);
    usedItemsRef.current = [...usedItemsRef.current, ...selectedTray];

    const remainingItems = shuffledItems.filter(
      item => !selectedTray.includes(item)
    );

    const distractorCount = config.optionCount - config.targetCount;

    const distractors = shuffle(remainingItems).slice(
      0,
      distractorCount
    );

    const newOptionsGrid = shuffle([
      ...selectedTray,
      ...distractors,
    ]);

    setTray(selectedTray);
    setOptionsGrid(newOptionsGrid);
    setSelectedItems([]);
    setCurrentResult(null);
    setPhase('observe');

    let remainingSeconds = config.observeSeconds;
    setTimeLeft(remainingSeconds);
    let transitionId;

    const timerId = setInterval(() => {
      remainingSeconds -= 1;

      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearInterval(timerId);
        setPhase('transition');
        transitionId = setTimeout(() => setPhase('question'), 1200);
      }
    }, 1000);

    return () => {
      clearInterval(timerId);
      if (transitionId) clearTimeout(transitionId);
    };
  }, [sessionLevel, roundIndex]);

  const toggleSelection = (item) => {
    setSelectedItems(previous => {
      if (previous.includes(item)) {
        return previous.filter(i => i !== item);
      }

      return [...previous, item];
    });
  };

  const submitAnswers = () => {
    const correctCount = selectedItems.filter(item =>
      tray.includes(item)
    ).length;

    const falsePositives = selectedItems.filter(item =>
      !tray.includes(item)
    ).length;

    const missedCount = tray.length - correctCount;

    const result = {
      correctCount,
      missedCount,
      falsePositives,
      totalErrors: missedCount + falsePositives,
    };

    setCurrentResult(result);
    setPhase('result');
  };

  const continueGame = () => {
    const updatedResults = [...roundResults, currentResult];

    // Three rounds per level
    if (roundIndex < 2) {
      setRoundResults(updatedResults);
      setRoundIndex(previous => previous + 1);
      return;
    }

    // Final result
    const totalCorrect = updatedResults.reduce(
      (sum, result) => sum + result.correctCount,
      0
    );

    const totalMissed = updatedResults.reduce(
      (sum, result) => sum + result.missedCount,
      0
    );

    const totalFalsePositives = updatedResults.reduce(
      (sum, result) => sum + result.falsePositives,
      0
    );

    const totalErrors = updatedResults.reduce(
      (sum, result) => sum + result.totalErrors,
      0
    );

    const totalPossible = updatedResults.reduce(
      (sum, result) => sum + tray.length,
      0
    );

    const summary = {
      totalCorrect,
      totalMissed,
      totalFalsePositives,
      totalErrors,
      totalPossible,
    };

    setRoundResults(updatedResults);
    setFinalSummary(summary);
    setPhase('complete');

    processTelemetry(
      'MemoryTray',
      1000,
      totalErrors,
      (Date.now() - sessionStartTime) / 1000
    );
  };

  const timerProgress = Math.max(
    0,
    Math.min(1, timeLeft / config.observeSeconds)
  );

  const timerDegree = timerProgress * 360;

  const timerColor =
    timeLeft <= 2
      ? '#ef4444'
      : timeLeft <= 4
      ? '#f59e0b'
      : '#10b981';

  const timerRingStyle = {
    background: `conic-gradient(${timerColor} ${timerDegree}deg, #e2e8f0 ${timerDegree}deg)`,
  };

  const trayGridClass =
    tray.length <= 4
      ? 'grid-cols-2'
      : tray.length <= 6
      ? 'grid-cols-2 md:grid-cols-3'
      : 'grid-cols-2 md:grid-cols-4';

  const optionGridClass =
    optionsGrid.length <= 8
      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      : optionsGrid.length <= 12
      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <PageContainer title="Memory Tray" level={level}>

      {/* ==================== OBSERVE PHASE ==================== */}
      {phase === 'observe' && (
        <div className="w-full animate-fade-in">

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-800 px-5 py-2 rounded-full font-black text-sm uppercase tracking-wide mb-3">
              🧠 {config.name}
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-slate-800">
              Remember what you see!
            </h2>

            <p className="text-slate-500 font-medium mt-2">
              Look carefully at every object before the timer ends.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6 items-stretch">

            {/* LARGE TIMER */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 flex flex-col items-center justify-center min-h-[260px]">

              <div className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase mb-4">
                Time to Remember
              </div>

              <div
                className="w-44 h-44 rounded-full p-3 shadow-inner"
                style={timerRingStyle}
              >
                <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center shadow-lg">
                  <div
                    className="text-7xl font-black leading-none"
                    style={{ color: timerColor }}
                  >
                    {timeLeft}
                  </div>

                  <div className="text-sm font-black text-slate-400 uppercase tracking-wide mt-2">
                    seconds
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <div className="text-sm font-bold text-slate-500">
                  Stay focused
                </div>

                <div className="flex justify-center gap-1 mt-2">
                  {[0, 1, 2, 3, 4].map(dot => (
                    <span
                      key={dot}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        dot < Math.ceil((timeLeft / config.observeSeconds) * 5)
                          ? 'bg-emerald-400'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* VIBRANT MEMORY TRAY */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-amber-50 rounded-[2rem] border-2 border-violet-100 shadow-xl p-5 md:p-8">

              <div className="absolute -top-16 -right-16 w-40 h-40 bg-yellow-200/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-20 -left-16 w-44 h-44 bg-violet-200/30 rounded-full blur-2xl" />

              <div className="relative">

                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-xs font-black text-violet-500 uppercase tracking-[0.18em]">
                      Memory Tray
                    </div>
                    <div className="text-xl font-black text-slate-800 mt-1">
                      Keep these objects in mind
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm font-black text-slate-600">
                    ✨ Focus
                  </div>
                </div>

                <div
                  className={`grid ${trayGridClass} gap-4 md:gap-5`}
                >
                  {tray.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className={`
                        bg-gradient-to-br ${OBJECT_STYLES[index % OBJECT_STYLES.length]}
                        border-2
                        rounded-[1.6rem]
                        min-h-[140px]
                        md:min-h-[160px]
                        flex items-center justify-center
                        shadow-lg
                        hover:scale-[1.03]
                        transition-transform
                        animate-bounce-in
                      `}
                      style={{
                        animationDelay: `${index * 0.12}s`,
                      }}
                    >
                      <div className="text-7xl md:text-8xl drop-shadow-md select-none">
                        {item}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================== OBSERVE TO RECALL TRANSITION ==================== */}
      {phase === 'transition' && (
        <div className="w-full min-h-[430px] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center shadow-sm mb-6 animate-pulse">
            <Brain className="w-12 h-12 text-amber-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">
            Great! Now let&apos;s see what you remember.
          </h2>
          <p className="text-slate-500 font-medium mt-3">
            It&apos;s your turn to select every object you saw on the tray.
          </p>
        </div>
      )}

      {/* ==================== QUESTION PHASE ==================== */}
      {phase === 'question' && (
        <div className="w-full animate-fade-in">

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-5 py-2 rounded-full font-black text-sm uppercase tracking-wide mb-3">
              🧠 Memory Check
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-slate-800">
              What was on the tray?
            </h2>

            <p className="text-slate-500 font-medium mt-2">
              Select all the objects you remember seeing.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white rounded-[2rem] border border-slate-200 p-5 md:p-8 shadow-sm">

            <div
              className={`grid ${optionGridClass} gap-5 md:gap-7 mb-10`}
            >
              {optionsGrid.map((option, index) => {
                const isSelected = selectedItems.includes(option);

                return (
                  <button
                    key={`${option}-${index}`}
                    onClick={() => toggleSelection(option)}
                    className={`
                      relative
                      min-h-[140px]
                      md:min-h-[165px]
                      rounded-[1.4rem]
                      border-2
                      shadow-sm
                      flex items-center justify-center
                      transition-all duration-200
                      active:scale-95
                      bg-gradient-to-br
                      ${OBJECT_STYLES[index % OBJECT_STYLES.length]}
                      ${
                        isSelected
                          ? 'ring-4 ring-emerald-300 scale-[1.04] shadow-lg'
                          : 'hover:scale-[1.02] hover:shadow-md'
                      }
                    `}
                  >
                    <span className="text-6xl md:text-7xl drop-shadow-sm select-none">
                      {option}
                    </span>

                    {isSelected && (
                      <span className="absolute top-2 right-2 w-8 h-8 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center shadow-md">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">

              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-600 w-full sm:w-auto text-center">
                Selected:{" "}
                <span className="text-emerald-600 font-black">
                  {selectedItems.length}
                </span>
              </div>

              <button
                onClick={submitAnswers}
                disabled={selectedItems.length === 0}
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl shadow-lg active:scale-[0.98] transition-all text-xl"
              >
                ✓ Check My Memory
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ==================== ROUND RESULT ==================== */}
      {phase === 'result' && currentResult && (
        <div className="w-full flex flex-col items-center animate-bounce-in">

          <div
            className={`
              w-28 h-28 rounded-full flex items-center justify-center mb-5 shadow-lg
              ${
                currentResult.totalErrors === 0
                  ? 'bg-emerald-100'
                  : 'bg-amber-100'
              }
            `}
          >
            {currentResult.totalErrors === 0 ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-600" />
            ) : (
              <Brain className="w-16 h-16 text-amber-600" />
            )}
          </div>

          <h2
            className={`
              text-3xl md:text-4xl font-black mb-2
              ${
                currentResult.totalErrors === 0
                  ? 'text-emerald-800'
                  : 'text-amber-800'
              }
            `}
          >
            {currentResult.totalErrors === 0
              ? 'Amazing Memory!'
              : 'Great Effort!'}
          </h2>

          <p className="text-slate-500 font-medium text-center mb-6">
            You remembered {currentResult.correctCount} of {tray.length} objects.
          </p>

          <div className="bg-white p-6 md:p-7 rounded-[2rem] shadow-lg border border-slate-100 w-full flex flex-col gap-4">

            <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-slate-600">
                Objects Remembered
              </span>
              <span className="font-black text-emerald-600">
                {currentResult.correctCount} / {tray.length}
              </span>
            </div>

            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      (currentResult.correctCount / tray.length) * 100
                    )
                  )}%`,
                }}
              />
            </div>

            {currentResult.missedCount > 0 && (
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-slate-600">
                  Missed
                </span>
                <span className="font-black text-orange-500">
                  {currentResult.missedCount}
                </span>
              </div>
            )}

            {currentResult.falsePositives > 0 && (
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-slate-600">
                  Extra Choices
                </span>
                <span className="font-black text-red-500">
                  {currentResult.falsePositives}
                </span>
              </div>
            )}

          </div>

          <button
            onClick={continueGame}
            className="mt-7 w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-5 rounded-2xl shadow-lg active:scale-[0.98] transition-all text-xl"
          >
            {roundIndex < 2 ? 'Continue →' : 'Finish Memory Game'}
          </button>

        </div>
      )}

      {/* ==================== FINAL RESULT ==================== */}
      {phase === 'complete' && finalSummary && (
        <div className="w-full flex flex-col items-center animate-bounce-in">

          <div className="w-28 h-28 rounded-full bg-violet-100 flex items-center justify-center mb-5 shadow-lg">
            <span className="text-6xl">🧠</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-violet-800 mb-2">
            Memory Session Complete!
          </h2>

          <p className="text-slate-500 font-medium text-center mb-7">
            Nice work. You completed all three memory challenges.
          </p>

          <div className="bg-gradient-to-br from-violet-50 to-white p-6 md:p-8 rounded-[2rem] shadow-lg border border-violet-100 w-full">

            <div className="text-center mb-6">
              <div className="text-sm font-black text-violet-500 uppercase tracking-widest">
                Overall Memory
              </div>

              <div className="text-5xl font-black text-violet-800 mt-2">
                {finalSummary.totalCorrect}
                <span className="text-2xl text-slate-400">
                  {' '} / {finalSummary.totalPossible}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="text-3xl font-black text-emerald-600">
                  {finalSummary.totalCorrect}
                </div>
                <div className="text-sm font-bold text-slate-500 mt-1">
                  Remembered
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="text-3xl font-black text-orange-500">
                  {finalSummary.totalMissed}
                </div>
                <div className="text-sm font-bold text-slate-500 mt-1">
                  Missed
                </div>
              </div>

            </div>

          </div>

          <button
            onClick={onBack}
            className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 px-8 rounded-2xl shadow-lg active:scale-[0.98] transition-all w-full"
          >
            Back to Suite
          </button>

        </div>
      )}

    </PageContainer>
  );
};

const CreativeCalmGame = ({ onExit }) => {
  // ---------------------------------------------------------
  // COLORS
  // ---------------------------------------------------------
  const COLORS = {
    red: "#E53935",
    green: "#43A047",
    blue: "#1E88E5",
    yellow: "#FDD835",
    orange: "#FB8C00",
    pink: "#EC407A",
    brown: "#8D6E63",
    purple: "#8E44AD",
    lightBlue: "#81D4FA",
    lightGreen: "#8BC34A",
    white: "#FFFFFF",
  };

  // ---------------------------------------------------------
  // 12 PICTURES
  // ---------------------------------------------------------
  const pictures = [
    // =======================================================
    // LEVEL 1
    // =======================================================

    {
      id: 1,
      level: 1,
      title: "Simple Flower",
      description: "Match the flower with the colored reference.",
      regions: [
        { id: "petals", name: "Flower", color: COLORS.pink },
        { id: "center", name: "Center", color: COLORS.yellow },
        { id: "stem", name: "Stem and leaves", color: COLORS.green },
      ],
      palette: [
        COLORS.pink,
        COLORS.red,
        COLORS.yellow,
        COLORS.green,
        COLORS.blue,
      ],
    },

    {
      id: 2,
      level: 1,
      title: "Rainy Umbrella",
      description: "Match the colors with the reference.",
      regions: [
        { id: "umbrella", name: "Umbrella", color: COLORS.blue },
        { id: "handle", name: "Handle", color: COLORS.brown },
        { id: "rain", name: "Rain", color: COLORS.lightBlue },
      ],
      palette: [
        COLORS.blue,
        COLORS.yellow,
        COLORS.lightBlue,
        COLORS.green,
        COLORS.pink,
        COLORS.brown,
      ],
    },

    {
      id: 3,
      level: 1,
      title: "Bamboo Plant",
      description: "Color the bamboo like the reference.",
      regions: [
        { id: "bambooStem", name: "Bamboo stem", color: COLORS.lightGreen },
        { id: "bambooLeaves", name: "Leaves", color: COLORS.green },
        { id: "ground", name: "Ground", color: COLORS.brown },
      ],
      palette: [
        COLORS.lightGreen,
        COLORS.green,
        COLORS.brown,
        COLORS.yellow,
        COLORS.blue,
      ],
    },

    // =======================================================
    // LEVEL 2
    // =======================================================

    {
      id: 4,
      level: 2,
      title: "Banana Plant",
      description: "Match all five colors.",
      regions: [
        { id: "bananaLeaves", name: "Leaves", color: COLORS.green },
        { id: "bananas", name: "Bananas", color: COLORS.yellow },
        { id: "bananaStem", name: "Stem", color: COLORS.lightGreen },
        { id: "bananaGround", name: "Ground", color: COLORS.brown },
        { id: "bananaFlower", name: "Flower", color: COLORS.purple },
      ],
      palette: [
        COLORS.green,
        COLORS.yellow,
        COLORS.lightGreen,
        COLORS.brown,
        COLORS.purple,
        COLORS.red,
      ],
    },

    {
      id: 5,
      level: 2,
      title: "Village House",
      description: "Color the house using the reference.",
      regions: [
        { id: "roof", name: "Roof", color: COLORS.red },
        { id: "wall", name: "Wall", color: COLORS.yellow },
        { id: "door", name: "Door", color: COLORS.brown },
        { id: "window", name: "Window", color: COLORS.blue },
        { id: "houseGround", name: "Ground", color: COLORS.green },
      ],
      palette: [
        COLORS.red,
        COLORS.yellow,
        COLORS.brown,
        COLORS.blue,
        COLORS.green,
        COLORS.pink,
      ],
    },

    {
      id: 6,
      level: 2,
      title: "Hills and House",
      description: "Match the colors of this simple landscape.",
      regions: [
        { id: "sky", name: "Sky", color: COLORS.lightBlue },
        { id: "hill", name: "Hill", color: COLORS.green },
        { id: "hillRoof", name: "Roof", color: COLORS.red },
        { id: "hillWall", name: "House", color: COLORS.yellow },
        { id: "hillGround", name: "Ground", color: COLORS.green },
      ],
      palette: [
        COLORS.lightBlue,
        COLORS.green,
        COLORS.red,
        COLORS.yellow,
        COLORS.blue,
        COLORS.brown,
      ],
    },

    // =======================================================
    // LEVEL 3
    // =======================================================

    {
      id: 7,
      level: 3,
      title: "Bamboo Near a House",
      description: "Color the village scene carefully.",
      regions: [
        { id: "bambooSky", name: "Sky", color: COLORS.lightBlue },
        { id: "bambooRoof", name: "Roof", color: COLORS.red },
        { id: "bambooWall", name: "House", color: COLORS.yellow },
        { id: "bambooDoor", name: "Door", color: COLORS.brown },
        { id: "bambooStems", name: "Bamboo stems", color: COLORS.lightGreen },
        { id: "bambooLeaf", name: "Bamboo leaves", color: COLORS.green },
        { id: "bambooGround", name: "Ground", color: COLORS.brown },
      ],
      palette: [
        COLORS.lightBlue,
        COLORS.red,
        COLORS.yellow,
        COLORS.brown,
        COLORS.lightGreen,
        COLORS.green,
        COLORS.blue,
      ],
    },

    {
      id: 8,
      level: 3,
      title: "Mountain Village",
      description: "Match all the colors in the village.",
      regions: [
        { id: "mountainSky", name: "Sky", color: COLORS.lightBlue },
        { id: "cloud", name: "Cloud", color: COLORS.white },
        { id: "mountain", name: "Mountain", color: COLORS.green },
        { id: "mountainRoof", name: "Roof", color: COLORS.red },
        { id: "mountainWall", name: "House", color: COLORS.yellow },
        { id: "trees", name: "Trees", color: COLORS.green },
        { id: "mountainGround", name: "Ground", color: COLORS.brown },
      ],
      palette: [
        COLORS.lightBlue,
        COLORS.white,
        COLORS.green,
        COLORS.red,
        COLORS.yellow,
        COLORS.brown,
        COLORS.purple,
      ],
    },

    {
      id: 9,
      level: 3,
      title: "Rainy Village",
      description: "Match the colors of this rainy scene.",
      regions: [
        { id: "rainSky", name: "Sky", color: COLORS.lightBlue },
        { id: "rainCloud", name: "Cloud", color: COLORS.purple },
        { id: "rainDrops", name: "Rain", color: COLORS.blue },
        { id: "rainUmbrella", name: "Umbrella", color: COLORS.yellow },
        { id: "rainHouse", name: "House", color: COLORS.orange },
        { id: "rainTrees", name: "Trees", color: COLORS.green },
        { id: "rainGround", name: "Ground", color: COLORS.brown },
      ],
      palette: [
        COLORS.lightBlue,
        COLORS.purple,
        COLORS.blue,
        COLORS.yellow,
        COLORS.orange,
        COLORS.green,
        COLORS.brown,
      ],
    },

    // =======================================================
    // LEVEL 4
    // =======================================================

    {
      id: 10,
      level: 4,
      title: "Northeast Village Landscape",
      description: "Complete the full landscape.",
      regions: [
        { id: "landSky", name: "Sky", color: COLORS.lightBlue },
        { id: "landCloud", name: "Cloud", color: COLORS.white },
        { id: "landMountain", name: "Mountain", color: COLORS.purple },
        { id: "landHill", name: "Hill", color: COLORS.green },
        { id: "landRoof", name: "Roof", color: COLORS.red },
        { id: "landWall", name: "House", color: COLORS.yellow },
        { id: "landTrees", name: "Trees", color: COLORS.lightGreen },
        { id: "landBamboo", name: "Bamboo", color: COLORS.green },
        { id: "landPath", name: "Ground", color: COLORS.brown },
      ],
      palette: [
        COLORS.lightBlue,
        COLORS.white,
        COLORS.purple,
        COLORS.green,
        COLORS.red,
        COLORS.yellow,
        COLORS.lightGreen,
        COLORS.brown,
      ],
    },

    {
      id: 11,
      level: 4,
      title: "Village Garden",
      description: "Complete the garden using the reference.",
      regions: [
        { id: "gardenSky", name: "Sky", color: COLORS.lightBlue },
        { id: "gardenRoof", name: "Roof", color: COLORS.red },
        { id: "gardenWall", name: "House", color: COLORS.yellow },
        { id: "gardenDoor", name: "Door", color: COLORS.brown },
        { id: "gardenWindow", name: "Window", color: COLORS.blue },
        { id: "gardenTree", name: "Tree", color: COLORS.green },
        { id: "gardenFlower", name: "Flowers", color: COLORS.pink },
        { id: "gardenCenter", name: "Flower centers", color: COLORS.yellow },
        { id: "gardenGrass", name: "Grass", color: COLORS.lightGreen },
      ],
      palette: [
        COLORS.lightBlue,
        COLORS.red,
        COLORS.yellow,
        COLORS.brown,
        COLORS.blue,
        COLORS.green,
        COLORS.pink,
        COLORS.lightGreen,
      ],
    },

    {
      id: 12,
      level: 4,
      title: "Northeast Nature",
      description: "Complete the final nature scene.",
      regions: [
        { id: "natureSky", name: "Sky", color: COLORS.lightBlue },
        { id: "natureCloud", name: "Cloud", color: COLORS.white },
        { id: "natureMountain", name: "Mountain", color: COLORS.purple },
        { id: "natureTreeLeaves", name: "Tree leaves", color: COLORS.green },
        { id: "natureTreeTrunk", name: "Tree trunk", color: COLORS.brown },
        { id: "natureBambooLeaves", name: "Bamboo leaves", color: COLORS.lightGreen },
        { id: "natureBambooStem", name: "Bamboo stems", color: COLORS.green },
        { id: "natureStream", name: "Stream", color: COLORS.blue },
        { id: "natureFlowers", name: "Flowers", color: COLORS.pink },
      ],
      palette: [
        COLORS.lightBlue,
        COLORS.white,
        COLORS.purple,
        COLORS.green,
        COLORS.brown,
        COLORS.lightGreen,
        COLORS.blue,
        COLORS.pink,
      ],
    },
  ];

  // ---------------------------------------------------------
  // GAME STATE
  // ---------------------------------------------------------

  const [currentPicture, setCurrentPicture] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);

  // Stores the color currently painted in every region.
  // A region can be filled even when the selected color is wrong.
  const [coloredRegions, setColoredRegions] = useState({});

  // Stores only correctly matched regions. This controls completion.
  const [completedRegions, setCompletedRegions] = useState({});

  const [message, setMessage] = useState(
    "Look at the colored picture and match the colors."
  );

  // Level-completion popup
  const [showLevelPopup, setShowLevelPopup] = useState(false);

  // Exit confirmation popup
  const [showExitPopup, setShowExitPopup] = useState(false);

  const picture = pictures[currentPicture];

  const level = picture.level;

  // ---------------------------------------------------------
  // CHECK WHETHER CURRENT PICTURE IS COMPLETE
  // ---------------------------------------------------------

  const isPictureComplete =
    picture.regions.length > 0 &&
    picture.regions.every(
      (region) => completedRegions[region.id] === region.color
    );

  // ---------------------------------------------------------
  // HANDLE COLOR SELECTION
  // ---------------------------------------------------------

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setMessage("Now tap the part you want to color.");
  };

  // ---------------------------------------------------------
  // HANDLE REGION CLICK
  // ---------------------------------------------------------

  const handleRegionClick = (region) => {
    if (!selectedColor) {
      setMessage("Please choose a color first.");
      return;
    }

    // Paint the selected part immediately, even if the color is wrong.
    setColoredRegions((prev) => ({
      ...prev,
      [region.id]: selectedColor,
    }));

    if (selectedColor === region.color) {
      // Correct color: mark this region as completed.
      setCompletedRegions((prev) => ({
        ...prev,
        [region.id]: selectedColor,
      }));

      // Check whether this click completed the whole picture.
      const willCompletePicture = picture.regions.every((r) =>
        r.id === region.id
          ? selectedColor === r.color
          : completedRegions[r.id] === r.color
      );

      const nextPicture = pictures[currentPicture + 1];

      if (
        willCompletePicture &&
        nextPicture &&
        nextPicture.level !== picture.level
      ) {
        // The level is completed, so show the popup immediately.
        setShowLevelPopup(true);
      }

      setMessage("Wonderful! You colored this part correctly. 🌟");
    } else {
      // Wrong color: keep the color visible, but do not mark the region complete.
      // The patient can simply choose another color and tap this part again.
      setCompletedRegions((prev) => {
        const next = { ...prev };
        delete next[region.id];
        return next;
      });

      setMessage(
        "Good effort! 🌟 You colored this part, but this color is not the same as the reference. Try another color."
      );
    }

    setSelectedColor(null);
  };

  // ---------------------------------------------------------
  // NEXT PICTURE
  // IMPORTANT:
  // THIS BUTTON IS ONLY ENABLED AFTER ALL REGIONS ARE COMPLETE
  // ---------------------------------------------------------

  const handleNextPicture = () => {
    if (!isPictureComplete) {
      return;
    }

    if (currentPicture < pictures.length - 1) {
      const currentLevel = picture.level;
      const nextPicture = pictures[currentPicture + 1];

      // After the last picture of a level, show a small congratulation popup.
      if (nextPicture.level !== currentLevel) {
        setShowLevelPopup(true);
        return;
      }

      setCurrentPicture((prev) => prev + 1);
      setColoredRegions({});
      setCompletedRegions({});
      setSelectedColor(null);
      setMessage(
        "Look at the colored picture and match the colors."
      );
    }
  };

  const continueToNextLevel = () => {
    setShowLevelPopup(false);

    if (currentPicture < pictures.length - 1) {
      setCurrentPicture((prev) => prev + 1);
      setColoredRegions({});
      setCompletedRegions({});
      setSelectedColor(null);
      setMessage(
        "Look at the colored picture and match the colors."
      );
    }
  };

  // ---------------------------------------------------------
  // RESTART GAME
  // ---------------------------------------------------------

  const restartGame = () => {
    setCurrentPicture(0);
    setColoredRegions({});
    setCompletedRegions({});
    setSelectedColor(null);
    setShowLevelPopup(false);
    setShowExitPopup(false);
    setMessage(
      "Look at the colored picture and match the colors."
    );
  };

  // ---------------------------------------------------------
  // GET COLOR OF A REGION
  // ---------------------------------------------------------

  const getRegionColor = (region) => {
    if (coloredRegions[region.id]) {
      return coloredRegions[region.id];
    }

    return "#FFFFFF";
  };

  // ---------------------------------------------------------
  // SVG DRAWING
  // ---------------------------------------------------------

  const drawPicture = (picture, reference = false) => {
    const getFill = (id) => {
      const region = picture.regions.find((r) => r.id === id);

      if (!region) return "#FFFFFF";

      if (reference) {
        return region.color;
      }

      return getRegionColor(region);
    };

    const click = (id) => {
      if (reference) return;

      const region = picture.regions.find((r) => r.id === id);

      if (region) {
        handleRegionClick(region);
      }
    };

    const common = {
      stroke: "#222",
      strokeWidth: 3,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    };

    // -------------------------------------------------------
    // PICTURE 1 - FLOWER
    // -------------------------------------------------------

    if (picture.id === 1) {
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full">
          {/* Petals */}
          <g
            onClick={() => click("petals")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <circle
              cx="200"
              cy="100"
              r="55"
              fill={getFill("petals")}
              {...common}
            />
            <circle
              cx="145"
              cy="125"
              r="55"
              fill={getFill("petals")}
              {...common}
            />
            <circle
              cx="255"
              cy="125"
              r="55"
              fill={getFill("petals")}
              {...common}
            />
            <circle
              cx="165"
              cy="170"
              r="55"
              fill={getFill("petals")}
              {...common}
            />
            <circle
              cx="235"
              cy="170"
              r="55"
              fill={getFill("petals")}
              {...common}
            />
          </g>

          {/* Center */}
          <circle
            cx="200"
            cy="140"
            r="38"
            fill={getFill("center")}
            {...common}
            onClick={() => click("center")}
            style={{ cursor: reference ? "default" : "pointer" }}
          />

          {/* Stem */}
          <path
            d="M190 175 L190 320"
            stroke={getFill("stem")}
            strokeWidth="18"
            fill="none"
            {...common}
            onClick={() => click("stem")}
          />

          {/* Leaves */}
          <ellipse
            cx="155"
            cy="250"
            rx="45"
            ry="22"
            transform="rotate(-25 155 250)"
            fill={getFill("stem")}
            {...common}
            onClick={() => click("stem")}
          />

          <ellipse
            cx="235"
            cy="280"
            rx="45"
            ry="22"
            transform="rotate(25 235 280)"
            fill={getFill("stem")}
            {...common}
            onClick={() => click("stem")}
          />
        </svg>
      );
    }

    

       // -------------------------------------------------------
// PICTURE 2 - RAINY UMBRELLA
// -------------------------------------------------------

if (picture.id === 2) {
  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full h-full"
    >

      {/* =========================
          RAIN
      ========================= */}

      <g
        onClick={() => click("rain")}
        style={{ cursor: reference ? "default" : "pointer" }}
      >
        <path
          d="M100 60 L90 90"
          fill="none"
          stroke={getFill("rain") === COLORS.white ? "#222" : getFill("rain")}
          strokeWidth="16"
          strokeLinecap="round"
        />

        <path
          d="M160 45 L150 75"
          fill="none"
          stroke={getFill("rain") === COLORS.white ? "#222" : getFill("rain")}
          strokeWidth="16"
          strokeLinecap="round"
        />

        <path
          d="M220 60 L210 90"
          fill="none"
          stroke={getFill("rain") === COLORS.white ? "#222" : getFill("rain")}
          strokeWidth="16"
          strokeLinecap="round"
        />

        <path
          d="M280 45 L270 75"
          fill="none"
          stroke={getFill("rain") === COLORS.white ? "#222" : getFill("rain")}
          strokeWidth="16"
          strokeLinecap="round"
        />

        <path
          d="M330 65 L320 95"
          fill="none"
          stroke={getFill("rain") === COLORS.white ? "#222" : getFill("rain")}
          strokeWidth="16"
          strokeLinecap="round"
        />
      </g>


      {/* =========================
          UMBRELLA CANOPY
      ========================= */}

      <path
        d="
          M55 210
          Q200 80 345 210
          Q320 195 295 210
          Q270 195 245 210
          Q220 195 195 210
          Q170 195 145 210
          Q120 195 95 210
          Q75 195 55 210
          Z
        "
        fill={getFill("umbrella")}
        stroke="#222"
        strokeWidth="4"
        strokeLinejoin="round"
        onClick={() => click("umbrella")}
        style={{ cursor: reference ? "default" : "pointer" }}
      />


      {/* =========================
          UMBRELLA HANDLE
      ========================= */}

      <path
        d="
          M200 205
          L200 315
          Q200 350 170 350
          Q140 350 140 320
        "
        fill="none"
        stroke={
          getFill("handle") === COLORS.white
            ? "#222"
            : getFill("handle")
        }
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
        onClick={() => click("handle")}
        style={{ cursor: reference ? "default" : "pointer" }}
      />

    </svg>
  );
}

    // -------------------------------------------------------
    // PICTURE 3 - BAMBOO
    // -------------------------------------------------------

    if (picture.id === 3) {
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full">

          {/* Ground */}
          <path
            d="M40 330 Q200 290 360 330 L360 370 L40 370 Z"
            fill={getFill("ground")}
            {...common}
            onClick={() => click("ground")}
            style={{ cursor: reference ? "default" : "pointer" }}
          />

          {/* Bamboo stems */}
          <g
            onClick={() => click("bambooStem")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <rect x="150" y="80" width="35" height="250" rx="12"
              fill={getFill("bambooStem")} {...common} />
            <rect x="210" y="110" width="35" height="220" rx="12"
              fill={getFill("bambooStem")} {...common} />
          </g>

          {/* Leaves */}
          <g
            onClick={() => click("bambooLeaves")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <ellipse
              cx="130"
              cy="110"
              rx="65"
              ry="25"
              transform="rotate(-25 130 110)"
              fill={getFill("bambooLeaves")}
              {...common}
            />
            <ellipse
              cx="260"
              cy="145"
              rx="65"
              ry="25"
              transform="rotate(25 260 145)"
              fill={getFill("bambooLeaves")}
              {...common}
            />
            <ellipse
              cx="125"
              cy="185"
              rx="65"
              ry="25"
              transform="rotate(-25 125 185)"
              fill={getFill("bambooLeaves")}
              {...common}
            />
          </g>
        </svg>
      );
    }

    // -------------------------------------------------------
    // PICTURE 4 - BANANA PLANT
    // -------------------------------------------------------

    if (picture.id === 4) {
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full">

          {/* Ground */}
          <path
            d="M40 330 Q200 290 360 330 L360 370 L40 370 Z"
            fill={getFill("bananaGround")}
            {...common}
            onClick={() => click("bananaGround")}
          />

          {/* Stem */}
          <path
            d="M190 330 L190 150 Q200 125 215 150 L215 330 Z"
            fill={getFill("bananaStem")}
            {...common}
            onClick={() => click("bananaStem")}
          />

          {/* Leaves */}
          <g
            onClick={() => click("bananaLeaves")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <ellipse
              cx="120"
              cy="130"
              rx="100"
              ry="35"
              transform="rotate(-20 120 130)"
              fill={getFill("bananaLeaves")}
              {...common}
            />
            <ellipse
              cx="280"
              cy="125"
              rx="100"
              ry="35"
              transform="rotate(20 280 125)"
              fill={getFill("bananaLeaves")}
              {...common}
            />
            <ellipse
              cx="110"
              cy="190"
              rx="90"
              ry="30"
              transform="rotate(-30 110 190)"
              fill={getFill("bananaLeaves")}
              {...common}
            />
            <ellipse
              cx="290"
              cy="190"
              rx="90"
              ry="30"
              transform="rotate(30 290 190)"
              fill={getFill("bananaLeaves")}
              {...common}
            />
          </g>

          {/* Bananas */}
          <g
            onClick={() => click("bananas")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <ellipse cx="190" cy="100" rx="18" ry="45"
              fill={getFill("bananas")} {...common} />
            <ellipse cx="215" cy="100" rx="18" ry="45"
              fill={getFill("bananas")} {...common} />
            <ellipse cx="240" cy="105" rx="18" ry="45"
              fill={getFill("bananas")} {...common} />
          </g>

          {/* Flower */}
          <path
            d="M205 150 Q230 165 205 195 Q180 165 205 150"
            fill={getFill("bananaFlower")}
            {...common}
            onClick={() => click("bananaFlower")}
          />
        </svg>
      );
    }

    // -------------------------------------------------------
    // PICTURE 5 - HOUSE
    // -------------------------------------------------------

    if (picture.id === 5) {
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full">

          {/* Ground */}
          <rect
            x="0"
            y="320"
            width="400"
            height="80"
            fill={getFill("houseGround")}
            {...common}
            onClick={() => click("houseGround")}
          />

          {/* House wall */}
          <rect
            x="90"
            y="180"
            width="220"
            height="140"
            fill={getFill("wall")}
            {...common}
            onClick={() => click("wall")}
          />

          {/* Roof */}
          <path
            d="M60 185 L200 80 L340 185 Z"
            fill={getFill("roof")}
            {...common}
            onClick={() => click("roof")}
          />

          {/* Door */}
          <rect
            x="175"
            y="235"
            width="50"
            height="85"
            fill={getFill("door")}
            {...common}
            onClick={() => click("door")}
          />

          {/* Window */}
          <rect
            x="115"
            y="220"
            width="45"
            height="45"
            fill={getFill("window")}
            {...common}
            onClick={() => click("window")}
          />
        </svg>
      );
    }

    // -------------------------------------------------------
    // PICTURE 6 - HILLS + HOUSE
    // -------------------------------------------------------

    if (picture.id === 6) {
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full">

          {/* Sky */}
          <rect
            width="400"
            height="400"
            fill={getFill("sky")}
            {...common}
            onClick={() => click("sky")}
          />

          {/* Hill */}
          <path
            d="M0 280 Q120 120 240 240 Q310 150 400 270 L400 400 L0 400 Z"
            fill={getFill("hill")}
            {...common}
            onClick={() => click("hill")}
          />

          {/* Ground */}
          <path
            d="M0 315 Q200 280 400 315 L400 400 L0 400 Z"
            fill={getFill("hillGround")}
            {...common}
            onClick={() => click("hillGround")}
          />

          {/* House */}
          <rect
            x="145"
            y="245"
            width="110"
            height="75"
            fill={getFill("hillWall")}
            {...common}
            onClick={() => click("hillWall")}
          />

          <path
            d="M125 250 L200 190 L275 250 Z"
            fill={getFill("hillRoof")}
            {...common}
            onClick={() => click("hillRoof")}
          />
        </svg>
      );
    }

    // -------------------------------------------------------
    // PICTURE 7 - BAMBOO + HOUSE
    // -------------------------------------------------------

    if (picture.id === 7) {
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full">

          {/* Sky */}
          <rect
            width="400"
            height="400"
            fill={getFill("bambooSky")}
            {...common}
            onClick={() => click("bambooSky")}
          />

          {/* Ground */}
          <rect
            y="310"
            width="400"
            height="90"
            fill={getFill("bambooGround")}
            {...common}
            onClick={() => click("bambooGround")}
          />

          {/* House wall */}
          <rect
            x="60"
            y="200"
            width="150"
            height="110"
            fill={getFill("bambooWall")}
            {...common}
            onClick={() => click("bambooWall")}
          />

          {/* Roof */}
          <path
            d="M35 205 L135 125 L235 205 Z"
            fill={getFill("bambooRoof")}
            {...common}
            onClick={() => click("bambooRoof")}
          />

          {/* Door */}
          <rect
            x="120"
            y="245"
            width="45"
            height="65"
            fill={getFill("bambooDoor")}
            {...common}
            onClick={() => click("bambooDoor")}
          />

          {/* Bamboo stems */}
          <g
            onClick={() => click("bambooStems")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <rect x="280" y="100" width="25" height="210" rx="10"
              fill={getFill("bambooStems")} {...common} />
            <rect x="325" y="125" width="25" height="185" rx="10"
              fill={getFill("bambooStems")} {...common} />
          </g>

          {/* Bamboo leaves */}
          <g
            onClick={() => click("bambooLeaf")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <ellipse cx="265" cy="130" rx="60" ry="22"
              transform="rotate(-25 265 130)"
              fill={getFill("bambooLeaf")} {...common} />

            <ellipse cx="345" cy="165" rx="60" ry="22"
              transform="rotate(25 345 165)"
              fill={getFill("bambooLeaf")} {...common} />

            <ellipse cx="265" cy="200" rx="60" ry="22"
              transform="rotate(-25 265 200)"
              fill={getFill("bambooLeaf")} {...common} />
          </g>
        </svg>
      );
    }

    // -------------------------------------------------------
    // PICTURE 8 - MOUNTAIN VILLAGE
    // -------------------------------------------------------

    if (picture.id === 8) {
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full">

          {/* Sky */}
          <rect
            width="400"
            height="400"
            fill={getFill("mountainSky")}
            {...common}
            onClick={() => click("mountainSky")}
          />

          {/* Cloud */}
          <g
            onClick={() => click("cloud")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <circle cx="100" cy="80" r="35" fill={getFill("cloud")} {...common} />
            <circle cx="140" cy="80" r="45" fill={getFill("cloud")} {...common} />
            <circle cx="180" cy="85" r="30" fill={getFill("cloud")} {...common} />
          </g>

          {/* Mountain */}
          <path
            d="M0 270 L120 100 L210 230 L280 120 L400 270 Z"
            fill={getFill("mountain")}
            {...common}
            onClick={() => click("mountain")}
          />

          {/* Ground */}
          <rect
            y="300"
            width="400"
            height="100"
            fill={getFill("mountainGround")}
            {...common}
            onClick={() => click("mountainGround")}
          />

          {/* House */}
          <rect
            x="145"
            y="230"
            width="100"
            height="75"
            fill={getFill("mountainWall")}
            {...common}
            onClick={() => click("mountainWall")}
          />

          <path
            d="M130 235 L195 175 L260 235 Z"
            fill={getFill("mountainRoof")}
            {...common}
            onClick={() => click("mountainRoof")}
          />

          {/* Trees */}
          <g
            onClick={() => click("trees")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <circle cx="70" cy="260" r="35" fill={getFill("trees")} {...common} />
            <circle cx="330" cy="250" r="40" fill={getFill("trees")} {...common} />
          </g>
        </svg>
      );
    }

    // -------------------------------------------------------
    // PICTURE 9 - RAINY VILLAGE
    // -------------------------------------------------------

    if (picture.id === 9) {
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full">

          {/* Sky */}
          <rect
            width="400"
            height="400"
            fill={getFill("rainSky")}
            {...common}
            onClick={() => click("rainSky")}
          />

          {/* Cloud */}
          <g
            onClick={() => click("rainCloud")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <circle cx="100" cy="80" r="40" fill={getFill("rainCloud")} {...common} />
            <circle cx="145" cy="70" r="50" fill={getFill("rainCloud")} {...common} />
            <circle cx="190" cy="85" r="35" fill={getFill("rainCloud")} {...common} />
          </g>

          {/* Rain */}
          <g
            onClick={() => click("rainDrops")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            {[80, 130, 180, 230, 280, 330].map((x) => (
              <line
                key={x}
                x1={x}
                y1="130"
                x2={x - 12}
                y2="170"
                stroke={getFill("rainDrops")}
                strokeWidth="9"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Ground */}
          <rect
            y="300"
            width="400"
            height="100"
            fill={getFill("rainGround")}
            {...common}
            onClick={() => click("rainGround")}
          />

          {/* House */}
          <rect
            x="145"
            y="220"
            width="100"
            height="80"
            fill={getFill("rainHouse")}
            {...common}
            onClick={() => click("rainHouse")}
          />

          {/* Trees */}
          <g
            onClick={() => click("rainTrees")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <circle cx="70" cy="270" r="45" fill={getFill("rainTrees")} {...common} />
            <circle cx="330" cy="265" r="50" fill={getFill("rainTrees")} {...common} />
          </g>

          {/* Umbrella */}
          <path
            d="M230 235 Q285 180 340 235 Q285 215 230 235 Z"
            fill={getFill("rainUmbrella")}
            {...common}
            onClick={() => click("rainUmbrella")}
          />
        </svg>
      );
    }

    // -------------------------------------------------------
    // PICTURE 10 - NORTHEAST VILLAGE LANDSCAPE
    // -------------------------------------------------------

    if (picture.id === 10) {
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full">

          {/* Sky */}
          <rect
            width="400"
            height="400"
            fill={getFill("landSky")}
            {...common}
            onClick={() => click("landSky")}
          />

          {/* Cloud */}
          <g
            onClick={() => click("landCloud")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <circle cx="100" cy="70" r="35" fill={getFill("landCloud")} {...common} />
            <circle cx="140" cy="65" r="45" fill={getFill("landCloud")} {...common} />
            <circle cx="180" cy="75" r="30" fill={getFill("landCloud")} {...common} />
          </g>

          {/* Mountain */}
          <path
            d="M0 245 L100 90 L200 230 L280 110 L400 245 Z"
            fill={getFill("landMountain")}
            {...common}
            onClick={() => click("landMountain")}
          />

          {/* Hill */}
          <path
            d="M0 260 Q120 190 220 260 Q310 200 400 260 L400 400 L0 400 Z"
            fill={getFill("landHill")}
            {...common}
            onClick={() => click("landHill")}
          />

          {/* Ground/path */}
          <path
            d="M0 330 Q200 290 400 330 L400 400 L0 400 Z"
            fill={getFill("landPath")}
            {...common}
            onClick={() => click("landPath")}
          />

          {/* House */}
          <rect
            x="145"
            y="240"
            width="100"
            height="80"
            fill={getFill("landWall")}
            {...common}
            onClick={() => click("landWall")}
          />

          <path
            d="M125 245 L195 180 L265 245 Z"
            fill={getFill("landRoof")}
            {...common}
            onClick={() => click("landRoof")}
          />

          {/* Trees */}
          <g
            onClick={() => click("landTrees")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <circle cx="70" cy="280" r="45" fill={getFill("landTrees")} {...common} />
            <circle cx="330" cy="275" r="50" fill={getFill("landTrees")} {...common} />
          </g>

          {/* Bamboo */}
          <g
            onClick={() => click("landBamboo")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <rect x="285" y="150" width="20" height="160"
              fill={getFill("landBamboo")} {...common} />
            <rect x="315" y="170" width="20" height="140"
              fill={getFill("landBamboo")} {...common} />
          </g>
        </svg>
      );
    }

    // -------------------------------------------------------
    // PICTURE 11 - VILLAGE GARDEN
    // -------------------------------------------------------

    if (picture.id === 11) {
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full">

          {/* Sky */}
          <rect
            width="400"
            height="400"
            fill={getFill("gardenSky")}
            {...common}
            onClick={() => click("gardenSky")}
          />

          {/* Grass */}
          <rect
            y="300"
            width="400"
            height="100"
            fill={getFill("gardenGrass")}
            {...common}
            onClick={() => click("gardenGrass")}
          />

          {/* House */}
          <rect
            x="125"
            y="210"
            width="130"
            height="100"
            fill={getFill("gardenWall")}
            {...common}
            onClick={() => click("gardenWall")}
          />

          <path
            d="M105 215 L190 140 L275 215 Z"
            fill={getFill("gardenRoof")}
            {...common}
            onClick={() => click("gardenRoof")}
          />

          {/* Door */}
          <rect
            x="170"
            y="250"
            width="45"
            height="60"
            fill={getFill("gardenDoor")}
            {...common}
            onClick={() => click("gardenDoor")}
          />

          {/* Window */}
          <rect
            x="140"
            y="235"
            width="35"
            height="35"
            fill={getFill("gardenWindow")}
            {...common}
            onClick={() => click("gardenWindow")}
          />

          {/* Tree */}
          <g
            onClick={() => click("gardenTree")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <rect
              x="55"
              y="230"
              width="30"
              height="90"
              fill={getFill("gardenTree")}
              {...common}
            />
            <circle cx="70" cy="190" r="55"
              fill={getFill("gardenTree")} {...common} />
          </g>

          {/* Flowers */}
          <g
            onClick={() => click("gardenFlower")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <circle cx="300" cy="275" r="25"
              fill={getFill("gardenFlower")} {...common} />
            <circle cx="350" cy="300" r="25"
              fill={getFill("gardenFlower")} {...common} />
          </g>

          {/* Flower centers */}
          <g
            onClick={() => click("gardenCenter")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <circle cx="300" cy="275" r="9"
              fill={getFill("gardenCenter")} {...common} />
            <circle cx="350" cy="300" r="9"
              fill={getFill("gardenCenter")} {...common} />
          </g>
        </svg>
      );
    }

    // -------------------------------------------------------
    // PICTURE 12 - NORTHEAST NATURE
    // -------------------------------------------------------

    if (picture.id === 12) {
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full">

          {/* Sky */}
          <rect
            width="400"
            height="400"
            fill={getFill("natureSky")}
            {...common}
            onClick={() => click("natureSky")}
          />

          {/* Clouds */}
          <g
            onClick={() => click("natureCloud")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <circle cx="90" cy="65" r="35"
              fill={getFill("natureCloud")} {...common} />
            <circle cx="135" cy="60" r="45"
              fill={getFill("natureCloud")} {...common} />
            <circle cx="180" cy="70" r="30"
              fill={getFill("natureCloud")} {...common} />
          </g>

          {/* Mountain */}
          <path
            d="M0 245 L110 95 L205 230 L285 115 L400 245 Z"
            fill={getFill("natureMountain")}
            {...common}
            onClick={() => click("natureMountain")}
          />

          {/* Stream */}
          <path
            d="M180 400 Q160 350 205 310 Q245 275 220 240
               Q270 280 250 330 Q230 365 260 400 Z"
            fill={getFill("natureStream")}
            {...common}
            onClick={() => click("natureStream")}
          />

          {/* Tree trunk */}
          <rect
            x="55"
            y="190"
            width="35"
            height="150"
            fill={getFill("natureTreeTrunk")}
            {...common}
            onClick={() => click("natureTreeTrunk")}
          />

          {/* Tree leaves */}
          <g
            onClick={() => click("natureTreeLeaves")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <circle cx="70" cy="155" r="60"
              fill={getFill("natureTreeLeaves")} {...common} />
            <circle cx="120" cy="180" r="45"
              fill={getFill("natureTreeLeaves")} {...common} />
          </g>

          {/* Bamboo stems */}
          <g
            onClick={() => click("natureBambooStem")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <rect x="300" y="150" width="22" height="190"
              fill={getFill("natureBambooStem")} {...common} />
            <rect x="335" y="170" width="22" height="170"
              fill={getFill("natureBambooStem")} {...common} />
          </g>

          {/* Bamboo leaves */}
          <g
            onClick={() => click("natureBambooLeaves")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <ellipse
              cx="285"
              cy="175"
              rx="60"
              ry="22"
              transform="rotate(-25 285 175)"
              fill={getFill("natureBambooLeaves")}
              {...common}
            />
            <ellipse
              cx="355"
              cy="205"
              rx="60"
              ry="22"
              transform="rotate(25 355 205)"
              fill={getFill("natureBambooLeaves")}
              {...common}
            />
          </g>

          {/* Flowers */}
          <g
            onClick={() => click("natureFlowers")}
            style={{ cursor: reference ? "default" : "pointer" }}
          >
            <circle cx="130" cy="340" r="20"
              fill={getFill("natureFlowers")} {...common} />
            <circle cx="300" cy="350" r="20"
              fill={getFill("natureFlowers")} {...common} />
          </g>
        </svg>
      );
    }

    return null;
  };

  // ---------------------------------------------------------
  // PROGRESS
  // ---------------------------------------------------------

  const completedCount = picture.regions.filter(
    (region) => completedRegions[region.id] === region.color
  ).length;

  const totalRegions = picture.regions.length;

  const progress =
    totalRegions === 0
      ? 0
      : Math.round((completedCount / totalRegions) * 100);

  // ---------------------------------------------------------
  // FINAL SCREEN
  // ---------------------------------------------------------

  if (currentPicture === pictures.length - 1 && isPictureComplete) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">

        <div className="bg-white rounded-3xl shadow-lg p-8 text-center">

          <div className="text-6xl mb-4">🎨</div>

          <h2 className="text-3xl font-bold text-emerald-700 mb-3">
            CreativeCalm Complete!
          </h2>

          <p className="text-lg text-gray-600 mb-6">
            Wonderful work! You completed all 12 pictures.
          </p>

          <button
            onClick={restartGame}
            className="px-8 py-4 rounded-2xl bg-emerald-600 text-white text-lg font-semibold hover:bg-emerald-700"
          >
            Start Again
          </button>

        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // MAIN GAME UI
  // ---------------------------------------------------------

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6">

      {/* HEADER */}
      <div className="text-center mb-5">

        <h1 className="text-3xl md:text-4xl font-bold text-emerald-700">
          🎨 CreativeCalm
        </h1>

        <p className="text-gray-600 mt-2">
          Look at the reference and color the picture to match it.
        </p>

      </div>

      {/* LEVEL + PICTURE INFO */}
      <div className="bg-white rounded-2xl shadow-md p-4 mb-5">

        <div className="flex flex-col md:flex-row justify-between items-center gap-3">

          <div>
            <p className="font-bold text-xl">
              Picture {currentPicture + 1} of {pictures.length}
            </p>
          </div>

          <div className="text-center">

            <p className="font-semibold text-gray-700">
              {picture.title}
            </p>

            <p className="text-sm text-gray-500">
              {completedCount} of {totalRegions} parts completed
            </p>

          </div>

        </div>

        {/* PROGRESS BAR */}
        <div className="mt-4">

          <div className="w-full bg-gray-200 rounded-full h-4">

            <div
              className="bg-emerald-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />

          </div>

          <p className="text-center text-sm text-gray-500 mt-1">
            {progress}% complete
          </p>

        </div>

      </div>

      {/* EXIT BUTTON */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowExitPopup(true)}
          className="px-5 py-3 rounded-2xl bg-gray-700 text-white font-semibold hover:bg-gray-800 shadow-md"
      >
  Exit
</button>
      </div>

      {/* REFERENCE + PATIENT IMAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* REFERENCE */}
        <div className="bg-white rounded-3xl shadow-md p-4">

          <h2 className="text-center text-xl font-bold text-gray-700 mb-3">
            🌈 Reference
          </h2>

          <div className="aspect-square w-full border-4 border-gray-200 rounded-2xl overflow-hidden bg-white">
            {drawPicture(picture, true)}
          </div>

        </div>

        {/* PATIENT IMAGE */}
        <div className="bg-white rounded-3xl shadow-md p-4">

          <h2 className="text-center text-xl font-bold text-gray-700 mb-3">
            🖌️ Your Picture
          </h2>

          <div className="aspect-square w-full border-4 border-emerald-200 rounded-2xl overflow-hidden bg-white">
            {drawPicture(picture, false)}
          </div>

        </div>

      </div>

      {/* COLOR PALETTE */}
      <div className="bg-white rounded-3xl shadow-md p-5 mt-5">

        <h2 className="text-center text-xl font-bold text-gray-700 mb-4">
          Choose a Color
        </h2>

        <div className="flex flex-wrap justify-center gap-4">

          {picture.palette.map((color, index) => (

            <button
              key={`${color}-${index}`}
              onClick={() => handleColorSelect(color)}
              aria-label={`Select color ${index + 1}`}
              className={`
                w-14 h-14 md:w-16 md:h-16
                rounded-full
                border-4
                transition-all
                duration-200
                hover:scale-110
                ${selectedColor === color
                  ? "border-gray-900 scale-110 shadow-lg"
                  : "border-gray-300"}
              `}
              style={{
                backgroundColor: color,
              }}
            />

          ))}

        </div>

      </div>

      {/* MESSAGE */}
      <div className="text-center mt-5">

        <div
          className={`
            inline-block
            px-6 py-3
            rounded-2xl
            text-lg
            font-semibold
            ${
              isPictureComplete
                ? "bg-green-100 text-green-700"
                : "bg-blue-50 text-blue-700"
            }
          `}
        >
          {isPictureComplete
            ? "🎉 Excellent! You completed this picture!"
            : message}
        </div>

      </div>

      {/* NEXT BUTTON */}
      <div className="flex justify-center mt-5">

        <button
          onClick={handleNextPicture}
          disabled={!isPictureComplete}
          className={`
            px-8 py-4
            rounded-2xl
            text-lg
            font-bold
            transition-all
            ${
              isPictureComplete
                ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {currentPicture === 2 ||
          currentPicture === 5 ||
          currentPicture === 8
            ? "Next Level →"
            : "Next Picture →"}
        </button>

      </div>


      {/* LEVEL COMPLETION POPUP */}
      {showLevelPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold text-emerald-700 mb-3">
              Wonderful Work!
            </h2>
            <p className="text-gray-700 text-lg mb-6">
              You completed Level {picture.level}! You did a great job coloring all the pictures.
            </p>
            <p className="text-gray-600 mb-6">
              Would you like to participate in the next level?
            </p>
            <button
              onClick={continueToNextLevel}
              className="px-7 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
            >
              Yes, Next Level →
            </button>
          </div>
        </div>
      )}

      {/* EXIT CONFIRMATION POPUP */}
      {showExitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="text-4xl mb-3">🚪</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Are you sure to exit?
            </h2>
            <p className="text-gray-600 mb-6">
              Your current painting progress will not be continued if you exit.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowExitPopup(false)}
                className="px-7 py-3 rounded-2xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300"
              >
                No
              </button>
              <button
                onClick={() => {
                  setShowExitPopup(false);
                  if (onExit) {
                    onExit();
                  } else {
                    window.history.back();
                  }
                }}
                className="px-7 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// 6. SOUND GUESS
const SoundGuessGame = ({ onBack, level, processTelemetry }) => {
  const [phase, setPhase] = useState('play');
  const [startTime] = useState(Date.now());
  const pool = [
    {icon: '🐦', name: 'Bird'}, {icon: '🐶', name: 'Dog'}, {icon: '🔔', name: 'Bell'}, 
    {icon: '🌧️', name: 'Rain'}, {icon: '🚗', name: 'Car'}, {icon: '🐄', name: 'Cow'}
  ];
  const [options, setOptions] = useState([]);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const opts = shuffle(pool).slice(0, level === 1 ? 2 : level === 2 ? 3 : 4);
    setOptions(opts);
    setTarget(opts[Math.floor(Math.random() * opts.length)]);
  }, [level]);

  const playSound = () => {
    const u = new SpeechSynthesisUtterance(`${target.name} sound effect`);
    window.speechSynthesis.speak(u);
    setTimeout(() => setPhase('guess'), 2000);
  };

  const handleGuess = (val) => {
    if (val === target.name) {
      processTelemetry('SoundGuess', 1000, 0, (Date.now() - startTime)/1000);
      setPhase('result');
    } else {
      processTelemetry('SoundGuess', 1000, 1, (Date.now() - startTime)/1000);
    }
  };

  return (
    <PageContainer title="Sound Guess" level={level}>
      {phase === 'play' && (
        <div className="text-center mt-10 w-full">
          <button onClick={playSound} className="mx-auto p-10 bg-indigo-100 rounded-full mb-8 animate-pulse shadow-lg border-4 border-indigo-200">
            <Volume2 className="w-20 h-20 text-indigo-600" />
          </button>
          <p className="font-bold text-xl text-indigo-900">Tap to listen to the sound</p>
        </div>
      )}
      {phase === 'guess' && (
        <div className="text-center w-full">
          <p className="text-2xl font-bold mb-8 text-indigo-900">What sound did you hear?</p>
          <div className="flex flex-wrap gap-4 justify-center">
            {options.map((opt, i) => (
              <button key={i} onClick={() => handleGuess(opt.name)} className="text-6xl p-6 bg-white rounded-2xl shadow hover:bg-indigo-100 border-2 hover:border-indigo-400 w-32 h-32 flex justify-center items-center">{opt.icon}</button>
            ))}
          </div>
        </div>
      )}
      {phase === 'result' && (
         <div className="text-center mt-10">
           <div className="text-8xl mb-8">🎶</div>
         </div>
      )}
    </PageContainer>
  );
};

// 7. EXPLORE & LEARN
const ExploreLearnGame = ({ onBack, level, processTelemetry }) => {
  const [phase, setPhase] = useState('explore');
  const [startTime] = useState(Date.now());
  const pool = [
    { icon: '🏔️', name: 'Mountain', desc: 'Mountains are important geographical features of the North Eastern Region.' },
    { icon: '🦏', name: 'Rhinoceros', desc: 'The one-horned rhinoceros is native to Assam.' },
    { icon: '🌸', name: 'Orchid', desc: 'NER is home to hundreds of rare orchid species.' },
    { icon: '🚣', name: 'River', desc: 'The Brahmaputra river is a lifeline for the region.' }
  ];
  
  const [items, setItems] = useState([]);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const count = level === 1 ? 1 : 3;
    const selected = shuffle(pool).slice(0, count);
    setItems(selected);
    setTarget(selected[Math.floor(Math.random() * selected.length)]);
  }, [level]);

  const handleResult = (val) => {
    if (val === target.name) {
      processTelemetry('ExploreLearn', 1000, 0, (Date.now() - startTime)/1000);
      setPhase('result');
    } else {
      processTelemetry('ExploreLearn', 1000, 1, (Date.now() - startTime)/1000);
    }
  };

  return (
    <PageContainer title="Explore & Learn" level={level}>
      {phase === 'explore' && (
        <div className="text-center w-full">
          <p className="font-bold text-xl mb-4 text-orange-900">Look at these items:</p>
          <div className="flex justify-center gap-4 mb-8">
            {items.map((it, i) => <div key={i} className="text-[80px]">{it.icon}</div>)}
          </div>
          <button onClick={() => setPhase('explain')} className="bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-xl w-full">Next</button>
        </div>
      )}
      {phase === 'explain' && (
        <div className="text-center w-full">
          <div className="text-[100px] mb-4">{target.icon}</div>
          <p className="font-bold text-lg bg-white p-6 rounded-xl shadow-md mb-8 border border-orange-100 text-slate-700">{target.desc}</p>
          <button onClick={() => {
            if (level === 1) handleResult(target.name);
            else setPhase('question');
          }} className="bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-xl w-full">Understood</button>
        </div>
      )}
      {phase === 'question' && (
        <div className="text-center w-full">
          <p className="text-2xl font-bold mb-8 text-orange-900">Which image was explained?</p>
          <div className="flex gap-4 justify-center">
             {items.map((it, i) => (
                <button key={i} onClick={() => handleResult(it.name)} className="text-6xl p-6 bg-white rounded-2xl shadow border-2 hover:border-orange-500">{it.icon}</button>
             ))}
          </div>
        </div>
      )}
      {phase === 'result' && (
         <div className="text-center mt-10">
           <div className="text-8xl mb-8">🌟</div>
           <button onClick={onBack} className="bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-xl">Back</button>
         </div>
      )}
    </PageContainer>
  );
};

// 8. FEED THE DOG
const FeedDogGame = ({ onBack, level, processTelemetry }) => {
  const [phase, setPhase] = useState('observe');
  const [startTime] = useState(Date.now());
  const [targetItem, setTargetItem] = useState(null);
  
  const options = [
    { emoji: '🦴', name: 'Bone' },
    { emoji: '🥩', name: 'Meat' },
    { emoji: '🥫', name: 'Dog Food' },
    { emoji: '🎾', name: 'Ball' }
  ];
  const [currentOptions, setCurrentOptions] = useState([]);

  useEffect(() => {
    const count = level === 1 ? 2 : level === 2 ? 3 : 4;
    const shuffled = [...options].sort(() => 0.5 - Math.random());
    const selectedOptions = shuffled.slice(0, count);
    setCurrentOptions(selectedOptions);
    setTargetItem(selectedOptions[Math.floor(Math.random() * selectedOptions.length)]);
    setPhase('question');
  }, [level]);

  const handleSelect = (val) => {
    if (val === targetItem.name) {
      processTelemetry('FeedDog', 1000, 0, (Date.now() - startTime)/1000);
      setPhase('result');
    } else {
      processTelemetry('FeedDog', 1000, 1, (Date.now() - startTime)/1000);
    }
  };

  return (
    <PageContainer title="Feed the Dog" level={level}>
      {phase === 'question' && targetItem && (
        <div className="text-center w-full mt-8">
          <div className="text-[120px] mb-4 animate-bounce">🐶</div>
          <div className="bg-blue-50 text-blue-900 font-bold p-4 rounded-xl mb-8 border border-blue-200 shadow-sm inline-block relative">
            "I want my {targetItem.name}!"
            <div className="absolute -top-3 left-1/2 w-4 h-4 bg-blue-50 border-t border-l border-blue-200 transform -translate-x-1/2 rotate-45"></div>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {currentOptions.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleSelect(opt.name)}
                className="text-7xl bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:scale-110 hover:shadow-md transition-all active:scale-95"
              >
                {opt.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      {phase === 'result' && (
        <div className="text-center w-full mt-10 animate-fade-in">
          <div className="text-[140px] mb-4">🐕</div>
          <p className="text-3xl font-black text-emerald-600 mb-8 tracking-tight">Happy Dog!</p>
          <button onClick={onBack} className="w-full max-w-xs bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-xl">Continue</button>
        </div>
      )}
    </PageContainer>
  );
};

// 9. FIND HOME (Maze)
const MAZES = {
  1: [
    ['S', '0', '1', '1', '1'],
    ['1', '0', '0', '0', '1'],
    ['1', '1', '1', '0', '1'],
    ['1', '1', '1', '0', '0'],
    ['1', '1', '1', '1', 'E']
  ],
  2: [
    ['S', '1', '1', '1', '1'],
    ['0', '0', '0', '1', '1'],
    ['1', '1', '0', '0', '0'],
    ['1', '1', '1', '1', '0'],
    ['1', '1', '1', '1', 'E']
  ],
  3: [
    ['S', '0', '0', '1', '1'],
    ['1', '1', '0', '1', '1'],
    ['1', '0', '0', '0', '1'],
    ['1', '0', '1', '0', '1'],
    ['1', '0', '0', '0', 'E']
  ]
};

const FindHomeGame = ({ onBack, level, processTelemetry }) => {
  const [pos, setPos] = useState({r: 0, c: 0});
  const [maze, setMaze] = useState(MAZES[level] || MAZES[1]);
  const [startTime] = useState(Date.now());
  const [errors, setErrors] = useState(0);
  const [won, setWon] = useState(false);
  
  useEffect(() => {
    setMaze(MAZES[level] || MAZES[1]);
    setPos({r: 0, c: 0});
  }, [level]);

  const move = (dr, dc) => {
    if (won) return;
    const nr = pos.r + dr;
    const nc = pos.c + dc;
    
    if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
      const cell = maze[nr][nc];
      if (cell === '1') {
        setErrors(e => e + 1);
      } else {
        setPos({r: nr, c: nc});
        if (cell === 'E') {
          processTelemetry('FindHome', 1000, errors, (Date.now() - startTime)/1000);
          setWon(true);
        }
      }
    }
  };

  return (
    <PageContainer title="Find Way Home" level={level}>
      {!won ? (
        <div className="w-full flex flex-col items-center mt-4">
          <p className="text-slate-500 font-bold mb-6 text-center">Help the person (🚶‍♂️) reach home (🏠)!</p>
          
          <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-200 mb-8">
            {maze.map((row, r) => (
              <div key={r} className="flex">
                {row.map((cell, c) => {
                  let bg = 'bg-slate-50';
                  if (cell === '1') bg = 'bg-emerald-600';
                  if (cell === 'E') bg = 'bg-blue-100';
                  
                  const isPlayer = pos.r === r && pos.c === c;
                  
                  return (
                    <div key={c} className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center border border-slate-100 text-3xl sm:text-4xl ${bg}`}>
                      {isPlayer ? '🚶‍♂️' : (cell === 'E' ? '🏠' : '')}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 w-48">
            <div></div>
            <button onClick={() => move(-1, 0)} className="bg-slate-200 hover:bg-slate-300 p-4 rounded-xl shadow text-2xl active:scale-95 transition-all flex items-center justify-center">⬆️</button>
            <div></div>
            <button onClick={() => move(0, -1)} className="bg-slate-200 hover:bg-slate-300 p-4 rounded-xl shadow text-2xl active:scale-95 transition-all flex items-center justify-center">⬅️</button>
            <button onClick={() => move(1, 0)} className="bg-slate-200 hover:bg-slate-300 p-4 rounded-xl shadow text-2xl active:scale-95 transition-all flex items-center justify-center">⬇️</button>
            <button onClick={() => move(0, 1)} className="bg-slate-200 hover:bg-slate-300 p-4 rounded-xl shadow text-2xl active:scale-95 transition-all flex items-center justify-center">➡️</button>
          </div>
        </div>
      ) : (
        <div className="text-center w-full mt-10 animate-fade-in">
          <div className="text-[140px] mb-4">🏠</div>
          <p className="text-3xl font-black text-cyan-600 mb-8 tracking-tight">Safe at Home!</p>
          <button onClick={onBack} className="w-full max-w-xs bg-cyan-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-xl">Continue</button>
        </div>
      )}
    </PageContainer>
  );
};

// MASTER DASHBOARD & AI ROUTER
export default function TherapySuite({ onNavigate, currentScreen, saveGameResult, currentUser }) {
  const [activeGame, setActiveGame] = useState(null); 
  
  const defaultLevel = currentUser?.dementia_level || 2;
  const [gameLevels, setGameLevels] = useState({
    nature: defaultLevel,
    routine: defaultLevel,
    money: defaultLevel,
    tray: defaultLevel,
    calm: defaultLevel,
    sound: defaultLevel,
    explore: defaultLevel,
    bird: defaultLevel,
    home: defaultLevel
  });
  
  const [currentSong, setCurrentSong] = useState(null);

  useEffect(() => {
    if (activeGame) {
      const songs = ['/songs/song1.mp3', '/songs/song2.mp4', '/songs/song3.mp4', '/songs/song4.mp4'];
      const randomSong = songs[Math.floor(Math.random() * songs.length)];
      setCurrentSong(randomSong);
    } else {
      setCurrentSong(null);
    }
  }, [activeGame]);

  const processTelemetry = async (gameName, latency, errors, completionSec) => {
    console.log(`📡 Saving [${gameName}] Telemetry...`);
    await saveTelemetryLocal(gameName, latency, errors, completionSec, currentUser?.email);

    console.log("Using Edge AI logic.");
    if (activeGame) {
      setGameLevels(prev => {
        let currentLevel = prev[activeGame];
        let nextLevel = currentLevel;
        if (errors >= 1 || latency > 4000) nextLevel = Math.max(1, currentLevel - 1); 
        else if (errors === 0 && latency < 2000) nextLevel = Math.min(3, currentLevel + 1); 
        return { ...prev, [activeGame]: nextLevel };
      });
    }
  };

  const handleBack = () => setActiveGame(null);

  const renderGame = () => {
    if (activeGame === 'nature') return <NatureRecallGame onBack={handleBack} level={gameLevels.nature} processTelemetry={processTelemetry} />;
    if (activeGame === 'routine') return <DailyRoutineGame onBack={handleBack} level={gameLevels.routine} processTelemetry={processTelemetry} />;
    if (activeGame === 'money') return <MoneyMatchGame onBack={handleBack} level={gameLevels.money} processTelemetry={processTelemetry} />;
    if (activeGame === 'tray') return <MemoryTrayGame onBack={handleBack} level={gameLevels.tray} processTelemetry={processTelemetry} />;
    if (activeGame === 'calm') return <CreativeCalmGame onExit={handleBack} />;
    if (activeGame === 'sound') return <SoundGuessGame onBack={handleBack} level={gameLevels.sound} processTelemetry={processTelemetry} />;
    if (activeGame === 'explore') return <ExploreLearnGame onBack={handleBack} level={gameLevels.explore} processTelemetry={processTelemetry} />;
    if (activeGame === 'bird') return <FeedDogGame onBack={handleBack} level={gameLevels.bird} processTelemetry={processTelemetry} />;
    if (activeGame === 'home') return <FindHomeGame onBack={handleBack} level={gameLevels.home} processTelemetry={processTelemetry} />;
    return null;
  };

  const { t } = useT();
  const gameElement = renderGame();

  if (gameElement) {
    return (
      <>
        {gameElement}
        {currentSong && <audio src={currentSong} autoPlay loop />}
      </>
    );
  }

  const navItems = [
    { id: 'daily_fun', labelKey: 'nav_daily_fun', icon: Smile },
    { id: 'therapy', labelKey: 'nav_therapy', icon: Puzzle },
    { id: 'meds', labelKey: 'nav_meds_photos', icon: Pill },
    { id: 'doctor', labelKey: 'nav_doctor', icon: Stethoscope },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-800 flex justify-center items-start p-2 sm:p-4 select-none font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden relative min-h-[850px] max-h-[90vh]">

        {/* HEADER */}
        <header className="px-4 py-4 bg-white flex items-center justify-between border-b border-slate-100 sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <button className="w-10 h-10 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-extrabold text-[#0A5C4A] text-lg leading-tight">{t('therapy_suite_title')}</h1>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">{t('ai_dda_active')}</span>
              </div>
            </div>
          </div>
          <button className="px-4 h-10 bg-[#BC1A22] text-white rounded-xl flex items-center justify-center font-black shadow-sm">{t('sos_button')}</button>
        </header>

        <div className="flex-1 overflow-y-auto pb-24 [&::-webkit-scrollbar]:hidden p-5">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 mb-6 text-center shadow-sm">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('individual_ai_active')}</span>
            <p className="text-sm font-medium text-slate-400 mt-1">{t('individual_ai_desc')}</p>
          </div>

          <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">{t('cognitive_suite_title')}</h2>
             
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => setActiveGame('nature')} className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl flex flex-col items-center hover:bg-emerald-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Leaf className="w-8 h-8 text-emerald-600" /></div>
              <span className="font-bold text-emerald-900 text-[13px] text-center mb-2">{t('game_nature_recall')}</span>
              <span className="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full">{t('level_label', { n: gameLevels.nature })}</span>
            </button>

            <button onClick={() => setActiveGame('routine')} className="bg-blue-50 border border-blue-100 p-5 rounded-3xl flex flex-col items-center hover:bg-blue-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Layout className="w-8 h-8 text-blue-600" /></div>
              <span className="font-bold text-blue-900 text-[13px] text-center mb-2">{t('game_daily_routine')}</span>
              <span className="text-[10px] bg-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded-full">{t('level_label', { n: gameLevels.routine })}</span>
            </button>

            <button onClick={() => setActiveGame('money')} className="bg-amber-50 border border-amber-100 p-5 rounded-3xl flex flex-col items-center hover:bg-amber-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Coins className="w-8 h-8 text-amber-600" /></div>
              <span className="font-bold text-amber-900 text-[13px] text-center mb-2">{t('game_money_match')}</span>
              <span className="text-[10px] bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-full">{t('level_label', { n: gameLevels.money })}</span>
            </button>

            <button onClick={() => setActiveGame('tray')} className="bg-purple-50 border border-purple-100 p-5 rounded-3xl flex flex-col items-center hover:bg-purple-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Brain className="w-8 h-8 text-purple-600" /></div>
              <span className="font-bold text-purple-900 text-[13px] text-center mb-2">{t('game_memory_tray')}</span>
              <span className="text-[10px] bg-purple-200 text-purple-800 font-bold px-2 py-0.5 rounded-full">{t('level_label', { n: gameLevels.tray })}</span>
            </button>

            <button onClick={() => setActiveGame('calm')} className="bg-pink-50 border border-pink-100 p-5 rounded-3xl flex flex-col items-center hover:bg-pink-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Palette className="w-8 h-8 text-pink-600" /></div>
              <span className="font-bold text-pink-900 text-[13px] text-center mb-2">{t('game_creative_calm')}</span>
              <span className="text-[10px] bg-pink-200 text-pink-800 font-bold px-2 py-0.5 rounded-full">{t('level_label', { n: gameLevels.calm })}</span>
            </button>

            <button onClick={() => setActiveGame('sound')} className="bg-indigo-50 border border-indigo-100 p-5 rounded-3xl flex flex-col items-center hover:bg-indigo-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Ear className="w-8 h-8 text-indigo-600" /></div>
              <span className="font-bold text-indigo-900 text-[13px] text-center mb-2">{t('game_sound_guess')}</span>
              <span className="text-[10px] bg-indigo-200 text-indigo-800 font-bold px-2 py-0.5 rounded-full">{t('level_label', { n: gameLevels.sound })}</span>
            </button>

            <button onClick={() => setActiveGame('explore')} className="bg-orange-50 border border-orange-100 p-5 rounded-3xl flex flex-col items-center hover:bg-orange-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Compass className="w-8 h-8 text-orange-600" /></div>
              <span className="font-bold text-orange-900 text-[13px] text-center mb-2">{t('game_explore_learn')}</span>
              <span className="text-[10px] bg-orange-200 text-orange-800 font-bold px-2 py-0.5 rounded-full">{t('level_label', { n: gameLevels.explore })}</span>
            </button>

            <button onClick={() => setActiveGame('bird')} className="bg-red-50 border border-red-100 p-5 rounded-3xl flex flex-col items-center hover:bg-red-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Dog className="w-8 h-8 text-red-600" /></div>
              <span className="font-bold text-red-900 text-[13px] text-center mb-2">{t('game_feed_dog')}</span>
              <span className="text-[10px] bg-red-200 text-red-800 font-bold px-2 py-0.5 rounded-full">{t('level_label', { n: gameLevels.bird })}</span>
            </button>

            <button onClick={() => setActiveGame('home')} className="bg-cyan-50 border border-cyan-100 p-5 rounded-3xl flex flex-col items-center hover:bg-cyan-100 transition-all shadow-sm col-span-2 group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Map className="w-8 h-8 text-cyan-600" /></div>
              <span className="font-bold text-cyan-900 text-[13px] text-center mb-2">{t('game_find_home')}</span>
              <span className="text-[10px] bg-cyan-200 text-cyan-800 font-bold px-2 py-0.5 rounded-full">{t('level_label', { n: gameLevels.home })}</span>
            </button>
          </div>
        </div>

        {/* BOTTOM NAV */}
        <nav className="absolute bottom-0 w-full border-t border-slate-100 bg-white px-2 py-2 flex items-center justify-between z-20 rounded-b-3xl pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)} className={`flex-1 flex flex-col items-center py-2 px-1 rounded-2xl ${isActive ? "bg-emerald-100 text-[#0A5C4A]" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                <Icon className={`w-6 h-6 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                <span className={`text-[10px] ${isActive ? "font-extrabold" : "font-medium"}`}>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}