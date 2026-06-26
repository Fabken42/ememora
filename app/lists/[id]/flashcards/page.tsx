"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import GameConfigModal from "@/components/GameConfigModal";
import FlashcardGame from "@/components/FlashcardGame";
import type { ITerm } from "@/models/Term";

// app\lists\[id]\flashcards\page.tsx

export default function FlashcardsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showConfig, setShowConfig] = useState(true);
  const [gameTerms, setGameTerms] = useState<ITerm[] | null>(null);

  function handleStart(terms: ITerm[]) {
    setGameTerms(terms);
    setShowConfig(false);
  }

  function handleExit() {
    setGameTerms(null);
    setShowConfig(true);
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen">
      <div className="sticky top-0 bg-white dark:bg-[#121212] border-b border-slate-100 dark:border-[#2e2e2e] z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push(`/lists/${id}`)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-semibold text-slate-800 dark:text-slate-100">Flashcards</h1>
        </div>
      </div>

      {showConfig && (
        <GameConfigModal
          listId={id}
          mode="flashcards"
          onClose={() => router.push(`/lists/${id}`)}
          onStart={handleStart}
        />
      )}

      {!showConfig && gameTerms && (
        <FlashcardGame
          listId={id}
          initialTerms={gameTerms}
          onExit={handleExit}
        />
      )}
    </div>
  );
}