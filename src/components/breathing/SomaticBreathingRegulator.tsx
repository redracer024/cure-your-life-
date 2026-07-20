import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export default function SomaticBreathingRegulator() {
  const [cycle, setCycle] = useState<'inhale' | 'hold' | 'exhale' | 'hold-empty'>('inhale');
  const [seconds, setSeconds] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setCycle((current) => {
            switch (current) {
              case 'inhale': return 'hold';
              case 'hold': return 'exhale';
              case 'exhale': return 'hold-empty';
              case 'hold-empty': return 'inhale';
            }
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTheme = () => {
    switch (cycle) {
      case 'inhale': return { text: 'Inhale Prana', color: 'text-cyan-400', bg: 'bg-cyan-500/20', scale: 'scale-[1.3]' };
      case 'hold': return { text: 'Lock Vagal Hold', color: 'text-purple-400', bg: 'bg-purple-500/20', scale: 'scale-[1.3]' };
      case 'exhale': return { text: 'Exhale Trauma', color: 'text-emerald-400', bg: 'bg-emerald-500/20', scale: 'scale-[0.8]' };
      case 'hold-empty': return { text: 'Somatic Stillness', color: 'text-slate-500', bg: 'bg-slate-500/10', scale: 'scale-[0.8]' };
    }
  };

  const theme = getTheme();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/30 via-black/80 to-[#05070B] border border-emerald-400/25 p-6 md:p-7 rounded-[2rem] space-y-5 shadow-[0_0_45px_rgba(16,185,129,0.12)] backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-48 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
      
      <div className="flex items-center justify-between font-mono pb-2 border-b border-white/5">
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 uppercase font-black">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Somatic Breathing Regulator</span>
        </div>
        <span className="text-[8px] bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-wider">
          CO2 Tolerance Bio-Hack
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
        {/* Animated lung image synced to the breathing cycle */}
        <div className="relative w-full md:w-80 h-56 flex items-center justify-center bg-black/35 border border-emerald-400/15 rounded-[1.75rem] overflow-hidden shrink-0 shadow-[inset_0_0_28px_rgba(255,255,255,0.025),0_0_34px_rgba(16,185,129,0.10)] premium-3d-card">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(45,212,191,0.16),transparent_38%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(45,212,191,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(45,212,191,0.04)_1px,transparent_1px)] bg-[size:22px_22px] opacity-35 pointer-events-none" />

          <div className={`absolute w-40 h-40 rounded-full blur-3xl transition-all duration-[4000ms] ${theme.bg} ${theme.scale}`} />

          <img
            src="/reset-art/lungs.png"
            alt=""
            aria-hidden="true"
            className={`relative z-10 max-h-[205px] w-auto object-contain saturate-125 contrast-110 drop-shadow-[0_0_38px_rgba(45,212,191,0.72)] transition-all duration-[4000ms] ${
              cycle === 'inhale'
                ? 'scale-[1.20] opacity-100 brightness-125'
                : cycle === 'hold'
                  ? 'scale-[1.04] opacity-95 brightness-105'
                  : cycle === 'exhale'
                    ? 'scale-[0.82] opacity-72 brightness-85'
                    : 'scale-[0.88] opacity-72 brightness-85'
            }`}
          />

          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-950/25 px-3 py-1">
            <span className={`h-2 w-2 rounded-full ${
              cycle === 'inhale' ? 'bg-cyan-300' :
              cycle === 'hold' ? 'bg-purple-300' :
              cycle === 'exhale' ? 'bg-emerald-300' : 'bg-slate-400'
            } animate-pulse`} />
            <span className={`text-[10px] font-mono tracking-widest font-black uppercase ${theme.color}`}>{seconds}s</span>
          </div>
        </div>

        {/* Instructions and benefits */}
        <div className="space-y-3 flex-1 text-left">
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold">CURRENT SOMATIC TASK</span>
            <h4 className={`text-lg font-black uppercase tracking-tight ${theme.color} transition-colors duration-300`}>{theme.text}</h4>
            <p className="text-xs text-slate-400 leading-7 font-sans font-light">
              Box breathing triggers your vagus nerve to release acetylcholine, immediately lowering heart rate and signaling your cells that they are safe in the present moment.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-white/[0.035] p-3 rounded-2xl border border-white/10 shadow-[inset_0_0_18px_rgba(255,255,255,0.025)]">
              <span className="text-[8px] font-mono text-cyan-400 block font-bold uppercase mb-0.5">Physical Effect</span>
              <span className="text-[10px] text-slate-300 font-sans block leading-7">Longer exhales can help shift the nervous system toward parasympathetic recovery and reduce perceived threat</span>
            </div>
            <div className="bg-white/[0.035] p-3 rounded-2xl border border-white/10 shadow-[inset_0_0_18px_rgba(255,255,255,0.025)]">
              <span className="text-[8px] font-mono text-purple-400 block font-bold uppercase mb-0.5">Lung Emotion</span>
              <span className="text-[10px] text-slate-300 font-sans block leading-7">Releases the muscular shield to regain true autonomy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
