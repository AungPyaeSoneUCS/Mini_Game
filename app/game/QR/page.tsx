// file: app/game/QR/page.tsx

"use client";

import React, { useEffect, useRef, useState } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Check,
  Download,
  Link as LinkIcon,
  Palette,
  QrCode,
  ScanLine,
} from "lucide-react";
import Link from "next/link";

type Format = "png" | "jpg" | "svg" | "webp";
type BorderStyle = "none" | "solid" | "dashed" | "dotted" | "double";
type CornerStyle = "sharp" | "rounded";
type ErrorLevel = "L" | "M" | "Q" | "H";

const PRESETS = [
  { name: "Rose", fg: "#020617", bg: "#ffffff", border: "#f43f5e" },
  { name: "Cyan", fg: "#020617", bg: "#ffffff", border: "#06b6d4" },
  { name: "Matrix", fg: "#022c22", bg: "#ecfdf5", border: "#10b981" },
  { name: "Midnight", fg: "#f8fafc", bg: "#020617", border: "#a855f7" },
  { name: "Sunset", fg: "#3b0764", bg: "#fff7ed", border: "#f97316" },
] as const;

const FORMATS: { id: Format; label: string }[] = [
  { id: "png", label: "PNG" },
  { id: "jpg", label: "JPG" },
  { id: "svg", label: "SVG" },
  { id: "webp", label: "WEBP" },
];

const BORDERS: { id: BorderStyle; label: string }[] = [
  { id: "none", label: "None" },
  { id: "solid", label: "Solid" },
  { id: "dashed", label: "Dashed" },
  { id: "dotted", label: "Dotted" },
  { id: "double", label: "Double" },
];

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function saveBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(href);
}

function saveDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export default function QRGenerator() {
  const [value, setValue] = useState("https://github.com/AungPyaeSoneUCS");
  const [fgColor, setFgColor] = useState("#020617");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [borderColor, setBorderColor] = useState("#f43f5e");
  const [borderStyle, setBorderStyle] = useState<BorderStyle>("solid");
  const [borderWidth, setBorderWidth] = useState(16);
  const [corner, setCorner] = useState<CornerStyle>("rounded");
  const [level, setLevel] = useState<ErrorLevel>("H");
  const [exportSize, setExportSize] = useState(512);
  const [format, setFormat] = useState<Format>("png");
  const [mounted, setMounted] = useState(false);
  const [notice, setNotice] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const trimmedValue = value.trim();
  const width = borderStyle === "none" ? 0 : borderWidth;
  const previewPadding = width === 0 ? "0px" : `${Math.max(4, Math.round(width / 4))}px`;
  const previewRadius = corner === "rounded" ? "18px" : "4px";
  const previewBorder = width === 0 ? "none" : `${previewPadding} ${borderStyle} ${borderColor}`;

  const buildRasterCanvas = (jpeg = false) => {
    const source = canvasRef.current;
    if (!source) return null;

    const total = exportSize + width * 2;
    const canvas = document.createElement("canvas");
    canvas.width = total;
    canvas.height = total;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const radius = corner === "rounded" ? Math.round(total * 0.08) : 0;

    // JPEG has no alpha channel — fill the full canvas so clipped corners
    // become the chosen background color instead of black.
    if (jpeg) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, total, total);
    }

    ctx.save();
    roundedRectPath(ctx, 0, 0, total, total, radius);
    ctx.clip();

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, total, total);
    ctx.drawImage(source, width, width, exportSize, exportSize);

    if (width > 0) {
      const inset = width / 2;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";

      if (borderStyle === "dashed") ctx.setLineDash([width * 2, width]);
      if (borderStyle === "dotted") {
        ctx.setLineDash([0.1, width * 2]);
        ctx.lineCap = "round";
      }

      roundedRectPath(ctx, inset, inset, total - width, total - width, Math.max(0, radius - inset));
      ctx.stroke();

      if (borderStyle === "double") {
        ctx.setLineDash([]);
        ctx.lineWidth = Math.max(1, width / 3);
        roundedRectPath(
          ctx,
          width * 1.3,
          width * 1.3,
          total - width * 2.6,
          total - width * 2.6,
          Math.max(0, radius - width * 1.3),
        );
        ctx.stroke();
      }
    }

    ctx.restore();
    return canvas;
  };

  const buildSvgString = () => {
    const source = svgRef.current;
    if (!source) return null;

    const serialized = new XMLSerializer().serializeToString(source);
    const inner = serialized.replace(/^<svg[^>]*>/i, "").replace(/<\/svg>\s*$/i, "");
    const total = exportSize + width * 2;
    const radius = corner === "rounded" ? Math.round(total * 0.08) : 0;

    const dash =
      borderStyle === "dashed"
        ? ` stroke-dasharray="${width * 2} ${width}"`
        : borderStyle === "dotted"
          ? ` stroke-dasharray="0.1 ${width * 2}" stroke-linecap="round"`
          : "";

    const frame =
      width > 0
        ? `<rect x="${width / 2}" y="${width / 2}" width="${total - width}" height="${total - width}" rx="${Math.max(0, radius - width / 2)}" fill="none" stroke="${borderColor}" stroke-width="${width}"${dash}/>` +
          (borderStyle === "double"
            ? `<rect x="${width * 1.3}" y="${width * 1.3}" width="${total - width * 2.6}" height="${total - width * 2.6}" rx="${Math.max(0, radius - width * 1.3)}" fill="none" stroke="${borderColor}" stroke-width="${Math.max(1, width / 3)}"/>`
            : "")
        : "";

    const clip =
      corner === "rounded"
        ? `<defs><clipPath id="qr-frame"><rect width="${total}" height="${total}" rx="${radius}"/></clipPath></defs>`
        : "";

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}">${clip}<g${corner === "rounded" ? ' clip-path="url(#qr-frame)"' : ""}><rect width="${total}" height="${total}" fill="${bgColor}"/><g transform="translate(${width} ${width})">${inner}</g>${frame}</g></svg>`;
  };

  const handleDownload = () => {
    if (!trimmedValue) {
      setNotice("Enter text or a link first");
      return;
    }

    const raw = trimmedValue.replace(/^https?:\/\//i, "").split(/[/?#]/)[0] || "qr-code";
    const safeName = raw.replace(/[^a-z0-9-_]/gi, "-").slice(0, 40) || "qr-code";

    if (format === "svg") {
      const markup = buildSvgString();
      if (!markup) return;
      saveBlob(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }), `${safeName}-qr.svg`);
      setNotice("SVG downloaded");
      return;
    }

    const canvas = buildRasterCanvas(format === "jpg");
    if (!canvas) return;

    const mime = format === "jpg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    let dataUrl = canvas.toDataURL(mime, 0.95);
    let extension = format;

    if (format === "webp" && !dataUrl.startsWith("data:image/webp")) {
      dataUrl = canvas.toDataURL("image/png");
      extension = "png";
      setNotice("WEBP unsupported here — saved as PNG");
    } else {
      setNotice(`${format.toUpperCase()} downloaded`);
    }

    saveDataUrl(dataUrl, `${safeName}-qr.${extension}`);
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setFgColor(preset.fg);
    setBgColor(preset.bg);
    setBorderColor(preset.border);
    setNotice(`${preset.name} palette applied`);
  };

  return (
    <main className="relative min-h-[100dvh] w-full bg-slate-950 px-4 py-20 font-sans selection:bg-rose-500/30 sm:px-6">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] opacity-20 animate-[pulse_4s_ease-in-out_infinite]" />
      </div>

      <div className={`absolute left-4 top-5 z-20 transition-all duration-700 sm:left-8 sm:top-8 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <Link
          href="/game"
          className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 backdrop-blur-sm transition-all hover:border-rose-500/50 hover:bg-rose-950/20 hover:text-rose-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Menu</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      <div className={`relative z-10 mx-auto w-full max-w-2xl transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
        <div className="space-y-5 rounded-3xl border border-rose-500/10 bg-slate-900/70 p-5 shadow-[0_0_45px_rgba(244,63,94,0.06)] backdrop-blur-md sm:space-y-6 sm:p-8">
          <div className="text-center">
            <h1 className="bg-gradient-to-r from-rose-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-3xl font-black uppercase tracking-widest text-transparent sm:text-4xl">
              QR Generator
            </h1>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 sm:text-xs">
              Style it · Frame it · Export it
            </p>
          </div>

          {/* Content */}
          <section className="space-y-2">
            <label htmlFor="qr-value" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <LinkIcon className="h-4 w-4 text-rose-400" /> Content or Link
            </label>
            <textarea
              id="qr-value"
              rows={2}
              value={value}
              maxLength={1200}
              onChange={(event) => setValue(event.target.value)}
              placeholder="https://github.com/AungPyaeSoneUCS"
              className="block w-full resize-none rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 shadow-inner outline-none transition-all placeholder:text-slate-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30"
            />
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Preview */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <ScanLine className="h-4 w-4 text-cyan-400" /> Live Preview
              </div>
              <div className="flex min-h-[248px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-inner">
                {trimmedValue ? (
                  <div
                    style={{
                      padding: previewPadding,
                      border: previewBorder,
                      borderRadius: previewRadius,
                      backgroundColor: bgColor,
                    }}
                    className="transition-all duration-300"
                  >
                    <QRCodeCanvas
                      ref={canvasRef}
                      id="qr-canvas"
                      value={trimmedValue}
                      size={exportSize}
                      level={level}
                      bgColor={bgColor}
                      fgColor={fgColor}
                      marginSize={4}
                      style={{ width: "100%", height: "auto", maxWidth: "190px", display: "block" }}
                    />
                  </div>
                ) : (
                  <div className="flex h-[190px] w-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/60 text-slate-600">
                    <QrCode className="h-10 w-10 opacity-30" />
                    <span className="mt-3 px-4 text-center text-xs font-bold uppercase tracking-widest">Awaiting Input</span>
                  </div>
                )}
                <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  {exportSize} × {exportSize} px source
                </p>
              </div>

              <div className="hidden" aria-hidden="true">
                {trimmedValue && (
                  <QRCodeSVG
                    ref={svgRef}
                    id="qr-svg"
                    value={trimmedValue}
                    size={exportSize}
                    level={level}
                    bgColor={bgColor}
                    fgColor={fgColor}
                    marginSize={4}
                  />
                )}
              </div>
            </section>

            {/* Controls */}
            <section className="space-y-5">
              {/* Colors */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Palette className="h-4 w-4 text-fuchsia-400" /> Colors
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "QR", color: fgColor, set: setFgColor },
                    { label: "Back", color: bgColor, set: setBgColor },
                    { label: "Frame", color: borderColor, set: setBorderColor },
                  ].map((item) => (
                    <label key={item.label} className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 p-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{item.label}</span>
                      <input
                        type="color"
                        value={item.color}
                        onChange={(event) => item.set(event.target.value)}
                        aria-label={`${item.label} color`}
                        className="h-9 w-full cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
                      />
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      title={preset.name}
                      aria-label={`Apply ${preset.name} palette`}
                      style={{ backgroundColor: preset.bg, borderColor: preset.border }}
                      className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                    >
                      <span className="block h-full w-full scale-50 rounded-full" style={{ backgroundColor: preset.fg }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <QrCode className="h-4 w-4 text-rose-400" /> Frame
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {BORDERS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setBorderStyle(option.id)}
                      className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${
                        borderStyle === option.id
                          ? "border-rose-500 bg-rose-500/15 text-rose-300"
                          : "border-slate-800 bg-slate-950/60 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Thickness</span>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={2}
                    value={borderWidth}
                    disabled={borderStyle === "none"}
                    onChange={(event) => setBorderWidth(Number(event.target.value))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-700 accent-rose-500 disabled:opacity-40"
                  />
                  <span className="w-8 text-right text-[10px] font-bold text-slate-400">{borderWidth}px</span>
                </div>
                <div className="flex gap-1.5">
                  {(["sharp", "rounded"] as CornerStyle[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCorner(option)}
                      className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${
                        corner === option
                          ? "border-cyan-500 bg-cyan-500/15 text-cyan-300"
                          : "border-slate-800 bg-slate-950/60 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {option} corners
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Export */}
          <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Download className="h-4 w-4 text-emerald-400" /> Export
            </div>

            <div className="flex flex-wrap gap-1.5">
              {FORMATS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFormat(option.id)}
                  className={`rounded-lg border px-3 py-1.5 text-[10px] font-black tracking-widest transition-all ${
                    format === option.id
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                      : "border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500">Size</span>
                <select
                  value={exportSize}
                  onChange={(event) => setExportSize(Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-xs font-bold text-slate-300 outline-none focus:border-emerald-500"
                >
                  {[256, 512, 1024].map((size) => (
                    <option key={size} value={size}>{size} px</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500">Error Correction</span>
                <select
                  value={level}
                  onChange={(event) => setLevel(event.target.value as ErrorLevel)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-xs font-bold text-slate-300 outline-none focus:border-emerald-500"
                >
                  <option value="L">Low</option>
                  <option value="M">Medium</option>
                  <option value="Q">Quartile</option>
                  <option value="H">High</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!trimmedValue}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(244,63,94,0.4)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none sm:text-sm"
            >
              <Download className="h-5 w-5" />
              Download {format.toUpperCase()}
            </button>
          </section>
        </div>
      </div>

      {notice && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-500/30 bg-slate-900/95 px-5 py-2.5 text-xs font-bold text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.2)] backdrop-blur-sm">
          <Check className="h-4 w-4" />
          {notice}
        </div>
      )}
    </main>
  );
}
