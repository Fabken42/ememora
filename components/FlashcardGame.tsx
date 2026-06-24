"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useSwipeable } from "react-swipeable";
import { ArrowLeft, ArrowRight, ArrowDown, Clock, RotateCcw } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import StatusIcon from "@/components/StatusIcon";
import type { ITerm } from "@/models/Term";
import toast from "react-hot-toast";

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

interface SummaryProps {
  results: { termId: string; correct: boolean | null }[];
  elapsed: number;
  onReset: () => void;
}

function Summary({ results, elapsed, onReset }: SummaryProps) {
  const correct = results.filter((r) => r.correct === true).length;
  const incorrect = results.filter((r) => r.correct === false).length;
  const skipped = results.filter((r) => r.correct === null).length;

  return (
    <div className="flex flex-col items-center gap-6 py-12 px-4 text-center">
      <div className="text-5xl">🎉</div>
      <h2 className="text-2xl font-bold text-slate-800">Sessão concluída!</h2>

      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-600">{correct}</p>
          <p className="text-xs text-green-700 mt-1">Acertos</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-500">{incorrect}</p>
          <p className="text-xs text-red-700 mt-1">Erros</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-500">{skipped}</p>
          <p className="text-xs text-slate-600 mt-1">Pulados</p>
        </div>
      </div>

      <p className="text-sm text-slate-500 flex items-center gap-1">
        <Clock size={14} /> Tempo total: {formatTime(elapsed)}
      </p>

      <button
        onClick={onReset}
        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
      >
        <RotateCcw size={16} />
        Nova sessão
      </button>
    </div>
  );
}

interface Props {
  listId: string;
  initialTerms: ITerm[];
  onExit: () => void;
}

export default function FlashcardGame({ listId, initialTerms, onExit }: Props) {
  const { config, terms, currentIndex, results, startTime, setTerms, nextTerm, reset } = useGameStore();
  const [flipped, setFlipped] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [animDir, setAnimDir] = useState<"left" | "right" | "down" | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTerms(initialTerms);
    return () => { /* keep store on unmount so summary persists */ };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  useEffect(() => {
    if (!config.showTimer || !startTime) return;
    const id = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(id);
  }, [config.showTimer, startTime]);

  function updateStatus(term: ITerm, delta: number) {
    const newStatus = Math.min(6, Math.max(0, term.status + delta));
    fetch(`/api/lists/${listId}/terms/${term._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => toast.error("Erro ao atualizar status."));
  }

  function advance(dir: "right" | "left" | "down") {
    if (animDir) return;
    const term = terms[currentIndex];
    if (!term) return;

    setFlipped(false);

    const result: boolean | null =
      dir === "right" ? true : dir === "left" ? false : null;

    if (dir === "right") updateStatus(term, +1);
    else if (dir === "left") updateStatus(term, -1);

    setAnimDir(dir);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setAnimDir(null);
      nextTerm(result);
    }, 250);
  }

  const isDone = currentIndex >= terms.length && terms.length > 0;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isDone || animDir) return;
      if (e.key === " ") { e.preventDefault(); setFlipped((f) => !f); }
      else if (e.key === "a") advance("left");
      else if (e.key === "s") advance("down");
      else if (e.key === "d") advance("right");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDone, animDir, currentIndex, terms]);

  const handlers = useSwipeable({
    onSwipedRight: () => advance("right"),
    onSwipedLeft: () => advance("left"),
    onSwipedDown: () => advance("down"),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  if (isDone) {
    const totalElapsed = startTime ? Date.now() - startTime : elapsed;
    return (
      <Summary
        results={results}
        elapsed={totalElapsed}
        onReset={() => { reset(); onExit(); }}
      />
    );
  }

  if (terms.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const term = terms[currentIndex];

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4 select-none">
      {config.showTimer && (
        <div className="flex items-center gap-1.5 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          <Clock size={14} />
          {formatTime(elapsed)}
        </div>
      )}

      <div className="text-sm text-slate-500">
        {currentIndex + 1} / {terms.length}
      </div>

      <div className="w-full max-w-md cursor-pointer overflow-hidden" onClick={() => setFlipped((f) => !f)}>
        <div
          className="relative transition-transform duration-300 ease-out"
          style={{
            transform: animDir === "right"
              ? "translateX(120%)"
              : animDir === "left"
                ? "translateX(-120%)"
                : animDir === "down"
                  ? "translateY(80%)"
                  : "translateX(0)",
            opacity: animDir ? 0 : 1,
            transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease-out"
          }}
        >
          <div
            className={`relative w-full min-h-64 bg-white border-2 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center gap-3 ${flipped ? "border-indigo-300 bg-indigo-50" : "border-slate-200"
              }`}
          >
            <div className="absolute top-3 right-3">
              <StatusIcon status={term.status} size={20} />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {flipped ? "Definição" : "Conceito"}
            </p>
            <p className="text-lg text-slate-800 text-center font-medium">
              {flipped ? term.definition : term.concept}
            </p>
            {!flipped && term.conceptImage && (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-100">
                <Image src={term.conceptImage} alt="" fill className="object-contain bg-slate-50" />
              </div>
            )}
            {flipped && term.definitionImage && (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-100">
                <Image src={term.definitionImage} alt="" fill className="object-contain bg-indigo-50" />
              </div>
            )}
            <p className="text-xs text-slate-300 mt-2">Toque para virar</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => advance("left")}
          className="flex flex-col items-center gap-1 p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors active:scale-95"
          title="Errei (status -1)"
        >
          <ArrowLeft size={22} />
          <span className="text-xs font-medium">Errei</span>
        </button>
        <button
          onClick={() => advance("down")}
          className="flex flex-col items-center gap-1 p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-colors active:scale-95"
          title="Pular"
        >
          <ArrowDown size={18} />
          <span className="text-xs font-medium">Pular</span>
        </button>
        <button
          onClick={() => advance("right")}
          className="flex flex-col items-center gap-1 p-4 bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-colors active:scale-95"
          title="Acertei (status +1)"
        >
          <ArrowRight size={22} />
          <span className="text-xs font-medium">Acertei</span>
        </button>
      </div>

      <p className="text-xs text-slate-400 text-center">
        ← Errei &nbsp;|&nbsp; Pular ↓ &nbsp;|&nbsp; Acertei →
      </p>
    </div>
  );
}
