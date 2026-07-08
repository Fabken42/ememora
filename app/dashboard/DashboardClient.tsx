"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import StudyListCard from "@/components/StudyListCard";
import { SkeletonListCard } from "@/components/Skeletons";
import CreateListModal from "@/components/CreateListModal";
import type { IStudyList } from "@/models/StudyList";
import { GENRES } from "@/models/StudyList.types";
import { GENRE_LABELS, MAX_LISTS } from "@/lib/constants";
import { useFilterStore } from "@/store/useFilterStore";

export default function DashboardClient() {
  const { dashboardSort, dashboardGenres, setDashboardSort, setDashboardGenres } = useFilterStore();
  const [lists, setLists] = useState<(IStudyList & { _id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort: dashboardSort });
    dashboardGenres.forEach((g) => params.append("genre", g));
    const res = await fetch(`/api/lists?${params}`);
    if (res.ok) setLists(await res.json());
    setLoading(false);
  }, [dashboardSort, dashboardGenres]);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  function handleCreateClick() {
    if (lists.length >= MAX_LISTS) {
      toast.error(`Limite de ${MAX_LISTS} listas atingido.`);
      return;
    }
    setShowModal(true);
  }

  function toggleGenre(genre: (typeof GENRES)[number]) {
    setDashboardGenres(
      dashboardGenres.includes(genre)
        ? dashboardGenres.filter((g) => g !== genre)
        : [...dashboardGenres, genre]
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Minhas listas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {lists.length} {lists.length === 1 ? "lista" : "listas"}
            {lists.length > 0 && ` • máx. ${MAX_LISTS}`}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors ${
              showFilters || dashboardGenres.length > 0
                ? "bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                : "border-slate-300 dark:border-[#383838] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#252525]"
            }`}
          >
            <SlidersHorizontal size={15} />
            Filtros
            {dashboardGenres.length > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {dashboardGenres.length}
              </span>
            )}
          </button>
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Nova lista
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#2e2e2e] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Ordenação</p>
            <select
              value={dashboardSort}
              onChange={(e) => setDashboardSort(e.target.value as "newest" | "oldest")}
              className="text-sm border border-slate-300 dark:border-[#383838] bg-white dark:bg-[#252525] text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigas</option>
            </select>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Gênero</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    dashboardGenres.includes(g)
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-300 dark:border-[#383838] text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500"
                  }`}
                >
                  {GENRE_LABELS[g]}
                </button>
              ))}
            </div>
          </div>
          {dashboardGenres.length > 0 && (
            <button
              onClick={() => setDashboardGenres([])}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div role="status" aria-label="Carregando listas..." className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonListCard key={i} />)}
        </div>
      ) : lists.length === 0 ? (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500 space-y-3">
          <p className="text-4xl">📚</p>
          <p className="font-medium text-slate-600 dark:text-slate-400">Nenhuma lista encontrada.</p>
          <p className="text-sm">
            {dashboardGenres.length > 0
              ? "Tente remover os filtros ou crie uma nova lista."
              : "Crie sua primeira lista de estudos!"}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <StudyListCard key={String(list._id)} list={list} onDeleted={fetchLists} />
          ))}
        </div>
      )}

      {showModal && (
        <CreateListModal onClose={() => { setShowModal(false); fetchLists(); }} />
      )}
    </div>
  );
}
