/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DigitalTwinState, TooltipProps } from '../types';

interface VocalTwinRadarProps {
  profileState: DigitalTwinState;
  currentTheme?: "peacock" | "sunset" | "monsoon";
  currentAttempt?: {
    surAccuracy: number;
    taalPrecision: number;
    layaStability: number;
    raagGrammar: number;
    voiceControlGamak: number;
  };
}

export const VocalTwinRadar: React.FC<VocalTwinRadarProps> = ({ profileState, currentTheme, currentAttempt }) => {
  // Map our persistent twin indexes to standard attributes for comparison
  const data = [
    {
      attribute: 'Sur Accuracy',
      currentPerformance: currentAttempt ? currentAttempt.surAccuracy : 75,
      digitalTwinBaseline: Math.round(profileState.runningScores.cumulativeSurAccuracy),
    },
    {
      attribute: 'Taal Precision',
      currentPerformance: currentAttempt ? currentAttempt.taalPrecision : 65,
      digitalTwinBaseline: Math.round(profileState.runningScores.cumulativeTaalStability),
    },
    {
      attribute: 'Laya Stability',
      currentPerformance: currentAttempt ? currentAttempt.layaStability : 70,
      digitalTwinBaseline: Math.round(profileState.runningScores.cumulativeTaalStability * 1.15),
    },
    {
      attribute: 'Raag Grammar',
      currentPerformance: currentAttempt ? currentAttempt.raagGrammar : 80,
      digitalTwinBaseline: Math.round(profileState.vocalProfile.timbreStabilityIndex * 100),
    },
    {
      attribute: 'Voice Control/Gamak',
      currentPerformance: currentAttempt ? currentAttempt.voiceControlGamak : 60,
      digitalTwinBaseline: Math.round(profileState.stylisticFingerprint.meendExecutionFluidity * 100),
    },
  ];

  // Custom tooltips to integrate seamless design theme styling
  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-xl backdrop-blur-md">
          <p className="font-mono text-xs font-semibold text-slate-300">{payload[0].payload.attribute}</p>
          <div className="mt-1.5 space-y-0.5">
            <p className="text-xs flex justify-between gap-4 font-mono">
              <span className="text-purple-400">Current Laya:</span>
              <span className="font-bold">{payload[0].value}%</span>
            </p>
            <p className="text-xs flex justify-between gap-4 font-mono">
              <span className="text-cyan-400">Vocal Twin Core:</span>
              <span className="font-bold">{payload[1].value}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="vocal-twin-radar-card" className="w-full h-full bg-slate-950 p-3 rounded-xl border border-slate-800/80 shadow-xl flex flex-col justify-between">
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100 font-sans tracking-wide">Vocal Twin Overlay Metrics</h3>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider bg-purple-900/40 text-purple-300 border border-purple-800/60 uppercase">
            Telemetry Overlap
          </span>
        </div>
        <p className="text-xs text-slate-400">Real-time spectral feedback mapped against your mathematical AI digital twin.</p>
      </div>

      <div className="flex-grow w-full min-h-[250px] relative mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis 
              dataKey="attribute" 
              stroke="#94a3b8" 
              tick={{ fontSize: 10, fontWeight: 500 }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              stroke="#475569" 
              tick={{ fontSize: 9 }} 
              axisLine={false}
            />
            <Radar 
              name="Current Attempt" 
              dataKey="currentPerformance" 
              stroke="#c084fc" 
              fill="#c084fc" 
              fillOpacity={0.25} 
            />
            <Radar 
              name="Vocal Twin Baseline" 
              dataKey="digitalTwinBaseline" 
              stroke="#22d3ee" 
              fill="#22d3ee" 
              fillOpacity={0.06} 
              strokeDasharray="4 4" 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconSize={8}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500 font-mono">
        <span>TWIN CLOUD ID: {profileState.digitalTwinId}</span>
        <span>STREAK: {profileState.runningScores.riyazStreakDays} DAYS</span>
      </div>
    </div>
  );
};
