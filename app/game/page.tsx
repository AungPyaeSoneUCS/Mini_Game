// file: app/game/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

// Mapping exactly to your folder structure
const GAMES = [
  {
    id: "endless-runner",
    name: "Endless Runner",
    path: "/game/EndlessRunner",
    description: "Jump, double-jump, and survive the accelerating neon grid.",
    icon: "🏃‍♂️",
    color: "from-emerald-400 to-cyan-400",
    shadow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]",
    border: "hover:border-emerald-500",
  },
  {
    id: "game-2048",
    name: "Neon 2048",
    path: "/game/Game2048",
    description: "Merge numbered tiles into a glowing 2048 with swipes or arrow keys.",
    icon: "🔢",
    color: "from-amber-400 to-rose-500",
    shadow: "hover:shadow-[0_0_30px_rgba(251,191,36,0.4)]",
    border: "hover:border-amber-500",
  },
  {
    id: "simon-says",
    name: "Simon Says",
    path: "/game/SimonSays",
    description: "Watch the light sequence, repeat it, and survive every escalating round.",
    icon: "🔔",
    color: "from-emerald-400 via-cyan-400 to-fuchsia-500",
    shadow: "hover:shadow-[0_0_30px_rgba(52,211,153,0.4)]",
    border: "hover:border-cyan-500",
  },
  {
    id: "full-stack-flash",
    name: "Full-Stack Flash",
    path: "/game/FullStackFlash",
    description: "Rapid-fire technical quiz testing modern web development knowledge.",
    icon: "⚡",
    color: "from-cyan-400 to-purple-500",
    shadow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]",
    border: "hover:border-purple-500",
  },
  {
    id: "guess-puzzle",
    name: "Life Hacker",
    path: "/game/GuessPuzzle",
    description: "Decode 100 levels of daily life challenges before time runs out.",
    icon: "🔐",
    color: "from-rose-400 to-orange-400",
    shadow: "hover:shadow-[0_0_30px_rgba(244,63,94,0.4)]",
    border: "hover:border-rose-500",
  },
  {
    id: "memory-match",
    name: "Neon Match",
    path: "/game/MemoryMatch",
    description: "Synchronize memory arrays by finding matching data modules.",
    icon: "🧠",
    color: "from-violet-400 to-fuchsia-400",
    shadow: "hover:shadow-[0_0_30px_rgba(167,139,250,0.4)]",
    border: "hover:border-violet-500",
  },
  {
    id: "myanmar-typing",
    name: "Myanmar Typing",
    path: "/game/MyanmarTyping",
    description: "Master Myanmar Unicode typing speed and accuracy.",
    icon: "⌨️",
    color: "from-amber-400 to-yellow-500",
    shadow: "hover:shadow-[0_0_30px_rgba(251,191,36,0.4)]",
    border: "hover:border-amber-500",
  },
  {
    id: "neon-breakout",
    name: "Neon Breakout",
    path: "/game/NeonBreakout",
    description: "Shatter the firewall blocks with dynamic ball physics.",
    icon: "🧱",
    color: "from-cyan-400 to-blue-500",
    shadow: "hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]",
    border: "hover:border-cyan-500",
  },
  {
    id: "neon-outpost",
    name: "Neon Outpost",
    path: "/game/NeonOutpost",
    description: "Turn-based base building. Gather, defend, and survive the alien swarm.",
    icon: "🏢",
    color: "from-fuchsia-500 to-cyan-500",
    shadow: "hover:shadow-[0_0_30px_rgba(217,70,239,0.4)]",
    border: "hover:border-fuchsia-500",
  },
  {
    id: "neon-pong",
    name: "Neon Pong",
    path: "/game/NeonPong",
    description: "The retro classic reimagined for the modern arcade.",
    icon: "🏓",
    color: "from-fuchsia-400 to-pink-500",
    shadow: "hover:shadow-[0_0_30px_rgba(232,121,249,0.4)]",
    border: "hover:border-fuchsia-500",
  },
  {
    id: "neon-snake",
    name: "Neon Snake",
    path: "/game/NeonSnake",
    description: "Classic snake mechanics with cyberpunk visuals and speed scaling.",
    icon: "🐍",
    color: "from-green-400 to-emerald-500",
    shadow: "hover:shadow-[0_0_30px_rgba(52,211,153,0.4)]",
    border: "hover:border-green-500",
  },
  {
    id: "neon-tic-tac-toe",
    name: "Neon TTT",
    path: "/game/NeonTicTacToe",
    description: "Challenge a smart AI or a friend in glowing grid combat.",
    icon: "❌",
    color: "from-cyan-400 to-pink-500",
    shadow: "hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]",
    border: "hover:border-pink-500",
  },
  {
    id: "sliding-tile",
    name: "Sliding Puzzle",
    path: "/game/SlidingTilePuzzle",
    description: "Test your logic by sliding tiles back into perfect order.",
    icon: "🧩",
    color: "from-blue-400 to-indigo-500",
    shadow: "hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]",
    border: "hover:border-indigo-500",
  },
  {
    id: "sys-breach",
    name: "Sys Breach",
    path: "/game/SysBreach",
    description: "A deckbuilder roguelike. Deploy combat algorithms to crack ICE.",
    icon: "🃏",
    color: "from-red-400 to-rose-600",
    shadow: "hover:shadow-[0_0_30px_rgba(225,29,72,0.4)]",
    border: "hover:border-rose-500",
  },
];

