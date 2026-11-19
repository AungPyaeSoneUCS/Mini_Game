// file: app/game/Game2048/page.tsx

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Trophy, Keyboard, Smartphone } from "lucide-react";

type Direction = "up" | "down" | "left" | "right";
type Status = "playing" | "won" | "lost";

const SIZE = 4;
const CELLS = SIZE * SIZE;
const BEST_KEY = "neon-2048-best";

function emptyBoard(): number[] {
  return Array.from({ length: CELLS }, () => 0);
}

function addRandomTile(board: number[]): number[] {
  const empty: number[] = [];
  board.forEach((value, index) => {
    if (value === 0) empty.push(index);
  });
  if (empty.length === 0) return board;

  const next = [...board];
  const spot = empty[Math.floor(Math.random() * empty.length)];
  next[spot] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function lineIndices(direction: Direction, line: number): number[] {
  const indices: number[] = [];
  for (let step = 0; step < SIZE; step++) {
    if (direction === "left") indices.push(line * SIZE + step);
    if (direction === "right") indices.push(line * SIZE + (SIZE - 1 - step));
    if (direction === "up") indices.push(step * SIZE + line);
    if (direction === "down") indices.push((SIZE - 1 - step) * SIZE + line);
  }
  return indices;
}

function slide(board: number[], direction: Direction) {
  const next = emptyBoard();
  let gained = 0;

  for (let line = 0; line < SIZE; line++) {
    const indices = lineIndices(direction, line);
    const tiles = indices.map((index) => board[index]).filter((value) => value !== 0);
    let target = 0;

    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] === tiles[i + 1]) {
        const merged = tiles[i] * 2;
        next[indices[target++]] = merged;
        gained += merged;
        i++;
      } else {
        next[indices[target++]] = tiles[i];
      }
    }
  }

  return { board: next, gained };
}

function canMove(board: number[]): boolean {
  for (let index = 0; index < CELLS; index++) {
    const column = index % SIZE;
    const row = Math.floor(index / SIZE);

    if (board[index] === 0) return true;
    if (column < SIZE - 1 && board[index] === board[index + 1]) return true;
    if (row < SIZE - 1 && board[index] === board[index + SIZE]) return true;
  }
  return false;
}

function tileStyle(value: number): string {
  if (value === 0) return "bg-slate-900/50 border-slate-800 text-transparent";
  if (value === 2) return "bg-slate-800 border-slate-700 text-slate-300";
  if (value === 4) return "bg-slate-700 border-slate-600 text-slate-100";
  if (value === 8) return "bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.25)]";
  if (value === 16) return "bg-cyan-500/30 border-cyan-400 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.35)]";
  if (value === 32) return "bg-emerald-500/30 border-emerald-400 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.35)]";
  if (value === 64) return "bg-emerald-400/40 border-emerald-300 text-emerald-50 shadow-[0_0_22px_rgba(52,211,153,0.4)]";
  if (value === 128) return "bg-amber-400/30 border-amber-300 text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.4)]";
  if (value === 256) return "bg-orange-500/30 border-orange-400 text-orange-100 shadow-[0_0_24px_rgba(249,115,22,0.4)]";
  if (value === 512) return "bg-rose-500/30 border-rose-400 text-rose-100 shadow-[0_0_24px_rgba(244,63,94,0.4)]";
  if (value === 1024) return "bg-fuchsia-500/40 border-fuchsia-300 text-white shadow-[0_0_26px_rgba(217,70,239,0.45)]";
  return "bg-gradient-to-br from-amber-300 via-rose-400 to-fuchsia-500 border-rose-200 text-white shadow-[0_0_30px_rgba(251,113,133,0.6)]";
}

function fontSize(value: number): string {
  if (value >= 1000) return "text-xl sm:text-2xl";
  if (value >= 100) return "text-2xl sm:text-3xl";
  return "text-3xl sm:text-4xl";
}

