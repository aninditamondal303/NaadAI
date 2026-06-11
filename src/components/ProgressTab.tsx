/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, 
  Tooltip, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { Award, Flame, Hourglass, Bookmark, Compass, Sparkles } from 'lucide-react';

export const ProgressTab: React.FC = () => {
  // Practice hours dataset
  const weeklyPracticeData = [
    { day: "Mon", hours: 1.2, sessions: 2 },
    { day: "Tue", hours: 0.8, sessions: 1 },
    { day: "Wed", hours: 1.5, sessions: 3 },
    { day: "Thu", hours: 2.0, sessions: 4 },
    { day: "Fri", hours: 1.1, sessions: 2 },
    { day: "Sat", hours: 2.4, sessions: 3 },
    { day: "Sun", hours: 1.8, sessions: 2 },
  ];

  // Vocal microtone stability & accuracy over sessions
  const surAccuracyEvolutionData = [
    { session: "#1", accuracy: 76, deviation: 22 },
    { session: "#2", accuracy: 79, deviation: 19 },
    { session: "#3", accuracy: 82, deviation: 15 },
    { session: "#4", accuracy: 80, deviation: 16 },
    { session: "#5", accuracy: 85, deviation: 11 },
    { session: "#6", accuracy: 89, deviation: 9 },
    { session: "#7", accuracy: 88, deviation: 8 },
    { session: "#8", accuracy: 91, deviation: 6 },
    { session: "#9", accuracy: 94, deviation: 4 },
    { session: "#10", accuracy: 93, deviation: 5 }
  ];

  // Frequency range extension (Low limit is stable, high boundary expands over days)
  const rangeExtensionData = [
    { age: "Day 1", lowNote: 130.81, lowLabel: "C3", highNote: 523.25, highLabel: "C5" },
    { age: "Day 10", lowNote: 130.81, lowLabel: "C3", highNote: 587.33, highLabel: "D5" },
    { age: "Day 20", lowNote: 130.81, lowLabel: "C3", highNote: 659.25, highLabel: "E5" },
    { age: "Day 30", lowNote: 110.00, lowLabel: "A2", highNote: 698.46, highLabel: "F5" },
    { age: "Day 40", lowNote: 110.00, lowLabel: "A2", highNote: 783.99, highLabel: "G5" }
  ];

  return (
    <div className="space-y-6">
      
      {/* Visual Stats Summary Bento Rows */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Stat 1: Total Riyaz Hours */}
        <div className="bg-[#151A2E] p-4 rounded-xl border border-slate-800/80 shadow-lg flex items-center gap-4">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#FBBF24]">
            <Hourglass className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Total Riyaz Hours</span>
            <span className="text-2xl font-black font-mono text-slate-200">10.8 <span className="text-xs text-slate-400 font-semibold uppercase">hrs</span></span>
          </div>
        </div>

        {/* Stat 2: Active Streak */}
        <div className="bg-[#151A2E] p-4 rounded-xl border border-slate-800/80 shadow-lg flex items-center gap-4">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-orange-950/20 border border-orange-700/30 flex items-center justify-center text-orange-400">
            <Flame className="h-5 w-5 fill-current animate-bounce" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Practice Streak</span>
            <span className="text-2xl font-black font-mono text-orange-400">14 <span className="text-xs text-slate-400 font-semibold uppercase font-sans">Days</span></span>
          </div>
        </div>

        {/* Stat 3: Total Sessions */}
        <div className="bg-[#151A2E] p-4 rounded-xl border border-slate-800/80 shadow-lg flex items-center gap-4">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-[#38BDF8]/20 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
            <Bookmark className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Logged Sessions</span>
            <span className="text-2xl font-black font-mono text-slate-200">17</span>
          </div>
        </div>

        {/* Stat 4: Raga Mastery Index */}
        <div className="bg-[#151A2E] p-4 rounded-xl border border-slate-800/80 shadow-lg flex items-center gap-4">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-950/25 border border-emerald-700/30 flex items-center justify-center text-emerald-400">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Ragas Attempted</span>
            <span className="text-2xl font-black font-mono text-slate-200">6 <span className="text-xs text-slate-500 font-sans font-normal">of 84+</span></span>
          </div>
        </div>

      </div>

      {/* Main Charts double column block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Chart A: Shuddha Swara Audition Accuracy over trials */}
        <div className="bg-[#151A2E] p-5 rounded-2xl border border-slate-850/80 shadow-xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-200 font-sans tracking-wide">Swara Cent Deviation Accuracy</h4>
            <span className="text-[10px] font-mono text-slate-500">Stability percentage and cent drift reduction across the last 10 practice takes</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={surAccuracyEvolutionData} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b/30" />
                <XAxis dataKey="session" tick={{ fill: '#64748b', fontSize: 9 }} />
                <YAxis domain={[50, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F1115', borderColor: '#334155', borderRadius: '12px', fontSize: 11 }} />
                <Area type="monotone" name="Swar Accuracy (%)" dataKey="accuracy" stroke="#7C3AED" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAcc)" />
                <Line type="monotone" name="Dev Drifts (Cents)" dataKey="deviation" stroke="#38BDF8" strokeWidth={1.5} dot />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Practice Volume (BPM representation of Hours) */}
        <div className="bg-[#151A2E] p-5 rounded-2xl border border-slate-850/80 shadow-xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-200 font-sans tracking-wide">Riyāz Volume Schedule</h4>
            <span className="text-[10px] font-mono text-slate-500">Practice duration workload and trial frequencies logged during the last 7 days</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyPracticeData} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b/30" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 9 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F1115', borderColor: '#334155', borderRadius: '12px', fontSize: 11 }} />
                <Bar name="Clocked Hours" dataKey="hours" fill="#38BDF8" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart C: Vocal Range Growth */}
        <div className="lg:col-span-2 bg-[#151A2E] p-5 rounded-2xl border border-slate-850/80 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1">
            <div>
              <h4 className="text-sm font-bold text-slate-200 font-sans tracking-wide">Vocal Range & Saptak Growth (Pitch Reach)</h4>
              <span className="text-[10px] font-mono text-slate-500">Sustained musical limits mapping frequency expansion over 40-day periodic development</span>
            </div>
            <div className="flex gap-2 text-[9px] font-mono uppercase bg-[#0F1115] px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-[#38BDF8] font-bold">Stable Base: C3 (male)</span>
              <span className="text-slate-500">•</span>
              <span className="text-[#FBBF24] font-bold">Target reach: G5 (vocal range ceiling)</span>
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rangeExtensionData} margin={{ left: -10, right: 15, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b/30" />
                <XAxis dataKey="age" tick={{ fill: '#64748b', fontSize: 9 }} />
                <YAxis unit="Hz" tick={{ fill: '#64748b', fontSize: 9 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F1115', borderColor: '#334155', borderRadius: '12px', fontSize: 11 }} />
                <Line type="monotone" name="High Saptak Boundary (Hz)" dataKey="highNote" stroke="#FBBF24" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                <Line type="monotone" name="Low Saptak Boundary (Hz)" dataKey="lowNote" stroke="#38BDF8" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
