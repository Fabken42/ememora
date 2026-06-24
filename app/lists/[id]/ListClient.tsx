"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Zap, Layers, Pencil, X, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import TermItem from "@/components/TermItem";
import TermForm from "@/components/TermForm";
import Pagination from "@/components/Pagination";
import type { IStudyList } from "@/models/StudyList";
import { GENRES } from "@/models/StudyList.types";
import type { Genre } from "@/models/StudyList.types";
import type { ITerm } from "@/models/Term";
import { GENRE_LABELS, GENRE_COLORS, MAX_TERMS, TERMS_PER_PAGE } from "@/lib/constants";
import { useFilterStore } from "@/store/useFilterStore";

interface ListData {
  _id: string;
  name: string;
  description?: string;
  genre?: string;
  termsCount: number;
}

interface Props {
  list: ListData;
}

interface TermsResponse {
  terms: (ITerm & { _id: string })[];
  total: number;
  page: number;
  pages: number;
}

export default function ListClient({ list: initialList }: Props) {
  const { termSort, setTermSort } = useFilterStore();
  const [list, setList] = useState(initialList);
  const [terms, setTerms] = useState<(ITerm & { _id: string })[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingList, setEditingList] = useState(false);
  const [editName, setEditName] = useState(list.name);
  const [editDesc, setEditDesc] = useState(list.description ?? "");
  const [editGenre, setEditGenre] = useState(list.genre ?? "");

  const fetchTerms = useCallback(async (p = page) => {
    setLoading(true);
    const res = await fetch(`/api/lists/${list._id}/terms?page=${p}&sort=${termSort}`);
    if (res.ok) {
      const data: TermsResponse = await res.json();
      setTerms(data.terms);
      setPage(data.page);
      setPages(data.pages);
      setTotal(data.total);
    }
    setLoading(false);
  }, [list._id, termSort, page]); // eslint-disable-line

  useEffect(() => { fetchTerms(1); }, [termSort, list._id]); // eslint-disable-line

  function handleAddClick() {
    if (list.termsCount >= MAX_TERMS) {
      toast.error(`Limite de ${MAX_TERMS} termos atingido.`);
      return;
    }
    setShowAddForm(true);
  }

  async function saveListEdit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/lists/${list._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, description: editDesc, genre: editGenre || undefined }),
    });
    if (res.ok) {
      const updated = await res.json();
      setList(updated);
      setEditingList(false);
      toast.success("Lista atualizada.");
    } else {
      toast.error("Erro ao atualizar lista.");
    }
  }

  const termCountLocal = list.termsCount;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft size={16} />
        Dashboard
      </Link>

      {editingList ? (
        <form onSubmit={saveListEdit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={120}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              maxLength={500}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Gênero</label>
            <select
              value={editGenre}
              onChange={(e) => setEditGenre(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Sem gênero</option>
              {GENRES.map((g) => <option key={g} value={g}>{GENRE_LABELS[g]}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditingList(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Salvar</button>
          </div>
        </form>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-800 break-words">{list.name}</h1>
              {list.description && <p className="text-slate-500 text-sm">{list.description}</p>}
              <div className="flex items-center gap-3 flex-wrap pt-1">
                {list.genre && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GENRE_COLORS[list.genre as Genre]}`}>
                    {GENRE_LABELS[list.genre as Genre]}
                  </span>
                )}
                <span className="text-xs text-slate-400">{total} {total === 1 ? "termo" : "termos"}</span>
              </div>
            </div>
            <button onClick={() => setEditingList(true)} className="shrink-0 p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Editar lista">
              <Pencil size={16} />
            </button>
          </div>

          <div className="flex gap-2 pt-1 border-t border-slate-100 mt-3">
            <Link
              href={`/lists/${list._id}/flashcards`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
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
        <h2 className="text-lg font-semibold text-slate-800">
          Termos
          <span className="ml-2 text-sm font-normal text-slate-400">({termCountLocal}/{MAX_TERMS})</span>
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={termSort}
            onChange={(e) => setTermSort(e.target.value as Parameters<typeof setTermSort>[0])}
            className="text-sm border border-slate-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="default">Padrão (mais recentes)</option>
            <option value="oldest">Mais antigos primeiro</option>
            <option value="status_desc">Maior status primeiro</option>
            <option value="status_asc">Menor status primeiro</option>
          </select>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} />
            Novo termo
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-indigo-700">Novo termo</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <TermForm
            listId={list._id}
            onSaved={() => {
              setShowAddForm(false);
              setList((l) => ({ ...l, termsCount: l.termsCount + 1 }));
              fetchTerms(1);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : terms.length === 0 ? (
        <div className="text-center py-12 text-slate-400 space-y-2">
          <p className="text-3xl">📝</p>
          <p className="text-slate-600 font-medium">Nenhum termo ainda.</p>
          <p className="text-sm">Adicione o primeiro termo para começar a estudar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {terms.map((term) => (
            <TermItem
              key={String(term._id)}
              term={term}
              listId={list._id}
              onChanged={() => {
                fetchTerms(page);
                setList((l) => ({ ...l, termsCount: Math.max(0, l.termsCount) }));
              }}
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
    </div>
  );
}
