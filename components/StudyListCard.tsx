"use client";

import { memo } from "react";
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

const StudyListCard = memo(function StudyListCard({ list, onDeleted }: Props) {
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
      className="group relative bg-white dark:bg-[#1c1c1c] rounded-xl border border-slate-200 dark:border-[#2e2e2e] p-5 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {list.name}
        </h3>
        <button
          onClick={handleDelete}
          aria-label={`Excluir lista ${list.name}`}
          className="shrink-0 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 -mr-1 -mt-1"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {list.description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{list.description}</p>
      )}

      {list.termsCount > 0 && (() => {
        const pct = Math.round(((list.statusSum ?? 0) / (list.termsCount * 6)) * 100);
        return (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>Progresso</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-[#2e2e2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })()}

      <div className="flex items-center justify-between mt-auto pt-1">
        {list.genre ? (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GENRE_COLORS[list.genre as Genre]}`}>
            {GENRE_LABELS[list.genre as Genre]}
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <BookOpen size={13} />
          <span>{list.termsCount} {list.termsCount === 1 ? "termo" : "termos"}</span>
        </div>
      </div>
    </Link>
  );
});

export default StudyListCard;
