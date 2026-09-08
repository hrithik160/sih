import React, { useState, useEffect } from 'react';
import { saveTelemetryLocal } from './db';
import { 
  ArrowLeft, Volume2, HelpCircle, MessageSquare, Leaf, Puzzle, 
  MessageCircle, Palette, Medal, Layout, Play, Rabbit, Music, 
  Lock, Brain, Smile, Pill, Stethoscope, Settings2, CheckCircle2 
} from 'lucide-react';

// ==========================================
// 1. GAME: HERITAGE MATCH
// ==========================================
const MemoryGame = ({ onBack, level, processTelemetry }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState(0);
  const [startTime] = useState(Date.now());
  const [lastTapTime, setLastTapTime] = useState(Date.now());
  const [latencyLog, setLatencyLog] = useState([]);

  // AI Scales the grid size
  const getDeck = () => {
    const deck = [
      { id: 1, icon: '🦏' }, { id: 2, icon: '🦏' },
      { id: 3, icon: '🌺' }, { id: 4, icon: '🌺' },
      { id: 5, icon: '🐅' }, { id: 6, icon: '🐅' },
      { id: 7, icon: '🦚' }, { id: 8, icon: '🦚' },
    ];
    let count = level === 1 ? 8 : level === 2 ? 6 : 4;
    return deck.slice(0, count).map(c => ({ ...c, flipped: false, matched: false })).sort(() => Math.random() - 0.5);
  };

  const [cards, setCards] = useState(getDeck());
  const [flipped, setFlipped] = useState([]);
  const [won, setWon] = useState(false);

  const handleFlip = (i) => {
    if (flipped.length === 2 || cards[i].flipped || cards[i].matched) return;
    
    // Track Tap Latency
    const now = Date.now();
    setLatencyLog(prev => [...prev, now - lastTapTime]);
    setLastTapTime(now);

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
          setErrors(e => e + 1); // Track Error
          finalCards[f].flipped = false;
          finalCards[s].flipped = false;
        }
        setCards(finalCards);
        setFlipped([]);
        
        if (finalCards.every(c => c.matched)) handleWin();
      }, 1000);
    }
  };

  const handleWin = async () => {
    setWon(true);
    setIsProcessing(true);
    const avgLatency = latencyLog.reduce((a, b) => a + b, 0) / (latencyLog.length || 1);
    await processTelemetry('MemoryMatch', avgLatency, errors, (Date.now() - startTime) / 1000);
    setIsProcessing(false);
  };

  return (
    <div className="p-6 h-full flex flex-col items-center justify-center bg-emerald-50">
      <div className="flex justify-between w-full mb-6">
        <h2 className="text-2xl font-black text-emerald-900">Heritage Match</h2>
        <span className="bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full text-xs font-bold">Level {level}</span>
      </div>
      
      {won ? (
        <div className="text-center animate-in zoom-in">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-bold text-emerald-700 mb-4">Memory Intact!</h3>
          {isProcessing ? <p className="animate-pulse text-emerald-600 font-bold">AI Analyzing Data...</p> : 
            <button onClick={onBack} className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl">Back to Suite</button>}
        </div>
      ) : (
        <div className={`grid gap-4 ${level === 1 ? 'grid-cols-4' : level === 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {cards.map((card, i) => (
            <button key={i} onClick={() => handleFlip(i)} className={`w-20 h-24 sm:w-24 sm:h-28 text-4xl flex justify-center items-center rounded-2xl shadow-md transition-all ${card.flipped || card.matched ? 'bg-white' : 'bg-emerald-600 rotate-180'}`}>
              <span className={card.flipped || card.matched ? 'opacity-100' : 'opacity-0'}>{card.icon}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. GAME: ROUTINE RECALL
// ==========================================
const RoutineGame = ({ onBack, level, processTelemetry }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState(0);
  const [startTime] = useState(Date.now());
  
  // AI Scales the sequence length
  const sequenceLength = level === 1 ? 4 : level === 2 ? 3 : 2;
  const fullRoutine = ['🌅 Wake Up', '☕ Morning Tea', '🚶‍♂️ Walk', '💊 Take Meds'];
  const correctOrder = fullRoutine.slice(0, sequenceLength);
  
  const [slots, setSlots] = useState(Array(sequenceLength).fill(null));
  const [tasks, setTasks] = useState([...correctOrder].sort(() => Math.random() - 0.5));
  const [won, setWon] = useState(false);

  const placeTask = (task) => {
    const emptyIndex = slots.indexOf(null);
    if (emptyIndex === -1) return;
    const newSlots = [...slots];
    newSlots[emptyIndex] = task;
    setSlots(newSlots);
    setTasks(tasks.filter(t => t !== task));
  };

  const checkOrder = async () => {
    if (slots.join() === correctOrder.join()) {
      setWon(true);
      setIsProcessing(true);
      await processTelemetry('RoutineRecall', 2000, errors, (Date.now() - startTime) / 1000);
      setIsProcessing(false);
    } else {
      setErrors(e => e + 1); // Track Error
      setSlots(Array(sequenceLength).fill(null));
      setTasks([...correctOrder].sort(() => Math.random() - 0.5));
    }
  };

  return (
    <div className="p-6 h-full flex flex-col items-center bg-blue-50">
      <div className="flex justify-between w-full mb-6">
        <h2 className="text-2xl font-black text-blue-900">Daily Flow</h2>
        <span className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-xs font-bold">Level {level}</span>
      </div>
      
      {!won ? (
        <div className="w-full">
          <div className="flex flex-col space-y-3 mb-8">
            {slots.map((slot, i) => (
              <div key={i} className={`h-16 rounded-xl border-4 flex items-center justify-center font-bold text-lg ${slot ? 'border-emerald-500 bg-emerald-100 text-emerald-900' : 'border-dashed border-blue-300 text-blue-300'}`}>
                {slot || `Step ${i + 1}`}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {tasks.map(t => <button key={t} onClick={() => placeTask(t)} className="bg-white border-2 border-blue-200 px-4 py-3 rounded-xl font-bold text-blue-900 shadow-sm">{t}</button>)}
          </div>
          {slots.every(s => s !== null) && <button onClick={checkOrder} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg animate-pulse">Check Routine</button>}
        </div>
      ) : (
        <div className="text-center animate-in zoom-in w-full">
          <div className="text-6xl mb-4">✅</div>
          {isProcessing ? <p className="animate-pulse text-blue-600 font-bold">AI Analyzing...</p> : 
             <button onClick={onBack} className="mt-6 bg-blue-600 text-white font-bold px-6 py-3 rounded-xl">Back to Suite</button>}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. GAME: REMEMBER THE TRAY
// ==========================================
const TrayGame = ({ onBack, level, processTelemetry }) => {
  const [phase, setPhase] = useState('observe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState(0);
  const [mcqStartTime, setMcqStartTime] = useState(0);
  const [startTime] = useState(Date.now());

  // AI Scales the difficulty
  const numItems = level === 1 ? 4 : level === 2 ? 3 : level === 3 ? 2 : 1;
  const delaySecs = level < 3 ? 4000 : 2000;
  
  const [trayItems] = useState(['🍵', '🧢', '🍎', '🔑'].slice(0, numItems));
  const [target] = useState(trayItems[0]);
  const [options] = useState(['👟', '🍌', target, '📖'].slice(0, level === 1 ? 4 : level === 2 ? 3 : 2).sort(() => Math.random() - 0.5));

  useEffect(() => {
    if (phase === 'observe') {
      const timer = setTimeout(() => {
        setPhase('mcq');
        setMcqStartTime(Date.now()); // Start latency timer
      }, delaySecs);
      return () => clearTimeout(timer);
    }
  }, [phase, delaySecs]);

  const handleGuess = async (opt) => {
    if (opt === target) {
      setPhase('result');
      setIsProcessing(true);
      const latency = Date.now() - mcqStartTime;
      await processTelemetry('TrayGame', latency, errors, (Date.now() - startTime) / 1000);
      setIsProcessing(false);
    } else {
      setErrors(e => e + 1); // Track Error
      alert("Not quite! Try again.");
    }
  };

  return (
    <div className="p-6 h-full flex flex-col items-center bg-amber-50">
       <div className="flex justify-between w-full mb-6">
        <h2 className="text-2xl font-black text-amber-900">The Tray</h2>
        <span className="bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">Level {level}</span>
      </div>

      {phase === 'observe' && (
        <div className="bg-white p-6 rounded-3xl shadow-lg flex flex-col items-center border-4 border-amber-200">
          <p className="font-bold text-amber-700 mb-6 animate-pulse text-center">Memorize these items...</p>
          <div className="flex gap-4 text-6xl">{trayItems.map((item, i) => <span key={i}>{item}</span>)}</div>
        </div>
      )}

      {phase === 'mcq' && (
        <div className="w-full flex flex-col items-center animate-in fade-in">
          <p className="font-bold text-xl text-amber-900 mb-6">Which was on the tray?</p>
          <div className="grid grid-cols-2 gap-4 w-full">
            {options.map((opt, i) => (
              <button key={i} onClick={() => handleGuess(opt)} className="bg-white h-24 text-5xl rounded-2xl shadow-sm border-2 border-amber-100 hover:border-amber-400">{opt}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div className="text-center w-full">
          <div className="text-6xl mb-4">🌟</div>
          {isProcessing ? <p className="animate-pulse text-amber-600 font-bold">AI Analyzing...</p> : 
            <button onClick={onBack} className="mt-6 bg-amber-600 text-white font-bold px-6 py-3 rounded-xl">Back to Suite</button>}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. GAME: COLORING BOOK (Calming/No Error Tracking)
// ==========================================
const ColoringGame = ({ onBack, level, processTelemetry }) => {
  const [selectedColor, setSelectedColor] = useState('#EF4444');
  const [startTime] = useState(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);
  
  // AI Scales complexity: Level 1 has 5 regions, Level 4 has 1 massive region.
  const initialRegions = level <= 2 
    ? { top: '#F3F4F6', right: '#F3F4F6', bottom: '#F3F4F6', left: '#F3F4F6', center: '#F3F4F6' }
    : { main: '#F3F4F6' };
  
  const [regions, setRegions] = useState(initialRegions);
  const colors = ['#EF4444', '#3B82F6', '#EAB308', '#22C55E', '#A855F7'];

  const colorRegion = async (key) => {
    const newReg = { ...regions, [key]: selectedColor };
    setRegions(newReg);
    
    // If no blank spots left, trigger win
    if (!Object.values(newReg).includes('#F3F4F6')) {
      setIsProcessing(true);
      await processTelemetry('Coloring', 1000, 0, (Date.now() - startTime) / 1000);
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col items-center bg-purple-50">
      <div className="flex justify-between w-full mb-4">
        <h2 className="text-2xl font-black text-purple-900">Coloring Art</h2>
        <span className="bg-purple-200 text-purple-900 px-3 py-1 rounded-full text-xs font-bold">Level {level}</span>
      </div>
      
      {!Object.values(regions).includes('#F3F4F6') && !isProcessing ? (
        <button onClick={onBack} className="bg-purple-600 text-white font-bold px-6 py-3 rounded-xl mb-4 shadow-md">Beautiful! Back to Suite</button>
      ) : (
        <div className="flex space-x-3 mb-6 bg-white p-3 rounded-2xl shadow-sm">
          {colors.map(c => (
            <button key={c} onClick={() => setSelectedColor(c)} className={`w-10 h-10 rounded-full ${selectedColor === c ? 'scale-110 ring-4 ring-purple-300' : ''}`} style={{backgroundColor: c}} />
          ))}
        </div>
      )}

      <div className="w-full max-w-[280px] bg-white p-6 rounded-3xl shadow-lg flex-1 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-auto cursor-pointer drop-shadow-sm transition-all duration-500">
          {level <= 2 ? (
            <>
              <circle cx="50" cy="25" r="20" fill={regions.top} onClick={() => colorRegion('top')} stroke="#1F2937" strokeWidth="2"/>
              <circle cx="50" cy="75" r="20" fill={regions.bottom} onClick={() => colorRegion('bottom')} stroke="#1F2937" strokeWidth="2"/>
              <circle cx="25" cy="50" r="20" fill={regions.left} onClick={() => colorRegion('left')} stroke="#1F2937" strokeWidth="2"/>
              <circle cx="75" cy="50" r="20" fill={regions.right} onClick={() => colorRegion('right')} stroke="#1F2937" strokeWidth="2"/>
              <circle cx="50" cy="50" r="15" fill={regions.center} onClick={() => colorRegion('center')} stroke="#1F2937" strokeWidth="3"/>
            </>
          ) : (
            <path d="M50 10 C20 10, 10 40, 50 90 C90 40, 80 10, 50 10 Z" fill={regions.main} onClick={() => colorRegion('main')} stroke="#1F2937" strokeWidth="2" />
          )}
        </svg>
      </div>
    </div>
  );
};

// ==========================================
// 5. GAME: FEED THE BIRD (Reward System)
// ==========================================
const BirdGame = ({ onBack, level, processTelemetry }) => {
  const [fullness, setFullness] = useState(0);
  const [startTime] = useState(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);

  // AI Scales required taps
  const feedAmount = level === 1 ? 20 : level === 2 ? 34 : level === 3 ? 50 : 100;

  const feedBird = async () => {
    const newFullness = Math.min(fullness + feedAmount, 100);
    setFullness(newFullness);
    
    if (newFullness === 100) {
      setIsProcessing(true);
      await processTelemetry('BirdGame', 1000, 0, (Date.now() - startTime) / 1000);
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col items-center justify-center bg-orange-50">
      <h2 className="text-2xl font-black text-orange-900 mb-8">Feed the Songbird</h2>
      <div className={`text-9xl transition-transform duration-300 mb-12 ${fullness === 100 ? 'animate-bounce scale-110' : 'scale-100'}`}>
        {fullness === 100 ? '🦚' : '🐦'}
      </div>
      <div className="w-full max-w-xs bg-white rounded-full h-6 border-2 border-orange-200 mb-6 relative overflow-hidden">
        <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${fullness}%` }} />
      </div>
      {fullness < 100 ? (
        <button onClick={feedBird} className="w-48 py-4 rounded-2xl font-black text-xl text-white bg-orange-600 shadow-lg active:scale-95">Give Seeds 🌰</button>
      ) : (
        isProcessing ? <p className="animate-pulse text-orange-600 font-bold">Logging reward...</p> : 
        <button onClick={onBack} className="bg-orange-600 text-white font-bold px-6 py-3 rounded-xl mt-4">Back to Suite</button>
      )}
    </div>
  );
};

// ==========================================
// MASTER DASHBOARD & AI ROUTER
// ==========================================
// UPDATE your TherapySuite definition to accept the new prop:
export default function TherapySuite({ onNavigate, currentScreen, saveGameResult }) {
  const [activeGame, setActiveGame] = useState(null); 
  const [globalAiLevel, setGlobalAiLevel] = useState(2); 

  // UPDATE this function to save to the local database:
  const processTelemetry = async (gameName, latency, errors, completionSec) => {
    console.log(`📡 Sending [${gameName}] Telemetry to AI...`);
    await saveTelemetryLocal(gameName, latency, errors, completionSec);
    // 1. SAVE TO LOCAL DATABASE
    

    try {
      const response = await fetch('http://localhost:8000/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latency_ms: latency,
          error_count: errors,
          completion_sec: completionSec,
          baseline_stage: globalAiLevel
        })
      });
      const data = await response.json();
      setGlobalAiLevel(data.new_level);
    } catch (err) {
      console.warn("⚠️ API Offline. Using Edge AI Fallback logic.");
      let nextLevel = globalAiLevel;
      if (errors >= 2 || latency > 4000) nextLevel = Math.min(4, globalAiLevel + 1); 
      else if (errors === 0 && latency < 1500) nextLevel = Math.max(1, globalAiLevel - 1); 
      setGlobalAiLevel(nextLevel);
    }
    await new Promise(r => setTimeout(r, 1200)); 
  };
