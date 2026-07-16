"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, X, ChevronUp, ChevronDown } from "lucide-react";
import type { ITerm } from "@/models/Term";
import StatusIcon from "./StatusIcon";
import TermForm from "./TermForm";
import toast from "react-hot-toast";
import { sanitizeHtml } from "@/lib/sanitize";

interface Props {
  term: ITerm & { _id: string };
  listId: string;
  onChanged: () => void;
  onStatusChanged?: (delta: number) => void;
}

const TermItem = memo(function TermItem({ term, listId, onChanged, onStatusChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localStatus, setLocalStatus] = useState(term.status);
  const [statusLoading, setStatusLoading] = useState(false);

  async function handleStatusChange(delta: 1 | -1) {
    const prev = localStatus;
    const newStatus = Math.min(6, Math.max(0, prev + delta));
    if (newStatus === prev) return;
    setLocalStatus(newStatus);
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/lists/${listId}/terms/${term._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onStatusChanged ? onStatusChanged(newStatus - prev) : onChanged();
      } else {
        setLocalStatus(prev);
        toast.error("Erro ao atualizar status.");
      }
    } catch {
      setLocalStatus(prev);
      toast.error("Erro de conexão ao atualizar status.");
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleDelete() {
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
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Editar termo</h4>
          <button onClick={() => setEditing(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
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
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#243049] rounded-xl p-4 flex gap-4">
      <div className="flex-1 grid sm:grid-cols-2 gap-3 min-w-0">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Conceito</p>
          <div className="text-sm text-slate-800 dark:text-slate-100 break-words rich-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(term.concept) }} />
          {term.conceptImage && (
            <div className="relative h-24 w-full rounded-lg overflow-hidden border border-slate-100 dark:border-[#243049]">
              <Image src={term.conceptImage} alt="imagem do conceito" fill sizes="(max-width: 640px) 90vw, 45vw" className="object-contain bg-gray-50 dark:bg-[#1a2336]" />
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Definição</p>
          <div className="text-sm text-slate-800 dark:text-slate-100 break-words rich-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(term.definition) }} />
          {term.definitionImage && (
            <div className="relative h-24 w-full rounded-lg overflow-hidden border border-slate-100 dark:border-[#243049]">
              <Image src={term.definitionImage} alt="imagem da definição" fill sizes="(max-width: 640px) 90vw, 45vw" className="object-contain bg-gray-50 dark:bg-[#1a2336]" />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 shrink-0">
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={() => handleStatusChange(+1)}
            disabled={statusLoading || localStatus >= 6}
            aria-label="Aumentar status"
            className="p-1 text-slate-300 dark:text-slate-600 hover:text-green-500 dark:hover:text-green-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp size={15} />
          </button>
          <StatusIcon status={localStatus} size={20} />
          <button
            onClick={() => handleStatusChange(-1)}
            disabled={statusLoading || localStatus <= 0}
            aria-label="Diminuir status"
            className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown size={15} />
          </button>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setEditing(true)}
            aria-label="Editar termo"
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Excluir termo"
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default TermItem;
