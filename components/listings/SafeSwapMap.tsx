'use client'

import { useState } from 'react'
import { motion } from 'motion/react'

export interface SafeSwapSpot {
  id: string
  name: string
  description: string
  bestHours: string
  safetyLevel: 'Maximum (High Traffic)' | 'Excellent (Surveilled)' | 'Standard (Open Yard)'
  x: number // SVG percentage coordinate X
  y: number // SVG percentage coordinate Y
}

export const SAFE_SWAP_SPOTS: SafeSwapSpot[] = [
  {
    id: 'sub',
    name: 'SUB Frontage (Student Union Building)',
    description: 'The liveliest spot on campus, directly in front of the Student Union Building. Excellent for general exchanges due to high student foot traffic and natural visibility.',
    bestHours: '08:00 AM - 06:00 PM',
    safetyLevel: 'Maximum (High Traffic)',
    x: 30,
    y: 45,
  },
  {
    id: 'library',
    name: 'University Library Lobby',
    description: 'Highly secure, indoor library environment with campus security officers stationed nearby. Ideal for physical checks of gadgets or textbooks in a quiet space.',
    bestHours: '08:00 AM - 04:00 PM',
    safetyLevel: 'Excellent (Surveilled)',
    x: 70,
    y: 35,
  },
  {
    id: 'portal',
    name: 'Portal Complex Plaza',
    description: 'An open commercial walkway zone close to banking blocks, university security posts, and main roads. Offers optimal accessibility.',
    bestHours: '08:00 AM - 05:00 PM',
    safetyLevel: 'Maximum (High Traffic)',
    x: 50,
    y: 75,
  },
]

export default function SafeSwapMap({ className = '' }: { className?: string }) {
  const [selectedSpot, setSelectedSpot] = useState<SafeSwapSpot>(SAFE_SWAP_SPOTS[0])

  return (
    <div className={`border border-border/80 bg-surface/40 backdrop-blur-md rounded-xl p-5 space-y-4 shadow-xl ${className}`}>
      <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-indigo" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446l6.002-3.461a1.124 1.124 0 00.502-.96V3.829a1.125 1.125 0 00-1.626-1.002L15 5.25 9 2.25 3.626 5.332A1.125 1.125 0 003 6.334v11.846c0 .402.213.771.557.973L9 22.5l6-3.25 5.503 3.446z" />
          </svg>
          <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
            EKSU Safe-Swap Meetup Zones
          </span>
        </div>
        <span className="text-[9px] font-mono font-bold text-brand-mint border border-brand-mint/20 bg-brand-mint/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Verified Safe Spots
        </span>
      </div>

      <p className="text-[11px] text-subtle leading-relaxed font-mono">
        Avoid meeting in secluded or off-campus areas. Select a safe-swap spot below to view recommendations:
      </p>

      {/* SVG Stylized Interactive Map */}
      <div className="relative w-full aspect-[2/1] bg-canvas border border-border/60 rounded-xl overflow-hidden shadow-inner">
        {/* Schematic Grid Lines */}
        <svg className="absolute inset-0 w-full h-full text-border/20" stroke="currentColor" strokeWidth="0.5">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Schematic roads/buildings */}
        <svg className="absolute inset-0 w-full h-full text-subtle/10" fill="none" stroke="currentColor" strokeWidth="2">
          {/* Main Road */}
          <path d="M 0,100 Q 150,80 250,100 T 500,100" strokeWidth="6" strokeLinecap="round" />
          {/* Loop Road */}
          <ellipse cx="250" cy="100" rx="140" ry="60" strokeWidth="2" strokeDasharray="5,5" />
          {/* Admin Block representation */}
          <rect x="220" y="20" width="60" height="30" rx="3" fill="currentColor" strokeWidth="1" />
          {/* Library representation */}
          <rect x="330" y="55" width="40" height="35" rx="3" fill="currentColor" strokeWidth="1" />
          {/* SUB representation */}
          <rect x="130" y="60" width="45" height="30" rx="3" fill="currentColor" strokeWidth="1" />
          {/* Portal Plaza representation */}
          <rect x="230" y="140" width="50" height="35" rx="3" fill="currentColor" strokeWidth="1" />
        </svg>

        {/* Text Labels */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono font-extrabold text-subtle/50 uppercase tracking-widest pointer-events-none">
          EKSU MAIN CAMPUS REPRESENTATION
        </div>
        <div className="absolute top-[12%] left-[45%] text-[8px] font-mono font-bold text-subtle/40 pointer-events-none">
          ADMIN BLOCK
        </div>

        {/* Spot hotpins */}
        {SAFE_SWAP_SPOTS.map((spot) => {
          const isActive = selectedSpot.id === spot.id
          return (
            <button
              key={spot.id}
              onClick={() => setSelectedSpot(spot)}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer focus:outline-none"
            >
              {/* Pulse Ring */}
              <span className={`absolute inset-0 w-8 h-8 -left-2.5 -top-2.5 rounded-full animate-ping opacity-40 transition-all ${
                isActive ? 'bg-brand-mint' : 'bg-brand-indigo group-hover:bg-brand-mint'
              }`} />
              
              {/* Outer circle */}
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border shadow-md transition-all scale-100 group-hover:scale-125 ${
                isActive 
                  ? 'bg-brand-mint border-canvas text-black' 
                  : 'bg-brand-indigo border-border text-white'
              }`}>
                {/* Center dot */}
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              {/* Tooltip on hover */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-surface-lowest border border-border px-2 py-0.5 rounded-md text-[8px] font-mono font-bold text-primary pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                {spot.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Spot Description Detail Tab */}
      <motion.div
        key={selectedSpot.id}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-low border border-border/40 p-4 rounded-xl space-y-3 font-mono text-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/20 pb-2">
          <span className="font-bold text-primary text-sm">{selectedSpot.name}</span>
          <span className={`text-[9px] font-bold uppercase ${
            selectedSpot.safetyLevel.startsWith('Maximum') ? 'text-brand-mint' : 'text-brand-indigo'
          }`}>
            Safety: {selectedSpot.safetyLevel}
          </span>
        </div>

        <p className="text-subtle text-[11px] leading-relaxed font-sans">{selectedSpot.description}</p>

        <div className="grid grid-cols-2 gap-4 pt-1 text-[10px] text-muted">
          <div>
            <span className="text-[9px] uppercase font-bold text-subtle block">Best Swap Hours</span>
            <span className="text-primary font-bold">{selectedSpot.bestHours}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-subtle block">Surveillance Spot</span>
            <span className="text-brand-mint font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-mint animate-pulse" />
              Active Patrol Zone
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
