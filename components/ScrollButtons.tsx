"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function ScrollButtons() {
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(false);

  useEffect(() => {
    function update() {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setShowUp(scrollY > 200);
      setShowDown(maxScroll > 200 && scrollY < maxScroll - 200);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (!showUp && !showDown) return null;

  const btnCls =
    "flex items-center justify-center w-9 h-9 rounded-full bg-slate-700 dark:bg-slate-600 text-white opacity-40 hover:opacity-90 transition-opacity shadow-lg";

  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-2">
      {showUp && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={btnCls}
          aria-label="Ir ao topo"
          title="Ir ao topo"
        >
          <ArrowUp size={16} />
        </button>
      )}
      {showDown && (
        <button
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" })}
          className={btnCls}
          aria-label="Ir ao final"
          title="Ir ao final"
        >
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
}
