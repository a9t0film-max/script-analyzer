"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  FACT_CATEGORIES,
  FACT_CATEGORY_LABELS,
  type FactCategory,
  type StoredFact,
  createFactId,
  loadFacts,
  saveFacts,
} from "@/lib/factStorage";

export function FactPanel() {
  const formId = useId();
  const contentId = `${formId}-content`;
  const evidenceId = `${formId}-evidence`;

  const [facts, setFacts] = useState<StoredFact[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [category, setCategory] = useState<FactCategory>("character");
  const [content, setContent] = useState("");
  const [evidence, setEvidence] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFacts(loadFacts());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveFacts(facts);
  }, [facts, hydrated]);

  const sortedFacts = useMemo(
    () => [...facts].sort((a, b) => b.createdAt - a.createdAt),
    [facts],
  );

  const addFact = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const c = content.trim();
      const ev = evidence.trim();
      if (!c) {
        setFormError("FACT 내용을 입력해 주세요.");
        return;
      }
      if (!ev) {
        setFormError("근거(페이지·대사 등)를 입력해 주세요.");
        return;
      }
      setFormError(null);
      const next: StoredFact = {
        id: createFactId(),
        createdAt: Date.now(),
        category,
        content: c,
        evidence: ev,
      };
      setFacts((prev) => [next, ...prev]);
      setContent("");
      setEvidence("");
    },
    [category, content, evidence],
  );

  const removeFact = useCallback((id: string) => {
    setFacts((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <section
      aria-labelledby="fact-heading"
      className="flex min-h-0 flex-1 flex-col gap-5"
    >
      <h2 id="fact-heading" className="sr-only">
        사실 FACT
      </h2>

      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        대본에서 떠올린 사실을 메모해 두면 새로고침 후에도 이 브라우저에
        남아요. (다른 기기·브라우저와는 공유되지 않아요)
      </p>

      <form
        onSubmit={addFact}
        className="rounded-2xl border border-neutral-200 bg-white/90 p-4 dark:border-neutral-800 dark:bg-neutral-950/50 sm:p-5"
      >
        <fieldset className="space-y-4">
          <legend className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            FACT 추가
          </legend>

          <div>
            <span className="mb-2 block text-sm font-medium text-neutral-800 dark:text-neutral-200">
              카테고리
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FACT_CATEGORIES.map((cat) => {
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={[
                      "rounded-xl border px-2 py-2.5 text-sm font-medium transition sm:py-3",
                      selected
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600",
                    ].join(" ")}
                    aria-pressed={selected}
                  >
                    {FACT_CATEGORY_LABELS[cat]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor={contentId}
              className="mb-1.5 block text-sm font-medium text-neutral-800 dark:text-neutral-200"
            >
              FACT 내용
            </label>
            <textarea
              id={contentId}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="예: 주인공은 어린 시절 화재를 겪었다"
              className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[15px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
            />
          </div>

          <div>
            <label
              htmlFor={evidenceId}
              className="mb-1.5 block text-sm font-medium text-neutral-800 dark:text-neutral-200"
            >
              근거 (페이지·대사 등)
            </label>
            <textarea
              id={evidenceId}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={2}
              placeholder="예: 12p / 「그날 불이 났을 때…」"
              className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[15px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
            />
          </div>

          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 active:bg-neutral-950 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:active:bg-white sm:w-auto sm:px-8"
          >
            저장
          </button>
        </fieldset>
      </form>

      <div className="min-h-0 flex-1">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          저장된 FACT ({sortedFacts.length})
        </h3>
        {!hydrated ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            불러오는 중…
          </p>
        ) : sortedFacts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 px-4 py-8 text-center text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400">
            아직 저장된 FACT가 없어요. 위 폼에서 하나 추가해 보세요.
          </p>
        ) : (
          <ul className="max-h-[min(60vh,36rem)] space-y-3 overflow-y-auto pr-0.5 sm:max-h-[min(65vh,40rem)]">
            {sortedFacts.map((f) => (
              <li key={f.id}>
                <article className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/60 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex shrink-0 rounded-md bg-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
                          {FACT_CATEGORY_LABELS[f.category]}
                        </span>
                        <time
                          dateTime={new Date(f.createdAt).toISOString()}
                          className="text-xs text-neutral-500 dark:text-neutral-400"
                        >
                          {new Date(f.createdAt).toLocaleString("ko-KR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </time>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-relaxed text-neutral-900 dark:text-neutral-100">
                        {f.content}
                      </p>
                      <div className="rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-900/80">
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                          근거
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                          {f.evidence}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFact(f.id)}
                      className="shrink-0 self-stretch rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:bg-neutral-950 dark:text-red-400 dark:hover:bg-red-950/30 sm:self-start sm:py-2"
                    >
                      삭제
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
