"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, X, Upload } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  value?: string;
  onChange: (url: string | undefined) => void;
  label: string;
}

export default function ImageUpload({ value, onChange, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  async function uploadFile(file: File) {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Erro no upload.");
      onChange(data.url);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro no upload.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>

      {value ? (
        <div className="relative w-full h-40 rounded-lg overflow-hidden border border-slate-200 group">
          <Image src={value} alt={label} fill className="object-contain bg-slate-50" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={loading}
          className={`w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
            isDragging
              ? "border-blue-500 bg-blue-50 text-blue-600"
              : "border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500"
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload size={20} />
              <span className="text-xs">
                {isDragging ? "Solte para enviar" : "Clique ou arraste uma imagem"}
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileInput}
      />

      {!value && (
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <ImageIcon size={11} /> JPG, PNG, WebP ou GIF • máx. 5MB
        </p>
      )}
    </div>
  );
}
