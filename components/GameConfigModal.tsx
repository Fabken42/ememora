"use client";

import { useEffect, useState } from "react";
import { X, Play, Settings, AlertCircle, RefreshCw } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import type { ITerm } from "@/models/Term";
import { MIN_GAME_TERMS } from "@/lib/constants";
import StatusIcon from "./StatusIcon";
import Toggle from "./Toggle";
import toast from "react-hot-toast";

interface Props {
  listId: string;
  mode: "flashcards" | "quiz";
  onClose: () => void;
  onStart: (terms: ITerm[]) => void;
}

interface Counts {
  total: number;
  eligible: number;
}

export default function GameConfigModal({ listId, mode, onClose, onStart }: Props) {
  const { config, setConfig } = useGameStore();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setFetchError(false);
    // Only fetch lightweight counts so the modal renders instantly — the actual
    // term payload is selected server-side when the user clicks "Iniciar".
    fetch(`/api/lists/${listId}/study`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setCounts({ total: d.total ?? 0, eligible: d.eligible ?? 0 }); setLoading(false); })
      .catch(() => { setFetchError(true); setLoading(false); toast.error("Erro ao carregar termos."); });
  }, [listId, retryCount]);

  const maxCount = counts ? (config.includeMaxStatus ? counts.total : counts.eligible) : 0;
  const termCount = Math.min(config.termCount, maxCount);
  const canStart = maxCount >= MIN_GAME_TERMS;

  async function handleStart() {
    if (!canStart) { toast.error(`São necessários pelo menos ${MIN_GAME_TERMS} termos.`); return; }
    setStarting(true);
    try {
      // Server selects the terms (Leitner-prioritised + random sample) and returns
      // only the chosen subset — no need to ship the whole list to the client.
      const res = await fetch(`/api/lists/${listId}/study`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termCount, includeMaxStatus: config.includeMaxStatus, mode }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const terms: ITerm[] = data.terms ?? [];
      if (terms.length < MIN_GAME_TERMS) {
        toast.error(`São necessários pelo menos ${MIN_GAME_TERMS} termos.`);
        setStarting(false);
        return;
      }
      onStart(terms);
    } catch {
      toast.error("Erro ao iniciar o jogo.");
      setStarting(false);
    }
  }

  const modeLabel = mode === "flashcards" ? "Flashcards" : "Quiz";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-[#243049]">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Configurar {modeLabel}</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center">
            <div role="status" aria-label="Carregando termos..." className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-sm text-slate-600 dark:text-slate-300">Não foi possível carregar os termos.</p>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <RefreshCw size={14} />
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <Toggle
              checked={config.includeMaxStatus}
              onChange={(v) => setConfig({ includeMaxStatus: v })}
              label="Incluir termos com status"
              labelSuffix={<StatusIcon status={6} size={16} />}
              description="Inclui termos já dominados (status 6)"
            />

            <Toggle
              checked={config.showTimer}
              onChange={(v) => setConfig({ showTimer: v })}
              label="Mostrar cronômetro"
              description="Exibe tempo decorrido durante o jogo"
            />

            <Toggle
              checked={config.swapSides}
              onChange={(v) => setConfig({ swapSides: v })}
              label="Inverter conceito/definição"
              description={
                mode === "flashcards"
                  ? "Definição na frente, conceito no verso"
                  : "Definição como pergunta, conceito como resposta"
              }
            />

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
                onChange={(e) => {
                  const raw = parseInt(e.target.value) || MIN_GAME_TERMS;
                  setConfig({ termCount: Math.min(Math.max(MIN_GAME_TERMS, raw), maxCount) });
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-[#2f3d5a] bg-white dark:bg-[#1a2336] text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-[#2f3d5a] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a2336]"
              >
                Cancelar
              </button>
              <button
                onClick={handleStart}
                disabled={!canStart || starting}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {starting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play size={14} />
                )}
                {starting ? "Preparando..." : "Iniciar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
