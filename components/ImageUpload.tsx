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

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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
          disabled={loading}
          className="w-full h-32 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors disabled:opacity-60"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload size={20} />
              <span className="text-xs">Clique para enviar imagem</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />

      {!value && (
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <ImageIcon size={11} /> JPG, PNG, WebP ou GIF • máx. 5MB
        </p>
      )}
    </div>
  );
}
