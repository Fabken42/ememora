"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import ImageUpload from "./ImageUpload";
import RichTextEditor from "./RichTextEditor";
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Conceito *</label>
            <RichTextEditor
              value={concept}
              onChange={setConcept}
              placeholder="Digite o conceito..."
              autoFocus={autoFocus}
              maxLength={500}
            />
          </div>
          <ImageUpload value={conceptImage} onChange={setConceptImage} label="Imagem do conceito" />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Definição *</label>
            <RichTextEditor
              value={definition}
              onChange={setDefinition}
              placeholder="Digite a definição..."
              maxLength={1000}
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
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-[#2f3d5a] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a2336] transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
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
