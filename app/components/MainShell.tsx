"use client";

import { useState } from "react";
import { FactPanel } from "@/app/components/FactPanel";
import { ScriptPanel } from "@/app/components/ScriptPanel";

type TabId = "script" | "fact";

const tabs: { id: TabId; label: string }[] = [
  { id: "script", label: "대본 (SCRIPT)" },
  { id: "fact", label: "사실 (FACT)" },
];

export function MainShell() {
  const [active, setActive] = useState<TabId>("script");

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 shrink-0 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-2xl">
          대본 분석
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          학습용 · PDF는 브라우저에서만 처리됩니다
        </p>
      </header>

      <nav
        className="mb-4 flex shrink-0 gap-2 sm:gap-3"
        aria-label="기능 탭"
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={[
                "flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition sm:px-4 sm:py-3 sm:text-base",
                isActive
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-800",
              ].join(" ")}
              aria-pressed={isActive}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main className="min-h-0 flex-1">
        {active === "script" && (
          <section className="rounded-2xl border border-neutral-200 bg-white/90 p-4 dark:border-neutral-800 dark:bg-neutral-950/60 sm:p-6">
            <ScriptPanel />
          </section>
        )}
        {active === "fact" && (
          <section className="rounded-2xl border border-neutral-200 bg-white/90 p-4 dark:border-neutral-800 dark:bg-neutral-950/60 sm:p-6">
            <FactPanel />
          </section>
        )}
      </main>
    </div>
  );
}
