"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import GameConfigModal from "@/components/GameConfigModal";
import QuizGame from "@/components/QuizGame";
import type { ITerm } from "@/models/Term";
import toast from "react-hot-toast";

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showConfig, setShowConfig] = useState(true);
  const [gameTerms, setGameTerms] = useState<ITerm[] | null>(null);
  const [allTerms, setAllTerms] = useState<ITerm[]>([]);

  useEffect(() => {
    fetch(`/api/lists/${id}/terms?all=true`)
      .then((r) => r.json())
      .then((d) => setAllTerms(d.terms ?? []))
      .catch(() => toast.error("Erro ao carregar termos."));
  }, [id]);

  function handleStart(terms: ITerm[]) {
    setGameTerms(terms);
    setShowConfig(false);
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen">
      <div className="sticky top-0 bg-white border-b border-slate-100 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push(`/lists/${id}`)}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-semibold text-slate-800">Quiz</h1>
        </div>
      </div>

      {showConfig && (
        <GameConfigModal
          listId={id}
          mode="quiz"
          onClose={() => router.push(`/lists/${id}`)}
          onStart={handleStart}
        />
      )}

      {!showConfig && gameTerms && (
        <QuizGame
          listId={id}
          initialTerms={gameTerms}
          allTerms={allTerms}
          onExit={() => router.push(`/lists/${id}`)}
        />
      )}
    </div>
  );
}
