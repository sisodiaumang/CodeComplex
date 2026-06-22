'use client';

import React from 'react';
import { useArenaStore } from '@/store/useArenaStore';
import { Swords, Code, Server, Flame, Trophy, Loader2, X } from 'lucide-react';

export default function DashboardPage() {
  const { isSearching, startMatchmaking, cancelMatchmaking } = useArenaStore();

  // Mock static player profile data based on project guidelines
  const playerStats = {
    username: "CodeWarrior",
    globalRank: "#412",
    divisions: [
      { id: 'dsa', name: 'DSA Arena', rating: 1750, icon: Flame, color: '#FF6B35', desc: 'Core algorithms, complexity, & data structures' },
      { id: 'frontend', name: 'Frontend Arena', rating: 1450, icon: Code, color: '#2EC4B6', desc: 'Pixel-perfect UI development under time pressure' },
      { id: 'backend', name: 'Backend Arena', rating: 1620, icon: Server, color: '#F4A261', desc: 'Robust API engineering, optimization, & security' }
    ]
  };

  return (
    <div className="min-h-screen bg-[#14110F] text-[#F2E9DE] p-8 font-sans selection:bg-[#FF6B35]/30">
      
      {/* ─── ARENA HEADER BANNER ─── */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#34281F] pb-6 mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2EC4B6]">
            Competitive Division hub
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            Welcome back, <span className="text-[#FF6B35]">{playerStats.username}</span>
          </h1>
        </div>

        {/* Global Trophy Widget */}
        <div className="flex items-center gap-4 bg-[#1F1A16] border border-[#34281F] px-4 py-2 rounded-lg">
          <Trophy className="text-[#F4A261] h-5 w-5" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#A8978A]">Global Standings</div>
            <div className="text-sm font-mono font-bold text-[#F2E9DE]">{playerStats.globalRank}</div>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT HUB ─── */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {playerStats.divisions.map((arena) => {
          const IconComponent = arena.icon;
          
          return (
            <div 
              key={arena.id} 
              className="bg-[#1F1A16] border border-[#34281F] rounded-xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-[#34281F]/80 hover:translate-y-[-2px] shadow-xl"
            >
              <div>
                {/* Arena Pill Header */}
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="p-3 rounded-lg bg-[#14110F] border border-[#34281F]"
                    style={{ color: arena.color }}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8978A] block">ELO RATING</span>
                    <span className="font-mono text-xl font-bold text-[#F2E9DE]">{arena.rating}</span>
                  </div>
                </div>

                {/* Info block */}
                <h2 className="text-xl font-bold tracking-tight mb-2 text-[#F2E9DE]">{arena.name}</h2>
                <p className="text-xs text-[#A8978A] leading-relaxed mb-6">{arena.desc}</p>
              </div>

              {/* Action Button */}
              <button
                disabled={isSearching}
                onClick={() => startMatchmaking(arena.id as 'dsa' | 'frontend' | 'backend')}
                className="w-full py-3 rounded-lg font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 text-white bg-[#FF6B35] hover:bg-[#FF6B35]/90 shadow-lg shadow-[#FF6B35]/10"
              >
                <Swords className="h-4 w-4" />
                Find Match
              </button>
            </div>
          );
        })}
      </main>

      {/* ─── MATCHMAKING QUEUE OVERLAY MODAL ─── */}
      {isSearching && (
        <div className="fixed inset-0 bg-[#14110F]/90 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-[#1F1A16] border border-[#34281F] rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
            
            {/* Visual Radar Pulse Loop */}
            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#FF6B35]/10 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-[#FF6B35]/5 animate-pulse" />
              <div className="w-12 h-12 rounded-xl bg-[#14110F] border border-[#34281F] flex items-center justify-center text-[#FF6B35]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            </div>

            <h3 className="text-xl font-extrabold tracking-tight mb-1 text-[#F2E9DE]">Searching for Opponent</h3>
            <p className="text-xs text-[#A8978A] max-w-[240px] mx-auto mb-6">
              Matching your skill bracket against live competitors...
            </p>

            {/* Cancel Action Button */}
            <button
              onClick={cancelMatchmaking}
              className="px-4 py-2.5 rounded-lg border border-[#34281F] hover:bg-[#34281F] text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 mx-auto transition-colors text-[#A8978A] hover:text-[#F2E9DE]"
            >
              <X className="h-3.5 w-3.5" />
              Cancel Queue
            </button>
          </div>
        </div>
      )}

    </div>
  );
}