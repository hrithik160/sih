import React, { useState, useEffect } from 'react';
import { saveTelemetryLocal } from './db';
import { 
  ArrowLeft, Volume2, HelpCircle, MessageSquare, Leaf, Puzzle, 
  MessageCircle, Palette, Medal, Layout, Play, Rabbit, Music, 
  Lock, Brain, Smile, Pill, Stethoscope, Settings2, CheckCircle2, Map,
  Coins, Ear, Compass, Bird, Mic
} from 'lucide-react';

// Common styling
const PageContainer = ({ title, level, children }) => (
  <div className="p-6 h-full flex flex-col items-center bg-emerald-50 relative">
    <div className="flex justify-between w-full mb-6">
      <h2 className="text-2xl font-black text-emerald-900">{title}</h2>
      <span className="bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full text-xs font-bold">Level {level}</span>
    </div>
    {children}
  </div>
);

// Helper for shuffling
const shuffle = (array) => [...array].sort(() => 0.5 - Math.random());

// 1. NATURE RECALL
const NatureRecallGame = ({ onBack, level, processTelemetry }) => {
  const [phase, setPhase] = useState('observe'); // observe, question, result
  const [items, setItems] = useState([]);
  const [target, setTarget] = useState(null);
  const [options, setOptions] = useState([]);
  const [questionType, setQuestionType] = useState('seen'); // 'seen' or 'position'
  const [startTime] = useState(Date.now());
  
  const pool = [
    { icon: '🦏', name: 'Rhino' }, { icon: '🐦', name: 'Hornbill' }, 
    { icon: '🌸', name: 'Orchid' }, { icon: '🦌', name: 'Sangai' },
    { icon: '🐼', name: 'Red Panda' }, { icon: '🌿', name: 'Plant' }
  ];

  useEffect(() => {
    const count = level === 1 ? 3 : level === 2 ? 5 : 6;
    const selected = shuffle(pool).slice(0, count);
    setItems(selected);
    const chosen = selected[Math.floor(Math.random() * selected.length)];
    setTarget(chosen);
    
    const qType = Math.random() > 0.5 && level > 1 ? 'position' : 'seen';
    setQuestionType(qType);
    
    if (qType === 'seen') {
      let opts = [chosen];
      while(opts.length < 3) {
        const r = pool[Math.floor(Math.random() * pool.length)];
        if(!opts.includes(r)) opts.push(r);
      }
      setOptions(shuffle(opts));
    } else {
      setOptions([0, 1, 2, 3, 4, 5].slice(0, count));
    }
    
    setTimeout(() => setPhase('question'), level === 1 ? 5000 : level === 2 ? 4000 : 3000);
  }, [level]);

  const handleGuess = (guess) => {
    let isCorrect = false;
    if (questionType === 'seen') isCorrect = guess.name === target.name;
    else isCorrect = items.indexOf(target) === guess;
    
    if (isCorrect) {
      processTelemetry('NatureRecall', 1000, 0, (Date.now() - startTime)/1000);
      setPhase('result');
    } else {
      processTelemetry('NatureRecall', 1000, 1, (Date.now() - startTime)/1000);
    }
  };

  return (
    <PageContainer title="Nature Recall" level={level}>
      {phase === 'observe' && (
        <div className="grid grid-cols-2 gap-4 w-full">
          {items.map((it, i) => <div key={i} className="text-6xl p-4 bg-white rounded-xl shadow flex justify-center items-center h-32">{it.icon}</div>)}
        </div>
      )}
      {phase === 'question' && target && (
        <div className="w-full text-center">
          {questionType === 'seen' ? (
            <>
              <p className="text-xl mb-6 font-bold text-emerald-800">Did you see the {target.name}?</p>
              <div className="flex justify-center gap-4 flex-wrap">
                 {options.map((opt, i) => (
                    <button key={i} onClick={() => handleGuess(opt)} className="text-5xl bg-white p-6 rounded-xl shadow hover:bg-emerald-100 h-32 w-32 flex justify-center items-center">{opt.icon}</button>
                 ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-xl mb-6 font-bold text-emerald-800">Where was the {target.icon} {target.name}?</p>
              <div className="grid grid-cols-2 gap-4 w-full">
                {items.map((_, i) => (
                   <button key={i} onClick={() => handleGuess(i)} className="text-3xl bg-white p-4 rounded-xl shadow hover:bg-emerald-100 h-32 flex justify-center items-center font-bold text-slate-300">Position {i+1}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {phase === 'result' && (
        <div className="text-center mt-10">
          <div className="text-8xl mb-8">🏆</div>
          <button onClick={onBack} className="bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl text-xl">Back</button>
        </div>
      )}
    </PageContainer>
  );
};

// 2. DAILY ROUTINE
const DailyRoutineGame = ({ onBack, level, processTelemetry }) => {
  const fullRoutine = ['Wake up 🌅', 'Brush 🪥', 'Breakfast 🍳', 'Medicine 💊', 'Walk 🚶', 'Lunch 🍱', 'Rest 🛏️'];
  const count = level === 1 ? 3 : level === 2 ? 5 : 7;
  
  const [phase, setPhase] = useState('observe');
  const [targetRoutine, setTargetRoutine] = useState([]);
  const [shuffled, setShuffled] = useState([]);
  const [currentOrder, setCurrentOrder] = useState([]);
  const [startTime] = useState(Date.now());
  const [won, setWon] = useState(false);
  const [qType, setQType] = useState('sequence'); // sequence or after

  useEffect(() => {
    const routine = fullRoutine.slice(0, count);
    setTargetRoutine(routine);
    setShuffled(shuffle(routine));
    
    const type = level > 1 && Math.random() > 0.5 ? 'after' : 'sequence';
    setQType(type);
    
    setTimeout(() => setPhase('question'), level === 1 ? 5000 : 3000);
  }, [level]);

  const selectItem = (item) => {
    const newOrder = [...currentOrder, item];
    setCurrentOrder(newOrder);
    setShuffled(shuffled.filter(i => i !== item));
    
    if (newOrder.length === targetRoutine.length) {
      if (newOrder.join(',') === targetRoutine.join(',')) {
        processTelemetry('DailyRoutine', 1000, 0, (Date.now() - startTime)/1000);
        setWon(true);
      } else {
        processTelemetry('DailyRoutine', 1000, 1, (Date.now() - startTime)/1000);
        setCurrentOrder([]);
        setShuffled(shuffle(targetRoutine));
      }
    }
  };

  const handleAfterGuess = (item) => {
    const targetIdx = 2; // after breakfast
    if (item === fullRoutine[targetIdx]) {
      processTelemetry('DailyRoutine', 1000, 0, (Date.now() - startTime)/1000);
      setWon(true);
    } else {
      processTelemetry('DailyRoutine', 1000, 1, (Date.now() - startTime)/1000);
    }
  };

  return (
    <PageContainer title="Daily Routine" level={level}>
      {phase === 'observe' && (
        <div className="flex flex-col gap-3 w-full">
          <p className="text-center font-bold text-slate-600 mb-2">Remember your routine:</p>
          {targetRoutine.map((r, i) => (
             <div key={i} className="bg-white p-4 rounded-xl shadow text-center font-bold text-lg text-emerald-800">{r}</div>
          ))}
        </div>
      )}
      {phase === 'question' && !won && qType === 'sequence' && (
        <div className="w-full">
           <div className="flex flex-col gap-3 mb-6">
             {Array.from({length: targetRoutine.length}).map((_, i) => (
               <div key={i} className="h-14 border-2 border-dashed border-emerald-300 rounded-xl flex items-center justify-center bg-white font-bold text-lg text-slate-700">
                 {currentOrder[i] || `Step ${i+1}`}
               </div>
             ))}
           </div>
           <div className="flex flex-wrap gap-2 justify-center">
             {shuffled.map((item, i) => (
               <button key={i} onClick={() => selectItem(item)} className="p-3 bg-white border-2 border-emerald-200 shadow-sm rounded-xl font-bold text-emerald-800 hover:bg-emerald-50">{item}</button>
             ))}
           </div>
        </div>
      )}
      {phase === 'question' && !won && qType === 'after' && (
        <div className="text-center w-full">
          <p className="text-2xl font-bold mb-8 text-emerald-900">What do you usually do after {fullRoutine[1]}?</p>
          <div className="flex flex-col gap-4">
             {shuffle(['Medicine 💊', 'Breakfast 🍳', 'Lunch 🍱', 'Rest 🛏️']).map((opt, i) => (
               <button key={i} onClick={() => handleAfterGuess(opt)} className="p-4 bg-white rounded-xl shadow text-xl font-bold hover:bg-emerald-100">{opt}</button>
             ))}
          </div>
        </div>
      )}
      {won && (
        <div className="text-center mt-10">
          <div className="text-8xl mb-8">✅</div>
          <button onClick={onBack} className="bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl text-xl">Back</button>
        </div>
      )}
    </PageContainer>
  );
};

// 3. MONEY MATCH
const MoneyMatchGame = ({ onBack, level, processTelemetry }) => {
  const [won, setWon] = useState(false);
  const [startTime] = useState(Date.now());
  
  const price = level === 1 ? 20 : level === 2 ? 30 : 30;
  const have = level === 3 ? 50 : 0;
  
  const options = level === 1 
    ? [{label: '₹10', val: 10}, {label: '₹20', val: 20}, {label: '₹50', val: 50}]
    : level === 2
    ? [{label: '₹10 + ₹10 + ₹10', val: 30}, {label: '₹20 + ₹20', val: 40}, {label: '₹50', val: 50}]
    : [{label: '₹10', val: 10}, {label: '₹20', val: 20}, {label: '₹30', val: 30}];

  const correctVal = level === 3 ? (have - price) : price;

  const handleSelect = (val) => {
    if (val === correctVal) {
      processTelemetry('MoneyMatch', 1000, 0, (Date.now() - startTime)/1000);
      setWon(true);
    } else {
      processTelemetry('MoneyMatch', 1000, 1, (Date.now() - startTime)/1000);
    }
  };

  return (
    <PageContainer title="Money Match" level={level}>
      {!won ? (
        <div className="text-center w-full">
          <div className="text-8xl mb-6">🍎</div>
          <p className="text-2xl font-bold mb-8 text-slate-700">
            {level === 3 ? `You have ₹${have}. The apple costs ₹${price}. How much change should you get?` : `The apple costs ₹${price}. Pay the correct amount.`}
          </p>
          <div className="flex flex-col gap-4">
            {options.map((opt, i) => (
              <button key={i} onClick={() => handleSelect(opt.val)} className="p-5 bg-white rounded-xl shadow text-xl font-bold border-2 border-transparent hover:border-emerald-500">{opt.label}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center mt-10">
          <div className="text-8xl mb-8">🎉</div>
          <button onClick={onBack} className="bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl text-xl">Back</button>
        </div>
      )}
    </PageContainer>
  );
};

// 4. MEMORY TRAY
const MemoryTrayGame = ({ onBack, level, processTelemetry }) => {
  const [phase, setPhase] = useState('observe');
  const [startTime] = useState(Date.now());
  const items = ['🍎', '🔑', '💊', '🥛', '📱', '👓', '🖊️', '⌚'];
  const [tray, setTray] = useState([]);
  const [missingItem, setMissingItem] = useState('');
  const [target, setTarget] = useState('');
  const [options, setOptions] = useState([]);
  const [qType, setQType] = useState('missing');

  useEffect(() => {
    const count = level === 1 ? 4 : level === 2 ? 6 : 8;
    const selectedTray = shuffle(items).slice(0, count);
    setTray(selectedTray);
    
    const missing = items.find(i => !selectedTray.includes(i)) || '🧦';
    setMissingItem(missing);
    
    const tgt = selectedTray[Math.floor(Math.random() * selectedTray.length)];
    setTarget(tgt);
    
    const type = level > 1 ? (Math.random() > 0.5 ? 'missing' : 'position') : 'present';
    setQType(type);

    if (type === 'present' || type === 'missing') {
       let opts = shuffle([tgt, missing, '👟']);
       setOptions(opts);
    }
    
    setTimeout(() => setPhase('question'), level === 1 ? 5000 : level === 2 ? 4000 : 3000);
  }, [level]);

  const handleGuess = (val) => {
    let isCorrect = false;
    if (qType === 'present') isCorrect = val === target;
    if (qType === 'missing') isCorrect = val === missingItem;
    if (qType === 'position') isCorrect = val === tray.indexOf(target);

    if (isCorrect) {
      processTelemetry('MemoryTray', 1000, 0, (Date.now() - startTime)/1000);
      setPhase('result');
    } else {
      processTelemetry('MemoryTray', 1000, 1, (Date.now() - startTime)/1000);
    }
  };

  return (
    <PageContainer title="Memory Tray" level={level}>
      {phase === 'observe' && (
        <div className="bg-amber-100 p-8 rounded-3xl border-4 border-amber-900 grid grid-cols-2 gap-6 w-full shadow-lg">
          {tray.map((it, i) => <div key={i} className="text-6xl flex justify-center">{it}</div>)}
        </div>
      )}
      {phase === 'question' && (
        <div className="text-center w-full">
          {qType === 'present' && <p className="text-2xl font-bold mb-8 text-amber-900">Which object was on the tray?</p>}
          {qType === 'missing' && <p className="text-2xl font-bold mb-8 text-amber-900">Which object was NOT on the tray?</p>}
          {qType === 'position' && <p className="text-2xl font-bold mb-8 text-amber-900">Where was the {target}?</p>}
          
          {(qType === 'present' || qType === 'missing') ? (
            <div className="flex gap-4 justify-center">
              {options.map((opt, i) => (
                <button key={i} onClick={() => handleGuess(opt)} className="text-6xl p-6 bg-white rounded-2xl shadow-lg hover:bg-emerald-100 border-2 hover:border-emerald-500 w-32 h-32 flex justify-center items-center">{opt}</button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 w-full">
              {tray.map((_, i) => (
                 <button key={i} onClick={() => handleGuess(i)} className="text-3xl bg-white p-4 rounded-xl shadow hover:bg-emerald-100 h-24 flex justify-center items-center font-bold text-slate-300">Pos {i+1}</button>
              ))}
            </div>
          )}
        </div>
      )}
      {phase === 'result' && (
        <div className="text-center mt-10">
          <div className="text-8xl mb-8">🏆</div>
          <button onClick={onBack} className="bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl text-xl">Back</button>
        </div>
      )}
    </PageContainer>
  );
};

// 5. CREATIVE CALM
const CreativeCalmGame = ({ onBack, level, processTelemetry }) => {
  const [phase, setPhase] = useState(level > 1 ? 'observe' : 'color');
  const [regions, setRegions] = useState({a: '#F3F4F6', b: '#F3F4F6', c: '#F3F4F6'});
  const [won, setWon] = useState(false);
  const [startTime] = useState(Date.now());
  
  const colors = ['#EF4444', '#3B82F6', '#EAB308', '#22C55E'];
  const targetColors = {a: '#3B82F6', b: '#EF4444', c: '#EAB308'}; // Fixed memory target

  useEffect(() => {
    if (level > 1) {
      setTimeout(() => setPhase('color'), 4000);
    }
  }, [level]);

  const colorIt = (key) => {
    if (phase !== 'color') return;
    const c = colors[Math.floor(Math.random() * colors.length)];
    const newReg = {...regions, [key]: c};
    setRegions(newReg);
    
    if (!Object.values(newReg).includes('#F3F4F6')) {
      if (level > 1) {
        // Memory check
        if (newReg.a === targetColors.a && newReg.b === targetColors.b && newReg.c === targetColors.c) {
           processTelemetry('CreativeCalm', 1000, 0, (Date.now() - startTime)/1000);
           setWon(true);
        } else {
           processTelemetry('CreativeCalm', 1000, 1, (Date.now() - startTime)/1000);
           setRegions({a: '#F3F4F6', b: '#F3F4F6', c: '#F3F4F6'}); // reset
        }
      } else {
        processTelemetry('CreativeCalm', 1000, 0, (Date.now() - startTime)/1000);
        setWon(true);
      }
    }
  };

  return (
    <PageContainer title="Creative Calm" level={level}>
      {!won ? (
        <div className="w-full flex flex-col justify-center items-center flex-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          {phase === 'observe' && <p className="font-bold text-lg mb-4 text-purple-800">Memorize the colors!</p>}
          {phase === 'color' && level > 1 && <p className="font-bold text-lg mb-4 text-purple-800">Reproduce the colors!</p>}
          
          <svg width="250" height="250" viewBox="0 0 100 100" className="drop-shadow-md">
             <path d="M50 10 Q 80 10 80 50 Q 80 90 50 90 Q 20 90 20 50 Q 20 10 50 10 Z" 
               fill={phase === 'observe' ? targetColors.a : regions.a} 
               onClick={() => colorIt('a')} stroke="#1F2937" strokeWidth="2"/>
             <circle cx="50" cy="50" r="20" 
               fill={phase === 'observe' ? targetColors.b : regions.b} 
               onClick={() => colorIt('b')} stroke="#1F2937" strokeWidth="2"/>
             <circle cx="50" cy="50" r="10" 
               fill={phase === 'observe' ? targetColors.c : regions.c} 
               onClick={() => colorIt('c')} stroke="#1F2937" strokeWidth="2"/>
          </svg>
        </div>
      ) : (
        <div className="text-center mt-10">
          <p className="text-2xl font-bold mb-8 text-purple-900">Beautiful artwork!</p>
          <button onClick={onBack} className="bg-purple-600 text-white font-bold px-8 py-4 rounded-xl text-xl">Back</button>
        </div>
      )}
    </PageContainer>
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
    // Ideally use real audio files. Fallback to basic audio context beep or simple TTS for simulation.
    // In a real NER app, this would play an mp3.
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
           <button onClick={onBack} className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl text-xl">Back</button>
         </div>
      )}
    </PageContainer>
  );
};

// 7. EXPLORE & LEARN
const ExploreLearnGame = ({ onBack, level, processTelemetry }) => {
  const [phase, setPhase] = useState('explore'); // explore, explain, question, result
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

// 8. FEED THE BIRD
const FeedBirdGame = ({ onBack, level, processTelemetry }) => {
  const [phase, setPhase] = useState('observe');
  const [startTime] = useState(Date.now());
  const [targetBird, setTargetBird] = useState(null);
  
  const pairings = [
    { bird: '🐦', food: '🍓' },
    { bird: '🦜', food: '🥜' },
    { bird: '🦆', food: '🍞' },
    { bird: '🦚', food: '🪱' }
  ];
  const [currentPairs, setCurrentPairs] = useState([]);

  useEffect(() => {
    const count = level === 1 ? 1 : level === 2 ? 2 : 3;
    const pairs = shuffle(pairings).slice(0, count);
    setCurrentPairs(pairs);
    setTargetBird(pairs[Math.floor(Math.random() * pairs.length)]);
    
    if(level > 1) {
      setTimeout(() => setPhase('question'), 4000);
    } else {
      setPhase('question');
    }
  }, [level]);

  const handleSelect = (val) => {
    if (val === targetBird.food) {
      processTelemetry('FeedBird', 1000, 0, (Date.now() - startTime)/1000);
      setPhase('result');
    } else {
      processTelemetry('FeedBird', 1000, 1, (Date.now() - startTime)/1000);
    }
  };

  return (
    <PageContainer title="Feed the Bird" level={level}>
      {phase === 'observe' && level > 1 && (
        <div className="flex flex-col gap-6 w-full mt-4">
           {currentPairs.map((p, i) => (
             <div key={i} className="flex justify-between items-center bg-white p-6 rounded-2xl shadow">
               <div className="text-6xl">{p.bird}</div>
               <div className="text-4xl text-slate-300">→</div>
               <div className="text-6xl">{p.food}</div>
             </div>
           ))}
        </div>
      )}
      {phase === 'question' && targetBird && (
        <div className="text-center w-full">
          <div className="text-[120px] mb-8 animate-bounce">{targetBird.bird}</div>
          <p className="font-bold text-2xl mb-8 text-red-900">What should this bird eat?</p>
          <div className="flex gap-4 justify-center">
            {shuffle(['🍓', '🥜', '🍞', '🪱']).map((f, i) => (
               <button key={i} onClick={() => handleSelect(f)} className="text-6xl p-6 bg-white rounded-2xl shadow-lg hover:bg-red-100 border-2 hover:border-red-400 w-32 h-32 flex justify-center items-center">{f}</button>
            ))}
          </div>
        </div>
      )}
      {phase === 'result' && (
         <div className="text-center mt-10">
           <div className="text-8xl mb-8">❤️</div>
           <button onClick={onBack} className="bg-red-600 text-white font-bold px-8 py-4 rounded-xl text-xl">Back</button>
         </div>
      )}
    </PageContainer>
  );
};

// 9. FIND YOUR WAY HOME
const FindHomeGame = ({ onBack, level, processTelemetry }) => {
  const [phase, setPhase] = useState('observe');
  const [startTime] = useState(Date.now());
  const [path, setPath] = useState([]);
  const [hiddenPath, setHiddenPath] = useState([]);
  const [qType, setQType] = useState('next'); // next or route
  
  useEffect(() => {
    const count = level === 1 ? 3 : level === 2 ? 5 : 7;
    // ensure Start and Home are first and last
    const middles = shuffle(['🌳 Park', '🏪 Shop', '🏥 Clinic', '🏫 School', '🛕 Temple']).slice(0, count - 2);
    const p = ['👴 Start', ...middles, '🏠 Home'];
    setPath(p);
    
    setHiddenPath(p.slice(0, level === 1 ? p.length : level === 2 ? 3 : 2));
    setQType(level > 1 ? 'next' : 'route');

    if (level >= 3) {
      setTimeout(() => setPhase('question'), 4000);
    } else {
      setPhase('question');
    }
  }, [level]);

  const targetAns = path[path.length - 2]; // what comes before home

  const handleSelect = (val) => {
    if (val === targetAns || val === '🏠 Home') {
      processTelemetry('FindHome', 1000, 0, (Date.now() - startTime)/1000);
      setPhase('result');
    } else {
      processTelemetry('FindHome', 1000, 1, (Date.now() - startTime)/1000);
    }
  };

  return (
    <PageContainer title="Find Your Way" level={level}>
      {phase === 'observe' && (
        <div className="flex flex-col gap-3 w-full">
           <p className="font-bold text-cyan-900 text-center mb-2">Remember this route:</p>
           {path.map((p, i) => (
             <div key={i} className="font-bold text-lg bg-white p-4 rounded-xl shadow flex items-center gap-4">
               <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center text-sm">{i+1}</div>
               {p}
             </div>
           ))}
        </div>
      )}
      {phase === 'question' && (
        <div className="text-center w-full">
          <p className="font-bold text-2xl mb-6 text-cyan-900">
            {qType === 'next' ? 'What comes before Home?' : 'Which road leads home?'}
          </p>
          <div className="flex flex-col gap-3 mb-8">
             {hiddenPath.map((p, i) => (
               <div key={i} className="font-bold text-lg bg-white p-4 rounded-xl shadow opacity-60 flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm">{i+1}</div>
                 {p}
               </div>
             ))}
             {qType === 'next' && (
               <>
                 <div className="font-black text-2xl bg-cyan-50 text-cyan-600 p-4 rounded-xl border-2 border-dashed border-cyan-400 animate-pulse">?</div>
                 <div className="font-bold text-lg bg-white p-4 rounded-xl shadow flex items-center gap-4">
                     <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center text-sm">{path.length}</div>
                     🏠 Home
                 </div>
               </>
             )}
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            {qType === 'next' ? (
              shuffle([targetAns, '🌳 Park', '🏪 Shop']).map((opt, i) => (
                <button key={i} onClick={() => handleSelect(opt)} className="p-4 bg-white rounded-xl shadow font-bold text-xl hover:bg-cyan-100 border-2 border-transparent hover:border-cyan-400">{opt}</button>
              ))
            ) : (
              <button onClick={() => handleSelect('🏠 Home')} className="p-4 bg-cyan-600 text-white rounded-xl shadow font-bold text-xl hover:bg-cyan-700 w-full">Follow path to Home</button>
            )}
          </div>
        </div>
      )}
      {phase === 'result' && (
         <div className="text-center mt-10">
           <div className="text-8xl mb-8">🏠</div>
           <button onClick={onBack} className="bg-cyan-600 text-white font-bold px-8 py-4 rounded-xl text-xl">Back</button>
         </div>
      )}
    </PageContainer>
  );
};

// MASTER DASHBOARD & AI ROUTER
export default function TherapySuite({ onNavigate, currentScreen, saveGameResult, currentUser }) {
  const [activeGame, setActiveGame] = useState(null); 
  const [globalAiLevel, setGlobalAiLevel] = useState(currentUser?.dementia_level || 2);

  const processTelemetry = async (gameName, latency, errors, completionSec) => {
    console.log(`📡 Sending [${gameName}] Telemetry to AI...`);
    await saveTelemetryLocal(gameName, latency, errors, completionSec, currentUser?.email);

    try {
      const response = await fetch('http://127.0.0.1:8008/api/evaluate', {
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
      if (errors >= 1 || latency > 4000) nextLevel = Math.max(1, globalAiLevel - 1); 
      else if (errors === 0 && latency < 2000) nextLevel = Math.min(3, globalAiLevel + 1); 
      setGlobalAiLevel(nextLevel);
    }
  };

  const handleBack = () => setActiveGame(null);

  if (activeGame === 'nature') return <NatureRecallGame onBack={handleBack} level={globalAiLevel} processTelemetry={processTelemetry} />;
  if (activeGame === 'routine') return <DailyRoutineGame onBack={handleBack} level={globalAiLevel} processTelemetry={processTelemetry} />;
  if (activeGame === 'money') return <MoneyMatchGame onBack={handleBack} level={globalAiLevel} processTelemetry={processTelemetry} />;
  if (activeGame === 'tray') return <MemoryTrayGame onBack={handleBack} level={globalAiLevel} processTelemetry={processTelemetry} />;
  if (activeGame === 'calm') return <CreativeCalmGame onBack={handleBack} level={globalAiLevel} processTelemetry={processTelemetry} />;
  if (activeGame === 'sound') return <SoundGuessGame onBack={handleBack} level={globalAiLevel} processTelemetry={processTelemetry} />;
  if (activeGame === 'explore') return <ExploreLearnGame onBack={handleBack} level={globalAiLevel} processTelemetry={processTelemetry} />;
  if (activeGame === 'bird') return <FeedBirdGame onBack={handleBack} level={globalAiLevel} processTelemetry={processTelemetry} />;
  if (activeGame === 'home') return <FindHomeGame onBack={handleBack} level={globalAiLevel} processTelemetry={processTelemetry} />;

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
              <h1 className="font-extrabold text-[#0A5C4A] text-lg leading-tight">AI Therapy Suite</h1>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">AI DDA Engine Active</span>
              </div>
            </div>
          </div>
          <button className="px-4 h-10 bg-[#BC1A22] text-white rounded-xl flex items-center justify-center font-black shadow-sm">SOS</button>
        </header>

        <div className="flex-1 overflow-y-auto pb-24 [&::-webkit-scrollbar]:hidden p-5">
          
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 mb-6 text-center shadow-sm">
             <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Current AI Target Level</span>
             <div className="text-5xl font-black text-[#0A5C4A] mt-2 tracking-tighter">Level {globalAiLevel}</div>
          </div>

          <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">9-Game Cognitive Suite</h2>
             
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => setActiveGame('nature')} className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl flex flex-col items-center hover:bg-emerald-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Leaf className="w-8 h-8 text-emerald-600" /></div>
              <span className="font-bold text-emerald-900 text-[13px] text-center">Nature Recall</span>
            </button>
            
            <button onClick={() => setActiveGame('routine')} className="bg-blue-50 border border-blue-100 p-5 rounded-3xl flex flex-col items-center hover:bg-blue-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Layout className="w-8 h-8 text-blue-600" /></div>
              <span className="font-bold text-blue-900 text-[13px] text-center">Daily Routine</span>
            </button>
            
            <button onClick={() => setActiveGame('money')} className="bg-amber-50 border border-amber-100 p-5 rounded-3xl flex flex-col items-center hover:bg-amber-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Coins className="w-8 h-8 text-amber-600" /></div>
              <span className="font-bold text-amber-900 text-[13px] text-center">Money Match</span>
            </button>
            
            <button onClick={() => setActiveGame('tray')} className="bg-purple-50 border border-purple-100 p-5 rounded-3xl flex flex-col items-center hover:bg-purple-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Brain className="w-8 h-8 text-purple-600" /></div>
              <span className="font-bold text-purple-900 text-[13px] text-center">Memory Tray</span>
            </button>
            
            <button onClick={() => setActiveGame('calm')} className="bg-pink-50 border border-pink-100 p-5 rounded-3xl flex flex-col items-center hover:bg-pink-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Palette className="w-8 h-8 text-pink-600" /></div>
              <span className="font-bold text-pink-900 text-[13px] text-center">Creative Calm</span>
            </button>
            
            <button onClick={() => setActiveGame('sound')} className="bg-indigo-50 border border-indigo-100 p-5 rounded-3xl flex flex-col items-center hover:bg-indigo-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Ear className="w-8 h-8 text-indigo-600" /></div>
              <span className="font-bold text-indigo-900 text-[13px] text-center">Sound Guess</span>
            </button>
            
            <button onClick={() => setActiveGame('explore')} className="bg-orange-50 border border-orange-100 p-5 rounded-3xl flex flex-col items-center hover:bg-orange-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Compass className="w-8 h-8 text-orange-600" /></div>
              <span className="font-bold text-orange-900 text-[13px] text-center">Explore & Learn</span>
            </button>
            
            <button onClick={() => setActiveGame('bird')} className="bg-red-50 border border-red-100 p-5 rounded-3xl flex flex-col items-center hover:bg-red-100 transition-all shadow-sm group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Bird className="w-8 h-8 text-red-600" /></div>
              <span className="font-bold text-red-900 text-[13px] text-center">Feed Bird</span>
            </button>
            
            <button onClick={() => setActiveGame('home')} className="bg-cyan-50 border border-cyan-100 p-5 rounded-3xl flex flex-col items-center hover:bg-cyan-100 transition-all shadow-sm col-span-2 group">
              <div className="bg-white p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-sm"><Map className="w-8 h-8 text-cyan-600" /></div>
              <span className="font-bold text-cyan-900 text-[13px] text-center">Find Your Way Home</span>
            </button>
          </div>
             
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="absolute bottom-0 w-full border-t border-slate-100 bg-white px-2 py-2 flex items-center justify-between z-20 rounded-b-3xl pb-safe">
          {[
            { id: 'daily_fun', label: 'Daily Fun', icon: Smile },
            { id: 'therapy', label: 'Therapy', icon: Puzzle },
            { id: 'meds', label: 'Meds & Photos', icon: Pill },
            { id: 'doctor', label: 'Doctor Care', icon: Stethoscope },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)} className={`flex-1 flex flex-col items-center py-2 px-1 rounded-2xl ${isActive ? "bg-emerald-100 text-[#0A5C4A]" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                <Icon className={`w-6 h-6 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                <span className={`text-[10px] ${isActive ? "font-extrabold" : "font-medium"}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
