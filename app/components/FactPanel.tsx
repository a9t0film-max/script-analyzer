"use client";

import { useCallback, useId, useMemo, useState } from "react";
import {
  FACT_CATEGORIES,
  FACT_CATEGORY_LABELS,
  COMMON_ID,
  COMMON_LABEL,
  type FactCategory,
  type StoredFact,
} from "@/lib/factStorage";
import {
  addFact,
  removeFact,
  addCharacter,
  removeCharacter,
  useFacts,
  useCharacters,
} from "@/lib/factStore";

export function FactPanel() {
  const formId = useId();
  const contentId = `${formId}-content`;
  const evidenceId = `${formId}-evidence`;

  const facts = useFacts();
  const characters = useCharacters();

  const [target, setTarget] = useState<string>(COMMON_ID); // 어느 인물에 추가할지
  const [category, setCategory] = useState<FactCategory>("character");
  const [content, setContent] = useState("");
  const [evidence, setEvidence] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [newCharName, setNewCharName] = useState("");

  // 인물 id → FACT 목록 (최신순)
  const grouped = useMemo(() => {
    const map = new Map<string, StoredFact[]>();
    map.set(COMMON_ID, []);
    for (const c of characters) map.set(c.id, []);
    for (const f of facts) {
      const key = map.has(f.characterId) ? f.characterId : COMMON_ID;
      const arr = map.get(key);
      if (arr) arr.push(f);
    }
    for (const arr of map.values()) arr.sort((a, b) => b.createdAt - a.createdAt);
    return map;
  }, [facts, characters]);

  // 표시 순서: 인물들(생성순) 다음 공통
  const sections = useMemo(() => {
    const list: { id: string; name: string; deletable: boolean }[] = [];
    for (const c of characters) {
      list.push({ id: c.id, name: c.name, deletable: true });
    }
    list.push({ id: COMMON_ID, name: COMMON_LABEL, deletable: false });
    return list;
  }, [characters]);

  const handleSubmit = useCallback(
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
      addFact({ category, content: c, evidence: ev, characterId: target });
      setContent("");
      setEvidence("");
    },
    [category, content, evidence, target],
  );

  const handleAddCharacter = useCallback(() => {
    const name = newCharName.trim();
    if (!name) return;
    const created = addCharacter(name);
    setNewCharName("");
    setTarget(created.id); // 새로 만든 인물을 바로 추가 대상으로
  }, [newCharName]);

  const handleRemoveCharacter = useCallback(
    (id: string, name: string) => {
      const ok = window.confirm(
        `'${name}' 인물을 삭제할까요? 이 인물의 FACT는 '공통'으로 옮겨져요.`,
      );
      if (!ok) return;
      removeCharacter(id);
      setTarget((cur) => (cur === id ? COMMON_ID : cur));
    },
    [],
  );

  return (
    <section
      aria-labelledby="fact-heading"
      className="flex min-h-0 flex-1 flex-col gap-5"
    >
      <h2 id="fact-heading" className="sr-only">
        사실 FACT
      </h2>

      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        인물별로 사실을 정리해요. 인물에 안 묶이는 건 ‘공통’에 둘 수 있어요.
        (이 브라우저에만 저장돼요)
      </p>

      {/* 인물 관리 */}
      <div className="rounded-2xl border border-neutral-200 bg-white/90 p-4 dark:border-neutral-800 dark:bg-neutral-950/50 sm:p-5">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          인물
        </h3>
        <div className="flex flex-wrap gap-2">
          {characters.length === 0 && (
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              아직 인물이 없어요. 아래에서 추가해 보세요.
            </span>
          )}
          {characters.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 py-1 pl-3 pr-1.5 text-sm font-medium text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            >
              {c.name}
              <button
                type="button"
                onClick={() => handleRemoveCharacter(c.id, c.name)}
                aria-label={`${c.name} 삭제`}
                className="rounded-md px-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newCharName}
            onChange={(e) => setNewCharName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCharacter();
              }
            }}
            placeholder="인물 이름 (예: 민수)"
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
          />
          <button
            type="button"
            onClick={handleAddCharacter}
            className="shrink-0 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            추가
          </button>
        </div>
      </div>

      {/* FACT 추가 폼 */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-neutral-200 bg-white/90 p-4 dark:border-neutral-800 dark:bg-neutral-950/50 sm:p-5"
      >
        <fieldset className="space-y-4">
          <legend className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            FACT 추가
          </legend>

          <div>
            <span className="mb-2 block text-sm font-medium text-neutral-800 dark:text-neutral-200">
              인물
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTarget(COMMON_ID)}
                className={[
                  "rounded-xl border px-3 py-2 text-sm font-medium transition",
                  target === COMMON_ID
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600",
                ].join(" ")}
                aria-pressed={target === COMMON_ID}
              >
                {COMMON_LABEL}
              </button>
              {characters.map((c) => {
                const selected = target === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTarget(c.id)}
                    className={[
                      "rounded-xl border px-3 py-2 text-sm font-medium transition",
                      selected
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600",
                    ].join(" ")}
                    aria-pressed={selected}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

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

      {/* 인물별 FACT 목록 */}
      <div className="min-h-0 flex-1 space-y-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          저장된 FACT ({facts.length})
        </h3>

        {sections.map((sec) => {
          const list = grouped.get(sec.id) ?? [];
          return (
            <div key={sec.id || "__common__"}>
              <div className="mb-2 flex items-center gap-2">
                <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {sec.name}
                </h4>
                <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {list.length}
                </span>
              </div>

              {list.length === 0 ? (
                <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/80 px-4 py-5 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400">
                  아직 없음
                </p>
              ) : (
                <ul className="space-y-3">
                  {list.map((f) => (
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
          );
        })}
      </div>
    </section>
  );
}