// ... rest of the file stays the same

  const handleBack = () => setActiveGame(null);

  // Router for Fullscreen Games
  if (activeGame === 'memory') return <MemoryGame onBack={handleBack} level={globalAiLevel} processTelemetry={processTelemetry} />;
  if (activeGame === 'routine') return <RoutineGame onBack={handleBack} level={globalAiLevel} processTelemetry={processTelemetry} />;
  if (activeGame === 'tray') return <TrayGame onBack={handleBack} level={globalAiLevel} processTelemetry={processTelemetry} />;
  if (activeGame === 'color') return <ColoringGame onBack={handleBack} level={globalAiLevel} processTelemetry={processTelemetry} />;
  if (activeGame === 'bird') return <BirdGame onBack={handleBack} level={globalAiLevel} processTelemetry={processTelemetry} />;

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-800 flex justify-center items-start p-2 sm:p-4 select-none font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden relative min-h-[850px]">
        
        {/* HEADER */}
        <header className="px-4 py-3 bg-white flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <button className="w-10 h-10 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-extrabold text-[#0A5C4A] text-lg leading-tight">AI Therapy Suite</h1>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">AI DDA Engine Active</span>
              </div>
            </div>
          </div>
          <button className="px-4 h-10 bg-[#BC1A22] text-white rounded-xl flex items-center justify-center font-black">SOS</button>
        </header>

        <div className="flex-1 overflow-y-auto pb-24 [&::-webkit-scrollbar]:hidden p-4">
          
          <div className="bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 mb-6 text-center">
             <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Current AI Target Level</span>
             <div className="text-4xl font-extrabold text-[#0A5C4A] mt-1">Level {globalAiLevel}</div>
          </div>

          <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3">Select a Session</h2>
             
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => setActiveGame('memory')} className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col items-center hover:bg-emerald-100 transition-all shadow-sm">
              <Puzzle className="w-8 h-8 text-emerald-600 mb-2" />
              <span className="font-bold text-emerald-900 text-sm text-center">Heritage Match</span>
            </button>
            <button onClick={() => setActiveGame('routine')} className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex flex-col items-center hover:bg-blue-100 transition-all shadow-sm">
              <Layout className="w-8 h-8 text-blue-600 mb-2" />
              <span className="font-bold text-blue-900 text-sm text-center">Daily Routine</span>
            </button>
            <button onClick={() => setActiveGame('tray')} className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col items-center hover:bg-amber-100 transition-all shadow-sm">
              <Brain className="w-8 h-8 text-amber-600 mb-2" />
              <span className="font-bold text-amber-900 text-sm text-center">Tray Memory</span>
            </button>
            <button onClick={() => setActiveGame('color')} className="bg-purple-50 border border-purple-200 p-4 rounded-2xl flex flex-col items-center hover:bg-purple-100 transition-all shadow-sm">
              <Palette className="w-8 h-8 text-purple-600 mb-2" />
              <span className="font-bold text-purple-900 text-sm text-center">Coloring Book</span>
            </button>
          </div>
             
          <button onClick={() => setActiveGame('bird')} className="w-full bg-orange-100 border border-orange-300 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500 text-white w-12 h-12 rounded-xl flex items-center justify-center">
                <Rabbit className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="text-orange-900 font-extrabold text-sm block">Reward Unlocked!</span>
                <span className="text-orange-700 font-medium text-xs">Play "Feed the Songbird"</span>
              </div>
            </div>
            <Play className="w-6 h-6 text-orange-600 fill-orange-600" />
          </button>
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="absolute bottom-0 w-full border-t border-slate-100 bg-white px-2 py-2 flex items-center justify-between z-10 rounded-b-3xl">
          {[
            { id: 'daily_fun', label: 'Daily Fun', icon: Smile },
            { id: 'therapy', label: 'Therapy Games', icon: Puzzle },
            { id: 'meds', label: 'Meds & Photos', icon: Pill },
            { id: 'doctor', label: 'Doctor Care', icon: Stethoscope },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)} className={`flex-1 flex flex-col items-center py-2 px-1 rounded-2xl ${isActive ? "bg-emerald-200/50 text-[#0A5C4A]" : "text-slate-500 hover:text-slate-700"}`}>
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