"use client";

import Link from "next/link";
import { BookOpen, Trash2 } from "lucide-react";
import { GENRE_LABELS, GENRE_COLORS } from "@/lib/constants";
import type { IStudyList } from "@/models/StudyList";
import type { Genre } from "@/models/StudyList.types";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Props {
  list: IStudyList & { _id: string };
  onDeleted?: () => void;
}

export default function StudyListCard({ list, onDeleted }: Props) {
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`Excluir a lista "${list.name}"? Esta ação não pode ser desfeita.`)) return;

    const res = await fetch(`/api/lists/${list._id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Lista excluída.");
      onDeleted?.();
      router.refresh();
    } else {
      toast.error("Erro ao excluir lista.");
    }
  }

  return (
    <Link
      href={`/lists/${list._id}`}
      className="group relative bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-800 text-lg leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {list.name}
        </h3>
        <button
          onClick={handleDelete}
          className="shrink-0 text-slate-300 hover:text-red-500 transition-colors p-1 -mr-1 -mt-1"
          title="Excluir lista"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {list.description && (
        <p className="text-sm text-slate-500 line-clamp-2">{list.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        {list.genre ? (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GENRE_COLORS[list.genre as Genre]}`}>
            {GENRE_LABELS[list.genre as Genre]}
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1 text-xs text-slate-400">
          <BookOpen size={13} />
          <span>{list.termsCount} {list.termsCount === 1 ? "termo" : "termos"}</span>
        </div>
      </div>
    </Link>
  );
}