export default function Game2048() {
  const [board, setBoard] = useState<number[]>(emptyBoard);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [moves, setMoves] = useState(0);
  const [status, setStatus] = useState<Status>("playing");
  const [mounted, setMounted] = useState(false);

  const boardRef = useRef<number[]>(emptyBoard());
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const movesRef = useRef(0);
  const statusRef = useRef<Status>("playing");
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const resetGame = useCallback(() => {
    const start = addRandomTile(addRandomTile(emptyBoard()));
    boardRef.current = start;
    scoreRef.current = 0;
    movesRef.current = 0;
    statusRef.current = "playing";
    setBoard(start);
    setScore(0);
    setMoves(0);
    setStatus("playing");
  }, []);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = Number(window.localStorage.getItem(BEST_KEY) ?? 0) || 0;
      bestRef.current = saved;
      setBest(saved);
    } catch {
      bestRef.current = 0;
    }
    resetGame();
  }, [resetGame]);

  const move = useCallback((direction: Direction) => {
    if (statusRef.current === "lost") return;

    const result = slide(boardRef.current, direction);
    const unchanged = result.board.every((value, index) => value === boardRef.current[index]);
    if (unchanged) return;

    const nextBoard = addRandomTile(result.board);
    const nextScore = scoreRef.current + result.gained;
    const nextMoves = movesRef.current + 1;
    let nextStatus: Status = statusRef.current;

    if (nextBoard.includes(2048) && nextStatus === "playing") {
      nextStatus = "won";
    } else if (!canMove(nextBoard)) {
      nextStatus = "lost";
    }

    boardRef.current = nextBoard;
    scoreRef.current = nextScore;
    movesRef.current = nextMoves;
    statusRef.current = nextStatus;
    setBoard(nextBoard);
    setScore(nextScore);
    setMoves(nextMoves);
    setStatus(nextStatus);

    if (nextScore > bestRef.current) {
      bestRef.current = nextScore;
      setBest(nextScore);
      try {
        window.localStorage.setItem(BEST_KEY, String(nextScore));
      } catch {
        /* storage may be unavailable */
      }
    }
  }, []);

  useEffect(() => {
    const keyMap: Record<string, Direction> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      W: "up",
      s: "down",
      S: "down",
      a: "left",
      A: "left",
      d: "right",
      D: "right",
    };

    const handleKey = (event: KeyboardEvent) => {
      const direction = keyMap[event.key];
      if (!direction) return;
      event.preventDefault();
      move(direction);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [move]);

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? "right" : "left");
    } else {
      move(dy > 0 ? "down" : "up");
    }
  };

  const continuePlaying = () => {
    statusRef.current = "playing";
    setStatus("playing");
  };

  return (
    <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-slate-950 p-3 font-mono select-none sm:p-6">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 animate-[pulse_4s_ease-in-out_infinite]" />
      </div>

      <div className={`absolute left-4 top-4 z-20 transition-all duration-700 sm:left-8 sm:top-8 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <Link
          href="/game"
          className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 backdrop-blur-sm transition-all hover:border-amber-500/50 hover:bg-amber-950/20 hover:text-amber-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Menu</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      <div className={`relative z-10 w-full max-w-md transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
        <div className="space-y-4 rounded-3xl border border-amber-500/10 bg-slate-900/70 p-4 shadow-[0_0_45px_rgba(251,191,36,0.06)] backdrop-blur-md sm:space-y-5 sm:p-7">
          <div className="text-center">
            <h1 className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 bg-clip-text text-3xl font-black uppercase tracking-widest text-transparent drop-shadow-[0_0_12px_rgba(251,191,36,0.35)] sm:text-5xl">
              Neon 2048
            </h1>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 sm:text-xs">
              Merge tiles · Reach 2048 · Survive the grid
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Score", value: score, color: "text-amber-300" },
              { label: "Best", value: best, color: "text-cyan-300" },
              { label: "Moves", value: moves, color: "text-rose-300" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-950/70 px-2 py-2 text-center shadow-inner sm:py-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 sm:text-[10px]">{item.label}</p>
                <p className={`mt-1 text-lg font-black sm:text-2xl ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div
            className="relative rounded-2xl border border-slate-700 bg-slate-950/80 p-2 shadow-inner sm:p-3"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {board.map((value, index) => (
                <div
                  key={index}
                  className={`flex aspect-square items-center justify-center rounded-xl border font-black transition-all duration-150 ${tileStyle(value)} ${fontSize(value)}`}
                >
                  {value !== 0 ? value : ""}
                </div>
              ))}
            </div>

            {status !== "playing" && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-slate-950/85 p-4 text-center backdrop-blur-sm">
                <Trophy className={`mb-3 h-10 w-10 ${status === "won" ? "text-amber-400" : "text-rose-500"}`} />
                <h2 className={`text-2xl font-black uppercase tracking-widest sm:text-3xl ${status === "won" ? "text-amber-300" : "text-rose-400"}`}>
                  {status === "won" ? "2048 Achieved" : "Grid Locked"}
                </h2>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400 sm:text-sm">
                  Final score: <span className="text-cyan-300">{score}</span>
                </p>
                <button
                  onClick={status === "won" ? continuePlaying : resetGame}
                  className="mt-5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-7 py-2.5 text-sm font-black uppercase tracking-widest text-slate-950 transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(251,191,36,0.45)] active:scale-95"
                >
                  {status === "won" ? "Keep Playing" : "Try Again"}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:text-xs">
            <span className="inline-flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-cyan-400" /> Arrow Keys / WASD
            </span>
            <span className="inline-flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-400" /> Swipe
            </span>
          </div>

          <button
            onClick={resetGame}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-950/70 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-300 transition-all hover:border-amber-500/50 hover:bg-amber-950/20 hover:text-amber-300 active:scale-[0.98] sm:text-sm"
          >
            <RotateCcw className="h-5 w-5" />
            New Game
          </button>
        </div>
      </div>
    </main>
  );
}