export default function GameMenu() {
  const [mounted, setMounted] = useState(false);

  // Trigger entrance animations after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans overflow-hidden selection:bg-cyan-500/30">

      {/* Background Animated Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 animate-[pulse_4s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24">

        {/* Game Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {GAMES.map((game, index) => (
            <Link 
              href={game.path} 
              key={game.id}
              className={`group relative flex flex-col p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm transition-all duration-500 ease-out transform ${
                mounted 
                  ? "translate-y-0 opacity-100" 
                  : "translate-y-16 opacity-0"
              } ${game.border} ${game.shadow} hover:-translate-y-2`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >

              {/* Card Hover Gradient Background Effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

              {/* Icon & Title */}
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <span className="text-2xl">{game.icon}</span>
                </div>
                <h2 className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${game.color}`}>
                  {game.name}
                </h2>
              </div>

              {/* Description */}
              <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-grow relative z-10">
                {game.description}
              </p>

              {/* Action Button */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800/50 relative z-10">
                <span className="text-xs font-bold tracking-widest text-slate-500 uppercase group-hover:text-slate-300 transition-colors">
                  Initialize
                </span>
                <svg 
                  className="w-5 h-5 text-slate-600 group-hover:text-white transform group-hover:translate-x-1 transition-all" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer connected to Sub-Pages */}
        <div 
          className={`mt-24 pb-8 flex flex-col items-center justify-center gap-8 text-center transition-all duration-1000 delay-700 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Quick Links Row */}
          <div className="flex flex-wrap items-center justify-center gap-4">

            {/* AI Chat Link */}
            <Link 
              href="/game/AIChat"
              className="inline-flex items-center px-5 sm:px-6 py-2 rounded-full border border-purple-500/30 bg-purple-950/20 text-purple-500/80 hover:text-purple-400 hover:border-purple-400 hover:bg-purple-950/40 text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95"
            >
              <span className="mr-2">🤖</span> AI Chat
            </Link>

            {/* QR Generator Link */}
            <Link 
              href="/game/QR"
              className="inline-flex items-center px-5 sm:px-6 py-2 rounded-full border border-rose-500/30 bg-rose-950/20 text-rose-500/80 hover:text-rose-400 hover:border-rose-400 hover:bg-rose-950/40 text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] active:scale-95"
            >
              <span className="mr-2">🔳</span> QR Generator
            </Link>

            {/* Owner Link */}
            <Link 
              href="https://github.com/AungPyaeSoneUCS"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-5 sm:px-6 py-2 rounded-full border border-amber-500/30 bg-amber-950/20 text-amber-500/80 hover:text-amber-400 hover:border-amber-400 hover:bg-amber-950/40 text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95"
            >
              <span className="mr-2">👤</span> Owner
            </Link>

          </div>
          
          {/* Copyright Signature */}
          <Link
            href="https://github.com/AungPyaeSoneUCS"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono tracking-widest text-slate-600 transition-colors hover:text-amber-400"
          >
            © {new Date().getFullYear()} AungPyaeSoneUCS
          </Link>
        </div>

      </div>
    </div>
  );
}