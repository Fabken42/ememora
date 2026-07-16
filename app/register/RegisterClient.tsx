"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function RegisterClient() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao cadastrar.");
        return;
      }
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.ok) {
        router.push("/dashboard");
      } else {
        toast.success("Conta criada! Faça login para continuar.");
        router.push("/login");
      }
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 dark:border-[#2f3d5a] bg-white dark:bg-[#1a2336] text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-[#0a0f1f] dark:to-[#0a0f1f] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-xl w-full max-w-sm p-8 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="bg-blue-600 text-white rounded-2xl p-3">
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Criar conta</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            Cadastre-se para começar a estudar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Nome</label>
            <input type="text" required placeholder="Seu nome" value={form.name} onChange={update("name")} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Email</label>
            <input type="email" required placeholder="seu@email.com" value={form.email} onChange={update("email")} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Senha</label>
            <input type="password" required placeholder="Mínimo 8 caracteres" value={form.password} onChange={update("password")} className={inputClass} />
            <p className="text-xs text-slate-400 dark:text-slate-500">Mínimo 8 caracteres, com maiúscula e número.</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Confirmar senha</label>
            <input type="password" required placeholder="Repita a senha" value={form.confirmPassword} onChange={update("confirmPassword")} className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Cadastrando..." : "Criar conta"}
          </button>
        </form>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
