"use client";

import { useState, useRef, useCallback } from "react";
import { X, Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { escapeHtml } from "@/lib/sanitize";

interface ParsedTerm {
  concept: string;
  definition: string;
}

interface ParseResult {
  valid: ParsedTerm[];
  invalidLines: number[];
}

function parseField(line: string, pos: number): { value: string; next: number } | null {
  if (pos >= line.length) return { value: "", next: pos };

  if (line[pos] === '"') {
    // Quoted field — supports embedded commas and escaped quotes ("")
    let value = "";
    let i = pos + 1;
    while (i < line.length) {
      if (line[i] === '"') {
        if (line[i + 1] === '"') { value += '"'; i += 2; }
        else { i++; break; }
      } else {
        value += line[i];
        i++;
      }
    }
    // Skip optional whitespace after closing quote before comma/end
    while (i < line.length && line[i] === " ") i++;
    return { value, next: i };
  }

  // Unquoted field — read until first comma
  const end = line.indexOf(",", pos);
  const value = end === -1 ? line.slice(pos) : line.slice(pos, end);
  return { value, next: end === -1 ? line.length : end };
}

function parseCSVLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const conceptResult = parseField(trimmed, 0);
  if (!conceptResult) return null;
  if (conceptResult.next >= trimmed.length || trimmed[conceptResult.next] !== ",") return null;

  const definitionResult = parseField(trimmed, conceptResult.next + 1);
  if (!definitionResult) return null;

  const concept = conceptResult.value.trim();
  const definition = definitionResult.value.trim();
  if (!concept || !definition) return null;

  // Escape HTML to prevent XSS, then convert \n literal to <br> for line breaks
  return [
    escapeHtml(concept).replace(/\\n/g, "<br>"),
    escapeHtml(definition).replace(/\\n/g, "<br>"),
  ];
}

function parseCSV(text: string): ParseResult {
  const lines = text.split("\n");
  const valid: ParsedTerm[] = [];
  const invalidLines: number[] = [];

  lines.forEach((raw, i) => {
    if (!raw.trim()) return;
    const result = parseCSVLine(raw);
    if (!result) { invalidLines.push(i + 1); return; }
    valid.push({ concept: result[0], definition: result[1] });
  });

  return { valid, invalidLines };
}

interface Props {
  listId: string;
  remainingSlots: number;
  onClose: () => void;
  onImported: (count: number) => void;
}

export default function ImportTermsModal({ listId, remainingSlots, onClose, onImported }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = text.trim() ? parseCSV(text) : null;
  const toImport = parsed ? Math.min(parsed.valid.length, remainingSlots) : 0;
  const willSkipLimit = parsed && parsed.valid.length > remainingSlots;

  function loadFile(file: File) {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Apenas arquivos .csv são suportados.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setText((e.target?.result as string) ?? "");
    reader.readAsText(file, "utf-8");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, []);

  async function handleImport() {
    if (!parsed || toImport === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lists/${listId}/terms/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms: parsed.valid.slice(0, remainingSlots) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao importar.");
      toast.success(`${data.inserted} ${data.inserted === 1 ? "termo importado" : "termos importados"}!`);
      onImported(data.inserted);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-[#2e2e2e] shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Importar termos via CSV</h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">

          {/* Format hint */}
          <div className="bg-slate-50 dark:bg-[#252525] rounded-xl p-4 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-200">Formato esperado</p>
            <p>Uma linha por termo, conceito e definição separados por vírgula. Campos com vírgula devem estar entre aspas. Use <code className="bg-white dark:bg-[#2e2e2e] px-1 rounded">\n</code> para quebrar linhas:</p>
            <pre className="mt-2 font-mono bg-white dark:bg-[#2e2e2e] rounded-lg p-2 text-slate-700 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap">
              {`fotossíntese,processo pelo qual plantas\\nconvertem luz em energia\n"mitose","divisão celular que gera, duas células"`}
            </pre>
          </div>

          {/* Drop zone / file upload */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors ${
              dragging
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30"
                : "border-slate-200 dark:border-[#383838] hover:border-blue-300 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-[#252525]"
            }`}
          >
            <Upload size={20} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Clique ou arraste um arquivo .csv</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">O conteúdo será carregado na área abaixo</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Textarea */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Ou cole o conteúdo diretamente
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={"fotossíntese,processo pelo qual plantas convertem luz em energia\nmitose,divisão celular que gera duas células idênticas"}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-[#383838] bg-white dark:bg-[#252525] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Parse feedback */}
          {parsed && (
            <div className="space-y-2 text-sm">
              {parsed.valid.length > 0 && (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>
                    <strong>{toImport}</strong> {toImport === 1 ? "termo válido" : "termos válidos"} para importar
                    {willSkipLimit && (
                      <span className="text-amber-600 dark:text-amber-400 ml-1">
                        ({parsed.valid.length - remainingSlots} ignorados — limite da lista)
                      </span>
                    )}
                  </span>
                </div>
              )}
              {parsed.invalidLines.length > 0 && (
                <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>
                    {parsed.invalidLines.length} {parsed.invalidLines.length === 1 ? "linha inválida" : "linhas inválidas"} ignoradas
                    {" "}(sem vírgula ou campos vazios): linhas {parsed.invalidLines.slice(0, 5).join(", ")}{parsed.invalidLines.length > 5 ? "…" : ""}
                  </span>
                </div>
              )}
              {parsed.valid.length === 0 && parsed.invalidLines.length > 0 && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>Nenhum termo válido encontrado. Verifique o formato.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-slate-100 dark:border-[#2e2e2e] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-[#383838] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#252525]"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={loading || toImport === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText size={14} />
            )}
            Importar {toImport > 0 ? `${toImport} termos` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
