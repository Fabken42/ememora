"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Zap, Layers, Pencil, ChevronLeft, TrendingDown, TrendingUp, Upload, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import TermItem from "@/components/TermItem";
import TermForm from "@/components/TermForm";
import Pagination from "@/components/Pagination";
import ImportTermsModal from "@/components/ImportTermsModal";
import type { IStudyList } from "@/models/StudyList";
import { GENRES } from "@/models/StudyList.types";
import type { Genre } from "@/models/StudyList.types";
import type { ITerm } from "@/models/Term";
import { GENRE_LABELS, GENRE_COLORS, MAX_TERMS, TERMS_PER_PAGE } from "@/lib/constants";
import { useFilterStore } from "@/store/useFilterStore";
import { SkeletonTermItem } from "@/components/Skeletons";

interface ListData {
  _id: string;
  name: string;
  description?: string;
  genre?: string;
  termsCount: number;
  statusSum: number;
}

interface Props {
  list: ListData;
}

interface TermsResponse {
  terms: (ITerm & { _id: string })[];
  total: number;
  page: number;
  pages: number;
  statusSum: number;
}

export default function ListClient({ list: initialList }: Props) {
  const { termSort, setTermSort } = useFilterStore();
  const [list, setList] = useState(initialList);
  const [terms, setTerms] = useState<(ITerm & { _id: string })[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [editingList, setEditingList] = useState(false);
  const [editName, setEditName] = useState(list.name);
  const [editDesc, setEditDesc] = useState(list.description ?? "");
  const [editGenre, setEditGenre] = useState(list.genre ?? "");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Guards against out-of-order responses: when the user changes sort/page
  // quickly, only the latest request is allowed to update state.
  const reqIdRef = useRef(0);

  const fetchTerms = useCallback(async (p: number) => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/lists/${list._id}/terms?page=${p}&sort=${termSort}`);
      if (reqId !== reqIdRef.current) return; // a newer request superseded this one
      if (!res.ok) throw new Error();
      const data: TermsResponse = await res.json();
      setTerms(data.terms);
      setPage(data.page);
      setPages(data.pages);
      setTotal(data.total);
      setList((l) => ({ ...l, statusSum: data.statusSum }));
    } catch {
      if (reqId === reqIdRef.current) toast.error("Erro ao carregar termos.");
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [list._id, termSort]);

  useEffect(() => { fetchTerms(1); }, [termSort, list._id]); // eslint-disable-line

  const handleTermChanged = useCallback(() => {
    fetchTerms(page);
    setList((l) => ({ ...l, termsCount: Math.max(0, l.termsCount) }));
  }, [fetchTerms, page]);

  const handleStatusChanged = useCallback((delta: number) => {
    setList((l) => ({ ...l, statusSum: l.statusSum + delta }));
  }, []);

  async function saveListEdit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/lists/${list._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, description: editDesc, genre: editGenre || undefined }),
    });
    if (res.ok) {
      const updated = await res.json();
      setList((l) => ({ ...l, ...updated }));
      setEditingList(false);
      toast.success("Lista atualizada.");
    } else {
      toast.error("Erro ao atualizar lista.");
    }
  }

  async function handleBulkDecrement() {
    setBulkLoading(true);
    const res = await fetch(`/api/lists/${list._id}/terms`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decrement" }),
    });
    if (res.ok) {
      fetchTerms(page);
    } else {
      toast.error("Erro ao atualizar status.");
    }
    setBulkLoading(false);
  }

  async function handleBulkIncrement() {
    setBulkLoading(true);
    const res = await fetch(`/api/lists/${list._id}/terms`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "increment" }),
    });
    if (res.ok) {
      fetchTerms(page);
    } else {
      toast.error("Erro ao atualizar status.");
    }
    setBulkLoading(false);
  }

  async function handleDeletePerfect() {
    if (!window.confirm("Excluir todos os termos com status 6 (perfeito)? Essa ação não pode ser desfeita.")) return;
    setBulkLoading(true);
    const res = await fetch(`/api/lists/${list._id}/terms`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_perfect" }),
    });
    if (res.ok) {
      const data = await res.json();
      setList((l) => ({ ...l, termsCount: l.termsCount - (data.deleted ?? 0) }));
      fetchTerms(1);
      if (data.deleted > 0) toast.success(`${data.deleted} ${data.deleted === 1 ? "termo excluído" : "termos excluídos"}.`);
      else toast("Nenhum termo com status 6 encontrado.");
    } else {
      toast.error("Erro ao excluir termos.");
    }
    setBulkLoading(false);
  }

  const termCountLocal = list.termsCount;

  const inputCls = "mt-1 w-full rounded-lg border border-slate-300 dark:border-[#2f3d5a] bg-white dark:bg-[#1a2336] text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <ChevronLeft size={16} />
        Dashboard
      </Link>

      {editingList ? (
        <form onSubmit={saveListEdit} className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#243049] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nome</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={120}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Descrição</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              maxLength={500}
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Gênero</label>
            <select
              value={editGenre}
              onChange={(e) => setEditGenre(e.target.value)}
              className={inputCls}
            >
              <option value="">Sem gênero</option>
              {GENRES.map((g) => <option key={g} value={g}>{GENRE_LABELS[g]}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditingList(false)} className="px-4 py-2 text-sm border border-slate-300 dark:border-[#2f3d5a] rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a2336]">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
          </div>
        </form>
      ) : (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#243049] rounded-2xl p-6 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 break-words">{list.name}</h1>
              {list.description && <p className="text-slate-500 dark:text-slate-400 text-sm">{list.description}</p>}
              <div className="flex items-center gap-3 flex-wrap pt-1">
                {list.genre && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GENRE_COLORS[list.genre as Genre]}`}>
                    {GENRE_LABELS[list.genre as Genre]}
                  </span>
                )}
                <span className="text-xs text-slate-400 dark:text-slate-500">{total} {total === 1 ? "termo" : "termos"}</span>
              </div>
            </div>
            <button onClick={() => setEditingList(true)} className="shrink-0 p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Editar lista">
              <Pencil size={16} />
            </button>
          </div>

          {list.termsCount > 0 && (() => {
            const pct = Math.round((list.statusSum / (list.termsCount * 6)) * 100);
            return (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Progresso</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-[#243049] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-[#243049] mt-3">
            <Link
              href={`/lists/${list._id}/flashcards`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Layers size={15} />
              Flashcards
            </Link>
            <Link
              href={`/lists/${list._id}/quiz`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Zap size={15} />
              Quiz
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Termos
            <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">({termCountLocal}/{MAX_TERMS})</span>
          </h2>
          <button
            onClick={handleBulkDecrement}
            disabled={bulkLoading || termCountLocal === 0}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-[#2f3d5a] text-slate-500 dark:text-slate-400 hover:border-red-300 dark:hover:border-red-500 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Diminuir status de todos os termos em 1"
          >
            <TrendingDown size={13} />
            -1
          </button>
          <button
            onClick={handleBulkIncrement}
            disabled={bulkLoading || termCountLocal === 0}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-[#2f3d5a] text-slate-500 dark:text-slate-400 hover:border-green-300 dark:hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Aumentar status de todos os termos em 1"
          >
            <TrendingUp size={13} />
            +1
          </button>
          <button
            onClick={handleDeletePerfect}
            disabled={bulkLoading || termCountLocal === 0}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-[#2f3d5a] text-slate-500 dark:text-slate-400 hover:border-red-400 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Excluir todos os termos com status perfeito (6)"
          >
            <Trash2 size={13} />
            ★6
          </button>
          {termCountLocal < MAX_TERMS && (
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-[#2f3d5a] text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Importar termos via CSV"
            >
              <Upload size={13} />
              CSV
            </button>
          )}
        </div>
        <select
          value={termSort}
          onChange={(e) => setTermSort(e.target.value as Parameters<typeof setTermSort>[0])}
          className="text-sm border border-slate-300 dark:border-[#2f3d5a] bg-white dark:bg-[#1a2336] text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="default">Padrão (mais recentes)</option>
          <option value="reverse">Inversa (mais antigos)</option>
          <option value="status_desc">Maior status primeiro</option>
          <option value="status_asc">Menor status primeiro</option>
        </select>
      </div>

      {termCountLocal < MAX_TERMS ? (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-4">Novo termo</h3>
          <TermForm
            key={formKey}
            listId={list._id}
            autoFocus={formKey > 0}
            showCancel={false}
            onSaved={() => {
              setFormKey((k) => k + 1);
              setList((l) => ({ ...l, termsCount: l.termsCount + 1 }));
              fetchTerms(1);
            }}
            onCancel={() => {}}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 px-5 py-4 text-sm text-amber-700 dark:text-amber-400 text-center">
          Limite de {MAX_TERMS} termos atingido.
        </div>
      )}

      {loading ? (
        <div role="status" aria-label="Carregando termos..." className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonTermItem key={i} />)}
        </div>
      ) : terms.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
          <p className="text-3xl">📝</p>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Nenhum termo ainda.</p>
          <p className="text-sm">Adicione o primeiro termo para começar a estudar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {terms.map((term) => (
            <TermItem
              key={String(term._id)}
              term={term}
              listId={list._id}
              onChanged={handleTermChanged}
              onStatusChanged={handleStatusChanged}
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        pages={pages}
        onPage={(p) => { setPage(p); fetchTerms(p); }}
      />

      <div className="h-4" />

      {showImport && (
        <ImportTermsModal
          listId={list._id}
          remainingSlots={MAX_TERMS - termCountLocal}
          onClose={() => setShowImport(false)}
          onImported={(count) => {
            setList((l) => ({ ...l, termsCount: l.termsCount + count }));
            fetchTerms(1);
          }}
        />
      )}
    </div>
  );
}
