"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <BookOpen size={24} />
          Ememora
        </Link>

        {session?.user && (
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="hidden sm:block text-sm text-slate-700 max-w-[140px] truncate">
                {session.user.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
