/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { Award, Compass, Music, Shield, AwardIcon, Sparkles } from 'lucide-react';

export const ProfileTab: React.FC = () => {
  // Musical profile DNA parameters
  const dnaRadarData = [
    { attribute: "Sur Stability", value: 89, max: 100 },
    { attribute: "Voice Range", value: 78, max: 100 },
    { attribute: "Taal Precision", value: 74, max: 100 },
    { attribute: "Riyaz Rhythm", value: 95, max: 100 },
    { attribute: "Ornament (Gamak)", value: 68, max: 100 },
    { attribute: "Melodic Purity", value: 87, max: 100 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Title Panel */}
      <div className="bg-[#151A2E] p-6 rounded-2xl border border-[#7C3AED]/40 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-[#7C3AED]/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-serif">
            <Sparkles className="h-5.5 w-5.5 text-[#FBBF24]" />
            Musical DNA Portrait
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            A comprehensive, microtonally auditory record modeling your classical vocalist twin metrics, saptak coverage boundaries, and stylistic ornament capacities.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-mono text-slate-500 block">PRACTITIONER STANDING</span>
          <span className="text-xs font-mono font-bold text-[#FBBF24] uppercase tracking-wide">Madhyama Shishya</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Column A: Interactive Radar Chart (6 axes) */}
        <div className="lg:col-span-5 bg-[#151A2E] p-5 rounded-2xl border border-slate-850 shadow-lg flex flex-col justify-between">
          <div className="space-y-1 pb-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">DNA Capability Radar</h3>
            <span className="text-[10px] text-slate-500">Live model tracking vocal calibration levels</span>
          </div>

          <div className="h-64 flex items-center justify-center relative select-none">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={dnaRadarData}>
                <PolarGrid stroke="#334155/65" />
                <PolarAngleAxis dataKey="attribute" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 7 }} />
                <Radar 
                  name="Vocal Twin" 
                  dataKey="value" 
                  stroke="#7C3AED" 
                  fill="#7C3AED" 
                  fillOpacity={0.35} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-4 border-t border-slate-850/60 text-center text-[10px] font-mono text-slate-500">
            Computed from 17 integrated practice metrics
          </div>
        </div>

        {/* Column B: Musical Fingerprint Card */}
        <div className="lg:col-span-7 bg-[#151A2E] p-5 rounded-2xl border border-slate-850 shadow-lg space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">Vocal Identity Scroll</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            <div className="bg-[#0f1115]/60 p-3.5 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Vocal Reach Limit</span>
              <span className="text-slate-200 font-bold block text-sm">C3 to G5 (2.5 Octaves)</span>
              <span className="text-[9.5px] text-slate-500 block">Sustained reach: Madhya & Taar Saptak</span>
            </div>

            <div className="bg-[#0f1115]/60 p-3.5 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Preferred Octave Register</span>
              <span className="text-slate-200 font-bold block text-sm">Madhya Saptak (Mid Pitch)</span>
              <span className="text-[9.5px] text-slate-500 block">Most resonant and stable vowel space</span>
            </div>

            <div className="bg-[#0f1115]/60 p-3.5 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[9px] font-mono text-rose-500 uppercase block font-bold flex items-center gap-1">Strongest Swaras</span>
              <span className="text-[#38BDF8] font-bold block text-sm">Gandhar (G) • Pancham (P) • Madhyam (m)</span>
              <span className="text-[9.5px] text-slate-550 block">Flawless cent holding with 93% stability</span>
            </div>

            <div className="bg-[#0f1115]/60 p-3.5 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Weakest Swaras</span>
              <span className="text-rose-400 font-bold block text-sm">Komal Re (r) • Komal Dha (d)</span>
              <span className="text-[9.5px] text-slate-550 block">Requires deeper microtonal oscillation discipline</span>
            </div>

            <div className="bg-[#0f1115]/60 p-3.5 rounded-xl border border-slate-900 space-y-1 col-span-full">
              <span className="text-[9px] font-mono text-[#FBBF24] uppercase block font-bold">Dominant Thāat Family Affinity</span>
              <span className="text-slate-200 font-bold block text-sm">Kalyan Thāat (Yaman, Shuddh Kalyan, Yaman Kalyan)</span>
              <span className="text-[9.5px] text-slate-500 block">Strongest classical grammar validation score (96% accuracy holding)</span>
            </div>

          </div>

          {/* Pedigree Stamp box */}
          <div className="p-3 bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-xl flex items-center gap-3">
            <div className="h-9 w-9 bg-[#7C3AED]/30 rounded-lg flex items-center justify-center text-[#FBBF24] shrink-0 font-bold text-sm">ॐ</div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Your voice registers high natural harmonic resonance. Sustaining low Sa (Kharaj) for 10 minutes at dawn will further stabilize Komal Re pitches.
            </p>
          </div>

        </div>

      </div>

      {/* Growth Timeline block */}
      <div className="bg-[#151A2E] p-6 rounded-2xl border border-slate-850 shadow-lg space-y-5">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">Vocal Growth Millestones</h3>
        <div className="relative border-l-2 border-[#7C3AED]/35 pl-5 ml-4 space-y-6">
          
          <div className="relative">
            <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full bg-[#38BDF8] border-2 border-[#151A2E]" />
            <h4 className="text-xs font-bold text-slate-200">Phase 4: Riyāz Journal and Drone Integration (Today)</h4>
            <span className="text-[10px] font-mono text-slate-500">Active - June 11, 2026</span>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
              Successfully matched sequenced wood drone synthesizer plucks with real time vocal journal logs. Stabilized base frequency standard.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full bg-[#7C3AED] border-2 border-[#151A2E]" />
            <h4 className="text-xs font-bold text-slate-250">Phase 3: Komal Swara Oscillation calibration (Andolan)</h4>
            <span className="text-[10px] font-mono text-slate-500">Completed - June 8, 2026</span>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
              Passed primary morning Bhairav Komal Rishabh oscillation trials. Reached peak sur accuracy of 89%.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full bg-slate-700 border-2 border-[#151A2E]" />
            <h4 className="text-xs font-bold text-slate-300">Phase 2: Yaman Scale Cleansing</h4>
            <span className="text-[10px] font-mono text-slate-500">Completed - June 5, 2026</span>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
              Validated Tivra Madhyam avoiding accidental standard notes. Retained Yaman aroha scale alignment of 86%.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full bg-slate-700 border-2 border-[#151A2E]" />
            <h4 className="text-xs font-bold text-slate-350">Phase 1: Scale Calibration established</h4>
            <span className="text-[10px] font-mono text-slate-500">Completed - June 1, 2026</span>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
              Calculated throat volume parameters. Settled base Sa tonic at C# (138.59 Hz) under Gharana standards.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
