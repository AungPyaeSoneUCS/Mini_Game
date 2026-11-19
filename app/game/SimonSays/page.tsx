// file: app/game/SimonSays/page.tsx

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Zap, Volume2 } from "lucide-react";

type Phase = "idle" | "showing" | "input" | "lost";

const BEST_KEY = "neon-simon-best";

const PADS = [
  {
    name: "GREEN",
    glyph: "◆",
    tone: 329.63,
    idle: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
    active: "border-emerald-300 bg-emerald-400/80 text-emerald-950 shadow-[0_0_50px_rgba(52,211,153,0.8)] scale-[1.03]",
  },
  {
    name: "RED",
    glyph: "■",
    tone: 261.63,
    idle: "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
    active: "border-rose-300 bg-rose-400/80 text-rose-950 shadow-[0_0_50px_rgba(244,63,94,0.8)] scale-[1.03]",
  },
  {
    name: "YELLOW",
    glyph: "▲",
    tone: 440,
    idle: "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
    active: "border-amber-200 bg-amber-300/80 text-amber-950 shadow-[0_0_50px_rgba(251,191,36,0.8)] scale-[1.03]",
  },
  {
    name: "BLUE",
    glyph: "●",
    tone: 523.25,
    idle: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20",
    active: "border-cyan-200 bg-cyan-400/80 text-cyan-950 shadow-[0_0_50px_rgba(6,182,212,0.8)] scale-[1.03]",
  },
] as const;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function SimonSays() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [activePad, setActivePad] = useState<number | null>(null);
  const [inputIndex, setInputIndex] = useState(0);
  const [best, setBest] = useState(0);
  const [mounted, setMounted] = useState(false);

  const sequenceRef = useRef<number[]>([]);
  const phaseRef = useRef<Phase>("idle");
  const inputRef = useRef(0);
  const bestRef = useRef(0);
  const runRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const timersRef = useRef<number[]>([]);

  const beep = useCallback((pad: number) => {
    try {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;

      if (!audioRef.current) audioRef.current = new AudioCtor();
      const ctx = audioRef.current;
      if (ctx.state === "suspended") void ctx.resume();

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(PADS[pad].tone, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.34);
    } catch {
      /* audio is an enhancement, not required */
    }
  }, []);

  const updateBest = useCallback((level: number) => {
    if (level <= bestRef.current) return;
    bestRef.current = level;
    setBest(level);
    try {
      window.localStorage.setItem(BEST_KEY, String(level));
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  const playSequence = useCallback(async () => {
    const run = ++runRef.current;
    phaseRef.current = "showing";
    setPhase("showing");
    inputRef.current = 0;
    setInputIndex(0);
    setActivePad(null);

    await delay(550);
    if (runRef.current !== run) return;

    const onMs = Math.max(240, 620 - sequenceRef.current.length * 25);
    const gapMs = Math.max(120, onMs / 2);

    for (const pad of sequenceRef.current) {
      if (runRef.current !== run) return;
      setActivePad(pad);
      beep(pad);
      await delay(onMs);
      if (runRef.current !== run) return;
      setActivePad(null);
      await delay(gapMs);
    }

    if (runRef.current !== run) return;
    phaseRef.current = "input";
    setPhase("input");
  }, [beep]);

  const startGame = useCallback(() => {
    const first = Math.floor(Math.random() * PADS.length);
    sequenceRef.current = [first];
    setSequence([first]);
    void playSequence();
  }, [playSequence]);

  const handlePad = useCallback(
    (index: number) => {
      if (phaseRef.current !== "input") return;

      beep(index);
      setActivePad(index);
      timersRef.current.push(window.setTimeout(() => setActivePad(null), 180));

      if (index !== sequenceRef.current[inputRef.current]) {
        runRef.current++;
        phaseRef.current = "lost";
        setPhase("lost");
        updateBest(sequenceRef.current.length);
        return;
      }

      const nextIndex = inputRef.current + 1;
      inputRef.current = nextIndex;
      setInputIndex(nextIndex);

      if (nextIndex >= sequenceRef.current.length) {
        updateBest(sequenceRef.current.length);

        const run = ++runRef.current;
        phaseRef.current = "showing";
        setPhase("showing");

        const nextSequence = [...sequenceRef.current, Math.floor(Math.random() * PADS.length)];
        sequenceRef.current = nextSequence;
        setSequence(nextSequence);

        timersRef.current.push(
          window.setTimeout(() => {
            if (runRef.current === run) void playSequence();
          }, 900),
        );
      }
    },
    [beep, playSequence, updateBest],
  );

  useEffect(() => {
    setMounted(true);
    try {
      const saved = Number(window.localStorage.getItem(BEST_KEY) ?? 0) || 0;
      bestRef.current = saved;
      setBest(saved);
    } catch {
      bestRef.current = 0;
    }

    return () => {
      runRef.current++;
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      void audioRef.current?.close();
    };
  }, []);

  const statusText =
    phase === "idle"
      ? "PRESS START TO INITIALIZE"
      : phase === "showing"
        ? "WATCH THE PATTERN"
        : phase === "input"
          ? `YOUR TURN · ${inputIndex}/${sequence.length}`
          : "SEQUENCE BROKEN";

  return (
    <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-slate-950 p-3 font-mono select-none sm:p-6">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 animate-[pulse_4s_ease-in-out_infinite]" />
      </div>

      <div className={`absolute left-4 top-4 z-20 transition-all duration-700 sm:left-8 sm:top-8 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <Link
          href="/game"
          className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 backdrop-blur-sm transition-all hover:border-cyan-500/50 hover:bg-cyan-950/20 hover:text-cyan-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Menu</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      <div className={`relative z-10 w-full max-w-md transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
        <div className="space-y-4 rounded-3xl border border-cyan-500/10 bg-slate-900/70 p-4 shadow-[0_0_45px_rgba(6,182,212,0.06)] backdrop-blur-md sm:space-y-5 sm:p-7">
          <div className="text-center">
            <h1 className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-500 bg-clip-text text-3xl font-black uppercase tracking-widest text-transparent drop-shadow-[0_0_12px_rgba(6,182,212,0.35)] sm:text-5xl">
              Simon Says
            </h1>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 sm:text-xs">
              Watch · Repeat · Survive
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {[
              { label: "Level", value: sequence.length, color: "text-cyan-300" },
              { label: "Best Level", value: best, color: "text-amber-300" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-950/70 px-2 py-2 text-center shadow-inner sm:py-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 sm:text-[10px]">{item.label}</p>
                <p className={`mt-1 text-xl font-black sm:text-2xl ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {PADS.map((pad, index) => (
                <button
                  key={pad.name}
                  type="button"
                  onClick={() => handlePad(index)}
                  disabled={phase !== "input"}
                  aria-label={`${pad.name} pad`}
                  className={`flex aspect-square flex-col items-center justify-center rounded-2xl border-2 transition-all duration-150 ${activePad === index ? pad.active : pad.idle} ${phase === "input" ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span className="text-4xl leading-none sm:text-6xl">{pad.glyph}</span>
                  <span className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] sm:text-xs">{pad.name}</span>
                </button>
              ))}
            </div>

            {phase === "lost" && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-slate-950/85 p-4 text-center backdrop-blur-sm">
                <Zap className="mb-3 h-10 w-10 text-rose-500" />
                <h2 className="text-2xl font-black uppercase tracking-widest text-rose-400 sm:text-3xl">Sequence Broken</h2>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400 sm:text-sm">
                  Reached level <span className="text-cyan-300">{sequence.length}</span>
                </p>
                <button
                  onClick={startGame}
                  className="mt-5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 px-7 py-2.5 text-sm font-black uppercase tracking-widest text-slate-950 transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(52,211,153,0.45)] active:scale-95"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:text-xs">
            <span className="inline-flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-cyan-400" /> Audio enabled
            </span>
            <span className={`inline-flex items-center gap-2 ${phase === "input" ? "text-emerald-400" : ""}`}>
              <span className={`h-2 w-2 rounded-full ${phase === "input" ? "animate-pulse bg-emerald-400" : "bg-slate-600"}`} />
              {statusText}
            </span>
          </div>

          <button
            onClick={startGame}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-950/70 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-300 transition-all hover:border-cyan-500/50 hover:bg-cyan-950/20 hover:text-cyan-300 active:scale-[0.98] sm:text-sm"
          >
            <RotateCcw className="h-5 w-5" />
            {phase === "idle" ? "Start Game" : "Restart Game"}
          </button>
        </div>
      </div>
    </main>
  );
}
