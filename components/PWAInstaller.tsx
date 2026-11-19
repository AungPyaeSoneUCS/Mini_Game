"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "neon-hub-install-dismissed";

export default function PWAInstaller() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }

    setIsIos(
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
        !(window as unknown as { MSStream?: unknown }).MSStream,
    );

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is optional */
      });
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };

    const onInstalled = () => {
      setInstallEvent(null);
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* storage may be unavailable */
    }
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setDismissed(true);
    }
    setInstallEvent(null);
  };

  if (dismissed || (!installEvent && !isIos)) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-3 shadow-[0_0_30px_rgba(6,182,212,0.18)] backdrop-blur-md sm:bottom-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
        {isIos ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-black uppercase tracking-widest text-slate-100">Install Neon Hub</p>
        <p className="mt-0.5 truncate text-[10px] font-bold text-slate-400">
          {isIos ? "Tap Share → Add to Home Screen" : "Play offline, full screen"}
        </p>
      </div>

      {installEvent && (
        <button
          type="button"
          onClick={install}
          className="shrink-0 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-950 transition-all hover:scale-105 active:scale-95"
        >
          Install
        </button>
      )}

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
