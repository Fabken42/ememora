"use client";

import { useEffect, useState } from "react";
import { X, Play, Settings, AlertCircle } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import type { ITerm } from "@/models/Term";
import { MIN_GAME_TERMS } from "@/lib/constants";
import StatusIcon from "./StatusIcon";
import toast from "react-hot-toast";

interface Props {
  listId: string;
  mode: "flashcards" | "quiz";
  onClose: () => void;
  onStart: (terms: ITerm[]) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function GameConfigModal({ listId, mode, onClose, onStart }: Props) {
  const { config, setConfig } = useGameStore();
  const [allTerms, setAllTerms] = useState<ITerm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/lists/${listId}/terms?all=true`)
      .then((r) => r.json())
      .then((d) => { setAllTerms(d.terms ?? []); setLoading(false); })
      .catch(() => { toast.error("Erro ao carregar termos."); setLoading(false); });
  }, [listId]);

  const eligible = config.includeMaxStatus
    ? allTerms
    : allTerms.filter((t) => t.status < 6);

  const maxCount = eligible.length;
  const termCount = Math.min(config.termCount, maxCount);
  const canStart = maxCount >= MIN_GAME_TERMS;

  function handleStart() {
    if (!canStart) { toast.error(`São necessários pelo menos ${MIN_GAME_TERMS} termos.`); return; }
    const selected = shuffle(eligible).slice(0, termCount);
    onStart(selected);
  }

  const modeLabel = mode === "flashcards" ? "Flashcards" : "Quiz";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Configurar {modeLabel}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  Incluir termos com status <StatusIcon status={6} size={16} />
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Inclui termos já dominados (status 6)</p>
              </div>
              <div
                onClick={() => setConfig({ includeMaxStatus: !config.includeMaxStatus })}
                className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${config.includeMaxStatus ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.includeMaxStatus ? "translate-x-5" : "translate-x-1"}`} />
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Mostrar cronômetro</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Exibe tempo decorrido durante o jogo</p>
              </div>
              <div
                onClick={() => setConfig({ showTimer: !config.showTimer })}
                className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${config.showTimer ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.showTimer ? "translate-x-5" : "translate-x-1"}`} />
              </div>
            </label>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Quantidade de termos{" "}
                <span className="text-slate-400 dark:text-slate-500 font-normal">({maxCount} disponíveis)</span>
              </label>
              <input
                type="number"
                min={MIN_GAME_TERMS}
                max={maxCount}
                value={termCount}
                onChange={(e) => setConfig({ termCount: parseInt(e.target.value) || MIN_GAME_TERMS })}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {!canStart && (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  São necessários pelo menos {MIN_GAME_TERMS} termos elegíveis para iniciar.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleStart}
                disabled={!canStart}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Play size={14} />
                Iniciar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
