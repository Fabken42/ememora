"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Target, Layers, Zap, Clock, BarChart3, ChevronLeft, BookOpen } from "lucide-react";

interface Stats {
  sessions: number;
  termsStudied: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracy: number;
  durationMs: number;
  streak: number;
  byMode: { flashcards: number; quiz: number };
  daily: { date: string; sessions: number; terms: number }[];
}

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function weekday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return ["D", "S", "T", "Q", "Q", "S", "S"][d.getDay()];
}

interface CardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}

function StatCard({ icon, label, value, accent }: CardProps) {
  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#243049] rounded-2xl p-4 flex items-center gap-3">
      <div className={`shrink-0 rounded-xl p-2.5 ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function StatsClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const maxTerms = stats ? Math.max(1, ...stats.daily.map((d) => d.terms)) : 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <ChevronLeft size={16} />
        Dashboard
      </Link>

      <div className="flex items-center gap-2">
        <BarChart3 size={22} className="text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Estatísticas</h1>
      </div>

      {loading ? (
        <div role="status" aria-label="Carregando estatísticas..." className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#243049] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">
          <p className="font-medium text-slate-600 dark:text-slate-400">Não foi possível carregar as estatísticas.</p>
        </div>
      ) : !stats || stats.sessions === 0 ? (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500 space-y-3">
          <p className="text-4xl">📊</p>
          <p className="font-medium text-slate-600 dark:text-slate-400">Nenhuma sessão de estudo ainda.</p>
          <p className="text-sm">Jogue um flashcard ou quiz para começar a acompanhar seu progresso!</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 mt-2 px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <BookOpen size={15} />
            Ir para minhas listas
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<Flame size={20} className="text-orange-500" />}
              accent="bg-orange-100 dark:bg-orange-900/40"
              label={stats.streak === 1 ? "dia seguido" : "dias seguidos"}
              value={String(stats.streak)}
            />
            <StatCard
              icon={<Target size={20} className="text-green-600 dark:text-green-400" />}
              accent="bg-green-100 dark:bg-green-900/40"
              label="de acerto"
              value={`${stats.accuracy}%`}
            />
            <StatCard
              icon={<Layers size={20} className="text-blue-600 dark:text-blue-400" />}
              accent="bg-blue-100 dark:bg-blue-900/40"
              label="termos estudados"
              value={String(stats.termsStudied)}
            />
            <StatCard
              icon={<Clock size={20} className="text-purple-600 dark:text-purple-400" />}
              accent="bg-purple-100 dark:bg-purple-900/40"
              label="tempo total"
              value={formatDuration(stats.durationMs)}
            />
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#243049] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Últimos 14 dias</h2>
            <div className="flex items-end justify-between gap-1 h-32">
              {stats.daily.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex items-end justify-center h-full">
                    <div
                      className="w-full max-w-[24px] rounded-t bg-blue-500 dark:bg-blue-500/80 transition-all group-hover:bg-blue-600"
                      style={{ height: `${d.terms > 0 ? Math.max(6, (d.terms / maxTerms) * 100) : 0}%` }}
                      title={`${d.terms} termos em ${d.sessions} ${d.sessions === 1 ? "sessão" : "sessões"}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{weekday(d.date)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#243049] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Desempenho</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Sessões</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{stats.sessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Acertos</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{stats.correct}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Erros</span>
                  <span className="font-medium text-red-500 dark:text-red-400">{stats.incorrect}</span>
                </div>
                {stats.skipped > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Pulados</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">{stats.skipped}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#243049] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Por modo</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Layers size={14} className="text-blue-500" /> Flashcards
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{stats.byMode.flashcards}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Zap size={14} className="text-emerald-500" /> Quiz
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{stats.byMode.quiz}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
