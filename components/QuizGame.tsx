"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clock, RotateCcw, CheckCircle2, XCircle, Trophy, BookOpen } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import StatusIcon from "@/components/StatusIcon";
import type { ITerm } from "@/models/Term";
import toast from "react-hot-toast";

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Option {
  text: string;
  image?: string;
  correct: boolean;
}

function buildOptions(current: ITerm, allTerms: ITerm[]): Option[] {
  const others = allTerms.filter((t) => String(t._id) !== String(current._id));
  const wrong = shuffle(others).slice(0, 3).map((t) => ({
    text: t.definition,
    image: t.definitionImage,
    correct: false,
  }));
  return shuffle([
    { text: current.definition, image: current.definitionImage, correct: true },
    ...wrong,
  ]);
}

interface SummaryProps {
  correct: number;
  total: number;
  elapsed: number;
  onReset: () => void;
  onBackToList: () => void;
}

function Summary({ correct, total, elapsed, onReset, onBackToList }: SummaryProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-12 px-4 text-center">
      <Trophy size={48} className="text-indigo-500" />
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quiz concluído!</h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-600">{correct}</p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-1">Corretas</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-500">{total - correct}</p>
          <p className="text-xs text-red-700 dark:text-red-400 mt-1">Incorretas</p>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
        <Clock size={14} /> Tempo total: {formatTime(elapsed)}
      </p>

      <div className="flex gap-3">
        <button
          onClick={onBackToList}
          className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <BookOpen size={16} />
          Voltar para lista
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <RotateCcw size={16} />
          Novo quiz
        </button>
      </div>
    </div>
  );
}

interface Props {
  listId: string;
  initialTerms: ITerm[];
  allTerms: ITerm[];
  onExit: () => void;
}

export default function QuizGame({ listId, initialTerms, allTerms, onExit }: Props) {
  const { config, terms, currentIndex, results, startTime, setTerms, nextTerm, reset } = useGameStore();
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const router = useRouter();

  const buildCurrentOptions = useCallback((idx: number) => {
    if (idx < initialTerms.length) {
      setOptions(buildOptions(initialTerms[idx], allTerms));
    }
  }, [initialTerms, allTerms]);

  useEffect(() => {
    setTerms(initialTerms);
    buildCurrentOptions(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!config.showTimer || !startTime) return;
    const id = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(id);
  }, [config.showTimer, startTime]);

  async function handleSelect(idx: number) {
    if (selected !== null) return;
    setSelected(idx);

    const opt = options[idx];
    const term = terms[currentIndex];
    const delta = opt.correct ? +1 : -1;

    try {
      await fetch(`/api/lists/${listId}/terms/${term._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: Math.min(6, Math.max(0, term.status + delta)) }),
      });
    } catch {
      toast.error("Erro ao atualizar status.");
    }

    setTimeout(() => {
      nextTerm(opt.correct);
      setSelected(null);
      buildCurrentOptions(currentIndex + 1);
    }, 1200);
  }

  const isDone = currentIndex >= terms.length && terms.length > 0;

  if (isDone) {
    const correct = results.filter((r) => r.correct).length;
    const totalElapsed = startTime ? Date.now() - startTime : elapsed;
    return (
      <Summary
        correct={correct}
        total={terms.length}
        elapsed={totalElapsed}
        onReset={() => {
          reset();
          onExit();
        }}
        onBackToList={() => {
          reset();
          router.push(`/lists/${listId}`);
        }}
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
    <div className="flex flex-col gap-6 py-6 px-4 max-w-lg mx-auto">
      {config.showTimer && (
        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full self-center">
          <Clock size={14} />
          {formatTime(elapsed)}
        </div>
      )}

      <div className="text-sm text-slate-500 dark:text-slate-400 text-center">{currentIndex + 1} / {terms.length}</div>

      <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-3">
        <div className="absolute top-3 right-3">
          <StatusIcon status={term.status} size={20} />
        </div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Conceito</p>
        <p className="text-lg font-medium text-slate-800 dark:text-slate-100">{term.concept}</p>
        {term.conceptImage && (
          <div className="relative h-40 w-full rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <Image src={term.conceptImage} alt="" fill className="object-contain bg-slate-50 dark:bg-slate-700" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => {
          let cls: string;
          if (selected === null) {
            cls = "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/30";
          } else if (opt.correct) {
            cls = "border-green-400 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300";
          } else if (i === selected) {
            cls = "border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400";
          } else {
            cls = "border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              className={`relative text-left border-2 rounded-xl p-4 transition-all bg-white dark:bg-slate-800 ${cls}`}
            >
              {opt.image && (
                <div className="relative h-20 w-full rounded-lg overflow-hidden mb-2 border border-slate-100 dark:border-slate-700">
                  <Image src={opt.image} alt="" fill className="object-contain" />
                </div>
              )}
              <p className="text-sm font-medium">{opt.text}</p>
              {selected !== null && opt.correct && (
                <CheckCircle2 className="absolute top-3 right-3 text-green-500" size={16} />
              )}
              {selected !== null && i === selected && !opt.correct && (
                <XCircle className="absolute top-3 right-3 text-red-500" size={16} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
