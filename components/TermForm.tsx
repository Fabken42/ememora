"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import ImageUpload from "./ImageUpload";
import type { ITerm } from "@/models/Term";

interface Props {
  listId: string;
  term?: ITerm & { _id: string };
  onSaved: () => void;
  onCancel: () => void;
  autoFocus?: boolean;
  showCancel?: boolean;
}

export default function TermForm({ listId, term, onSaved, onCancel, autoFocus, showCancel = true }: Props) {
  const [concept, setConcept] = useState(term?.concept ?? "");
  const [definition, setDefinition] = useState(term?.definition ?? "");
  const [conceptImage, setConceptImage] = useState<string | undefined>(term?.conceptImage);
  const [definitionImage, setDefinitionImage] = useState<string | undefined>(term?.definitionImage);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!concept.trim() || !definition.trim()) {
      toast.error("Conceito e definição são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const url = term
        ? `/api/lists/${listId}/terms/${term._id}`
        : `/api/lists/${listId}/terms`;
      const method = term ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, definition, conceptImage, definitionImage }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar.");

      toast.success(term ? "Termo atualizado." : "Termo criado.");
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Conceito *</label>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Digite o conceito..."
              autoFocus={autoFocus}
              className={inputCls}
              required
            />
          </div>
          <ImageUpload value={conceptImage} onChange={setConceptImage} label="Imagem do conceito" />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Definição *</label>
            <textarea
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Digite a definição..."
              className={inputCls}
              required
            />
          </div>
          <ImageUpload value={definitionImage} onChange={setDefinitionImage} label="Imagem da definição" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {showCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {term ? "Salvar alterações" : "Criar termo"}
        </button>
      </div>
    </form>
  );
}
