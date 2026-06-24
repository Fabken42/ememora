"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, X } from "lucide-react";
import type { ITerm } from "@/models/Term";
import StatusIcon from "./StatusIcon";
import TermForm from "./TermForm";
import toast from "react-hot-toast";

interface Props {
  term: ITerm & { _id: string };
  listId: string;
  onChanged: () => void;
}

export default function TermItem({ term, listId, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Excluir este termo?")) return;
    setDeleting(true);
    const res = await fetch(`/api/lists/${listId}/terms/${term._id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Termo excluído.");
      onChanged();
    } else {
      toast.error("Erro ao excluir.");
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-indigo-700">Editar termo</h4>
          <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
        <TermForm
          listId={listId}
          term={term}
          onSaved={() => { setEditing(false); onChanged(); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4">
      <div className="flex-1 grid sm:grid-cols-2 gap-3 min-w-0">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Conceito</p>
          <p className="text-sm text-slate-800 break-words">{term.concept}</p>
          {term.conceptImage && (
            <div className="relative h-24 w-full rounded-lg overflow-hidden border border-slate-100">
              <Image src={term.conceptImage} alt="conceito" fill className="object-contain bg-slate-50" />
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Definição</p>
          <p className="text-sm text-slate-800 break-words">{term.definition}</p>
          {term.definitionImage && (
            <div className="relative h-24 w-full rounded-lg overflow-hidden border border-slate-100">
              <Image src={term.definitionImage} alt="definição" fill className="object-contain bg-slate-50" />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 shrink-0">
        <StatusIcon status={term.status} />
        <div className="flex gap-1">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Excluir"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
