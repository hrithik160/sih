import React, { useState, useEffect } from 'react';
import { saveTelemetryLocal } from './db';
import { 
  ArrowLeft, Volume2, HelpCircle, MessageSquare, Leaf, Puzzle, 
  MessageCircle, Palette, Medal, Layout, Play, Rabbit, Music, 
  Lock, Brain, Smile, Pill, Stethoscope, Settings2, CheckCircle2, Map,
  Coins, Ear, Compass, Bird, Mic, Dog
} from 'lucide-react';
import { useT } from './LanguageContext';

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
  const fullRoutine = [
    'Wake up 🌅', 'Brush Teeth 🪥', 'Take Shower 🚿', 'Breakfast 🍳', 
    'Morning Walk 🚶', 'Take Medicine 💊', 'Read Book 📖', 'Lunch 🍲', 
    'Afternoon Rest 🛋️', 'Watch TV 📺', 'Have Dinner 🍽️', 'Go to Sleep 🌙'
  ];
  
  const count = level === 1 ? 3 : level === 2 ? 5 : 7;
  
  const [phase, setPhase] = useState('observe');
  const [targetRoutine, setTargetRoutine] = useState([]);
  const [shuffled, setShuffled] = useState([]);
  const [currentOrder, setCurrentOrder] = useState([]);
  const [startTime] = useState(Date.now());
  const [won, setWon] = useState(false);
  const [qType, setQType] = useState('sequence'); // sequence or after

  useEffect(() => {
    // Pick random indices and sort chronologically
    let indices = [];
    while (indices.length < count) {
      let r = Math.floor(Math.random() * fullRoutine.length);
      if (!indices.includes(r)) indices.push(r);
    }
    indices.sort((a,b) => a - b);
    const routine = indices.map(i => fullRoutine[i]);
    
    setTargetRoutine(routine);
    setShuffled(shuffle(routine));
    
    const type = level > 1 && Math.random() > 0.5 ? 'after' : 'sequence';
    setQType(type);
    
    setTimeout(() => setPhase('question'), level === 1 ? 5000 : 4000);
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
        // Let them see their mistake briefly
        setTimeout(() => {
          setCurrentOrder([]);
          setShuffled(shuffle(targetRoutine));
        }, 1000);
      }
    }
  };

  const deselectItem = (item) => {
    const newOrder = currentOrder.filter(i => i !== item);
    setCurrentOrder(newOrder);
    setShuffled([...shuffled, item]);
  };

  const handleAfterGuess = (item) => {
    // For 'after' questions, we ask what happens AFTER a specific event.
    // Pick a random event from targetRoutine except the last one
    // But since we didn't store the question target, let's keep it simple
    // The previous code hardcoded targetIdx = 2. Let's fix that.
  };

  return (
    <PageContainer title="Daily Routine" level={level}>
      {phase === 'observe' && (
        <div className="flex flex-col gap-3 w-full">
          <p className="text-center font-bold text-slate-600 mb-2">Remember your routine:</p>
          {targetRoutine.map((r, i) => (
             <div key={i} className="bg-white p-4 rounded-xl shadow text-center font-bold text-lg text-emerald-800 animate-fade-in">{r}</div>
          ))}
        </div>
      )}
      {phase === 'question' && !won && qType === 'sequence' && (
        <div className="w-full">
           <p className="text-center font-bold text-slate-600 mb-4 text-sm">Tap activities to fill the slots in order. Tap a filled slot to remove it.</p>
           <div className="flex flex-col gap-3 mb-6">
             {Array.from({length: targetRoutine.length}).map((_, i) => {
               const item = currentOrder[i];
               return (
                 <div 
                   key={i} 
                   onClick={() => item ? deselectItem(item) : null}
                   className={`h-14 border-2 ${item ? 'border-emerald-500 bg-emerald-50 shadow-sm cursor-pointer' : 'border-dashed border-emerald-300 bg-white'} rounded-xl flex items-center justify-center font-bold text-lg ${item ? 'text-emerald-900' : 'text-slate-400'} transition-all`}
                 >
                   {item || `Slot ${i+1}`}
                 </div>
               );
             })}
           </div>
           
           <div className="flex flex-wrap gap-2 justify-center">
             {shuffled.map((item, i) => (
               <button key={i} onClick={() => selectItem(item)} className="p-3 bg-white border-2 border-emerald-200 shadow-sm rounded-xl font-bold text-emerald-800 hover:bg-emerald-50 active:scale-95 transition-all">{item}</button>
             ))}
           </div>
        </div>
      )}
      
      {phase === 'question' && !won && qType === 'after' && (
        <div className="w-full">
           <p className="text-center font-bold text-slate-600 mb-4 text-lg">What happens AFTER <br/><span className="text-emerald-700 text-2xl">{targetRoutine[0]}?</span></p>
           <div className="flex flex-col gap-3 justify-center">
             {shuffle([...targetRoutine]).map((item, i) => (
               <button 
                 key={i} 
                 onClick={() => {
                   if (item === targetRoutine[1]) {
                     processTelemetry('DailyRoutine', 1000, 0, (Date.now() - startTime)/1000);
                     setWon(true);
                   } else {
                     processTelemetry('DailyRoutine', 1000, 1, (Date.now() - startTime)/1000);
                   }
                 }} 
                 className="p-4 bg-white border-2 border-emerald-200 shadow-sm rounded-xl font-bold text-emerald-800 hover:bg-emerald-50 active:scale-95 transition-all"
               >
                 {item}
               </button>
             ))}
           </div>
        </div>
      )}

      {won && (
        <div className="text-center animate-bounce-in w-full flex flex-col items-center">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
             <CheckCircle2 className="w-16 h-16 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-emerald-800 mb-2">Perfect Sequence!</h2>
          <button onClick={onBack} className="mt-8 bg-emerald-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg active:scale-95 transition-all w-full">Back to Suite</button>
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
  const allItems = ['💊', '👟', '👓', '📱', '🔑', '⌚', '🥛', '🍎', '🖊️', '💍', '📚', '✂️', '☂️', '☕', '🎧', '📸'];
  const [tray, setTray] = useState([]);
  const [distractors, setDistractors] = useState([]);
  const [optionsGrid, setOptionsGrid] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  
  useEffect(() => {
    // Determine how many items to memorize based on AI Level
    const targetCount = level === 1 ? 4 : level === 2 ? 6 : 8;
    // We want a bigger pool to choose from for the question phase
    const gridCount = level === 1 ? 8 : level === 2 ? 12 : 16;
    
    const shuffledItems = shuffle([...allItems]);
    const selectedTray = shuffledItems.slice(0, targetCount);
    const distractorItems = shuffledItems.slice(targetCount, gridCount);
    
    setTray(selectedTray);
    setDistractors(distractorItems);
    
    // Grid shown during question phase = target items + distractors, shuffled
    setOptionsGrid(shuffle([...selectedTray, ...distractorItems]));
    
    // Give them time to memorize based on level
    const observeTime = level === 1 ? 6000 : level === 2 ? 5000 : 4000;
    setTimeout(() => setPhase('question'), observeTime);
  }, [level]);

  const toggleSelection = (item) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter(i => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const submitAnswers = () => {
    // Calculate accuracy and points
    let correctCount = 0;
    let falsePositives = 0;
    
    selectedItems.forEach(item => {
      if (tray.includes(item)) correctCount++;
      else falsePositives++;
    });
    
    const missedCount = tray.length - correctCount;
    const totalErrors = falsePositives + missedCount;
    
    // Send telemetry to update decision tree
    // If they got all correct and no false positives, errors = 0
    processTelemetry('MemoryTray', 1000, totalErrors, (Date.now() - startTime)/1000);
    
    setPhase('result');
  };

  return (
    <PageContainer title="Memory Tray" level={level}>
      {phase === 'observe' && (
        <div className="flex flex-col items-center w-full animate-fade-in">
          <p className="text-center font-bold text-slate-600 mb-6 text-lg">Memorize all the objects on the tray!</p>
          <div className="bg-amber-100 p-8 rounded-3xl border-4 border-amber-800 grid grid-cols-2 md:grid-cols-3 gap-6 w-full shadow-xl">
            {tray.map((it, i) => <div key={i} className="text-6xl flex justify-center animate-bounce-in" style={{animationDelay: `${i*0.1}s`}}>{it}</div>)}
          </div>
        </div>
      )}
      
      {phase === 'question' && (
        <div className="flex flex-col items-center w-full animate-fade-in">
          <p className="text-center font-bold text-amber-900 mb-2 text-xl">What was on the tray?</p>
          <p className="text-center font-medium text-slate-500 mb-6 text-sm">Select all the objects you remember seeing.</p>
          
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 w-full mb-8">
            {optionsGrid.map((opt, i) => {
              const isSelected = selectedItems.includes(opt);
              return (
                <button 
                  key={i} 
                  onClick={() => toggleSelection(opt)} 
                  className={`text-5xl p-4 rounded-2xl shadow-sm transition-all border-4 flex justify-center items-center h-24 ${
                    isSelected ? 'bg-amber-100 border-amber-600 scale-105' : 'bg-white border-transparent hover:border-amber-200'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          
          <button 
            onClick={submitAnswers}
            disabled={selectedItems.length === 0}
            className="w-full bg-emerald-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-xl"
          >
            Submit Answers
          </button>
        </div>
      )}

      {phase === 'result' && (
        <div className="text-center w-full flex flex-col items-center animate-bounce-in">
          {(() => {
            const correctCount = selectedItems.filter(i => tray.includes(i)).length;
            const missedCount = tray.length - correctCount;
            const falsePositives = selectedItems.filter(i => !tray.includes(i)).length;
            const isPerfect = missedCount === 0 && falsePositives === 0;
            
            return (
              <>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${isPerfect ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                   {isPerfect ? <CheckCircle2 className="w-16 h-16 text-emerald-600" /> : <Brain className="w-16 h-16 text-amber-600" />}
                </div>
                <h2 className={`text-3xl font-black mb-2 ${isPerfect ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {isPerfect ? 'Perfect Memory!' : 'Good Effort!'}
                </h2>
                
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 w-full mt-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-bold text-slate-600">Objects Found:</span>
                    <span className="font-black text-emerald-600">{correctCount} / {tray.length}</span>
                  </div>
                  {missedCount > 0 && (
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold text-slate-600">Missed Objects:</span>
                      <span className="font-black text-red-500">{missedCount}</span>
                    </div>
                  )}
                  {falsePositives > 0 && (
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold text-slate-600">Extra (Wrong):</span>
                      <span className="font-black text-orange-500">{falsePositives}</span>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
          <button onClick={onBack} className="mt-8 bg-emerald-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg active:scale-95 transition-all w-full">Back to Suite</button>
        </div>
      )}
    </PageContainer>
  );
};

// 5. CREATIVE CALM (Sandbox Coloring)
const CreativeCalmGame = ({ onBack, level, processTelemetry }) => {
  const [activeColor, setActiveColor] = useState('rgba(239, 68, 68, 0.5)'); // Semi-transparent
  const [startTime] = useState(Date.now());
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const palette = [
    'rgba(239, 68, 68, 0.5)', 'rgba(249, 115, 22, 0.5)', 'rgba(245, 158, 11, 0.5)', 'rgba(234, 179, 8, 0.5)', 
    'rgba(132, 204, 22, 0.5)', 'rgba(34, 197, 94, 0.5)', 'rgba(6, 182, 212, 0.5)', 'rgba(59, 130, 246, 0.5)', 
    'rgba(99, 102, 241, 0.5)', 'rgba(168, 85, 247, 0.5)', 'rgba(236, 72, 153, 0.5)', 'rgba(244, 63, 94, 0.5)'
  ];

  const handleFinish = () => {
    processTelemetry('CreativeCalm', 1000, 0, (Date.now() - startTime)/1000);
    onBack();
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent scrolling while drawing
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <PageContainer title="Creative Calm" level={level}>
      <div className="w-full flex flex-col justify-between items-center flex-1 bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 animate-fade-in">
        <div className="text-center mb-2">
          <p className="font-bold text-xl text-pink-700">Relax & Color</p>
          <p className="text-sm text-slate-500 font-medium">Use your finger to paint the drawing!</p>
        </div>
        
        {/* Canvas Area */}
        <div className="flex-1 w-full max-w-[320px] flex items-center justify-center relative my-4 bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-inner">
          <img 
            src="/image/Printable-Spring-Coloring-Pages.png" 
            alt="Coloring Page" 
            className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none opacity-80"
          />
          <canvas 
            ref={canvasRef}
            width={320}
            height={320}
            className="w-full h-full object-contain z-10 touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        
        {/* Color Palette */}
        <div className="w-full mt-auto">
          <p className="text-center text-slate-400 font-bold text-xs uppercase tracking-widest mb-3">Choose a Color</p>
          <div className="grid grid-cols-6 gap-2 justify-center mb-6">
            {palette.map((c) => (
              <button 
                key={c} 
                onClick={() => setActiveColor(c)}
                className={`w-10 h-10 rounded-full shadow-sm transition-all transform hover:scale-110 ${activeColor === c ? 'ring-4 ring-offset-2 ring-slate-800 scale-110' : 'ring-1 ring-slate-200'}`}
                style={{ backgroundColor: c.replace('0.5', '1') }}
              />
            ))}
          </div>
          
          <button onClick={handleFinish} className="w-full bg-pink-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> I'm Done
          </button>
        </div>
      </div>
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
                  if (cell === '1') bg = 'bg-emerald-600'; // Hedge / Wall
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
    if (activeGame === 'calm') return <CreativeCalmGame onBack={handleBack} level={gameLevels.calm} processTelemetry={processTelemetry} />;
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
