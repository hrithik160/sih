import React, { useState } from 'react';
import { Sparkles, Heart, CheckCircle2, ChevronRight, Volume2, X } from 'lucide-react';
import { useT } from './LanguageContext';
import { saveMoodCheckinLocal } from './db';

export default function PreGameCheckinModal({ onComplete, currentUser }) {
  const { t } = useT();
  const [step, setStep] = useState(1); // 1: Day, 2: Mood, 3: Completed
  const [dayRating, setDayRating] = useState(null);
  const [moodRating, setMoodRating] = useState(null);

  const dayOptions = [
    { id: 'great', labelKey: 'day_great', bg: 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100', icon: '🌟' },
    { id: 'good', labelKey: 'day_good', bg: 'bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100', icon: '🙂' },
    { id: 'okay', labelKey: 'day_okay', bg: 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100', icon: '😐' },
    { id: 'tough', labelKey: 'day_tough', bg: 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100', icon: '🙁' },
  ];

  const moodOptions = [
    { id: 'happy', labelKey: 'mood_happy', bg: 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100', icon: '😊' },
    { id: 'energetic', labelKey: 'mood_energetic', bg: 'bg-indigo-50 border-indigo-300 text-indigo-900 hover:bg-indigo-100', icon: '⚡' },
    { id: 'tired', labelKey: 'mood_tired', bg: 'bg-purple-50 border-purple-300 text-purple-900 hover:bg-purple-100', icon: '😴' },
    { id: 'anxious', labelKey: 'mood_anxious', bg: 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100', icon: '😟' },
  ];

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectDay = (opt) => {
    setDayRating(opt.id);
    speakText(t(opt.labelKey));
    setTimeout(() => setStep(2), 350);
  };

  const handleSelectMood = async (opt) => {
    setMoodRating(opt.id);
    speakText(t(opt.labelKey));
    await saveMoodCheckinLocal(dayRating, opt.id, currentUser?.email);
    setTimeout(() => setStep(3), 350);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-emerald-100 flex flex-col relative overflow-hidden select-none">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">
              <Heart className="w-5 h-5 fill-emerald-600 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-lg leading-tight">{t('checkin_title')}</h2>
              <p className="text-xs text-slate-400 font-medium">{t('step_of', { n: step > 2 ? 2 : step, total: 2 })}</p>
            </div>
          </div>
          <button 
            onClick={() => onComplete()}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100"
            title="Skip for now"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: How was your day? */}
        {step === 1 && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl p-3">
              <p className="font-bold text-amber-950 text-base flex-1">{t('q_day_title')}</p>
              <button onClick={() => speakText(t('q_day_title'))} className="text-amber-800 p-1.5 hover:bg-amber-100 rounded-xl">
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {dayOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectDay(opt)}
                  className={`border-2 rounded-2xl p-4 flex items-center justify-between font-bold text-lg transition-all active:scale-[0.98] shadow-sm ${opt.bg} ${dayRating === opt.id ? 'ring-4 ring-emerald-400 border-emerald-600' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{opt.icon}</span>
                    <span>{t(opt.labelKey)}</span>
                  </div>
                  <ChevronRight className="w-6 h-6 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Current Mood */}
        {step === 2 && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl p-3">
              <p className="font-bold text-blue-950 text-base flex-1">{t('q_mood_title')}</p>
              <button onClick={() => speakText(t('q_mood_title'))} className="text-blue-800 p-1.5 hover:bg-blue-100 rounded-xl">
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {moodOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectMood(opt)}
                  className={`border-2 rounded-2xl p-4 flex items-center justify-between font-bold text-lg transition-all active:scale-[0.98] shadow-sm ${opt.bg} ${moodRating === opt.id ? 'ring-4 ring-emerald-400 border-emerald-600' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{opt.icon}</span>
                    <span>{t(opt.labelKey)}</span>
                  </div>
                  <ChevronRight className="w-6 h-6 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Thank you Mascot Screen */}
        {step === 3 && (
          <div className="py-6 flex flex-col items-center text-center space-y-4 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center text-5xl shadow-md border-2 border-amber-300 animate-bounce">
              🐕
            </div>
            <div className="space-y-1">
              <span className="text-xs font-black uppercase text-amber-700 tracking-wider">{t('daily_spark')} ☀️</span>
              <h3 className="text-lg font-black text-slate-800 leading-snug">
                {currentUser?.name ? `Thank you, ${currentUser.name.split(' ')[0]}! Let's train your brain with some fun games!` : t('checkin_mascot_thanks')}
              </h3>
            </div>

            <button
              onClick={() => onComplete({ dayRating, moodRating })}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center space-x-2 transition-all active:scale-95 mt-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>{t('checkin_start_games')}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
