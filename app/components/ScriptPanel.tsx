"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { extractTextFromPdfBuffer } from "@/lib/extractPdfText";
import { parseDialogue } from "@/lib/parseDialogue";
import {
  FACT_CATEGORIES,
  FACT_CATEGORY_LABELS,
  COMMON_ID,
  COMMON_LABEL,
  type FactCategory,
} from "@/lib/factStorage";
import { addFact, useCharacters } from "@/lib/factStore";

type LoadStatus = "idle" | "loading" | "error" | "ready";
type ViewMode = "parsed" | "raw";

export function ScriptPanel() {
  const inputId = useId();
  const characters = useCharacters();

  const [status, setStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [fullText, setFullText] = useState("");
  const [view, setView] = useState<ViewMode>("parsed");
  const [dragOver, setDragOver] = useState(false);

  // 인라인 FACT 작성
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [draftTarget, setDraftTarget] = useState<string>(COMMON_ID);
  const [draftCategory, setDraftCategory] = useState<FactCategory>("character");
  const [draftContent, setDraftContent] = useState("");
  const [savedIdx, setSavedIdx] = useState<number | null>(null);

  const blocks = useMemo(() => parseDialogue(fullText), [fullText]);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("PDF 파일만 올릴 수 있어요.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMessage(null);
    try {
      const buf = await file.arrayBuffer();
      const { fullText: text, pageCount: pages } =
        await extractTextFromPdfBuffer(buf);
      setFullText(text);
      setPageCount(pages);
      setFileName(file.name);
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setErrorMessage(
        e instanceof Error ? e.message : "PDF를 읽는 중 오류가 났어요.",
      );
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setErrorMessage(null);
    setFileName(null);
    setPageCount(null);
    setFullText("");
    setView("parsed");
    setOpenIdx(null);
    setDraftContent("");
    setDraftCategory("character");
    setDraftTarget(COMMON_ID);
    setSavedIdx(null);
  }, []);

  const openComposer = useCallback((idx: number) => {
    setOpenIdx((cur) => (cur === idx ? null : idx));
    setDraftContent("");
    setDraftCategory("character");
    setDraftTarget(COMMON_ID);
    setSavedIdx(null);
  }, []);

  const saveDraft = useCallback(
    (idx: number, evidence: string) => {
      const c = draftContent.trim();
      if (!c) return;
      addFact({
        category: draftCategory,
        content: c,
        evidence,
        characterId: draftTarget,
      });
      setOpenIdx(null);
      setDraftContent("");
      setSavedIdx(idx);
      window.setTimeout(() => {
        setSavedIdx((cur) => (cur === idx ? null : cur));
      }, 2000);
    },
    [draftCategory, draftContent, draftTarget],
  );

  return (
    <section
      aria-labelledby="script-heading"
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <h2 id="script-heading" className="sr-only">
        대본 SCRIPT
      </h2>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          PDF는 브라우저에서만 열리며 서버로 전송되지 않아요.
        </p>
        {status === "ready" && (
          <button
            type="button"
            onClick={reset}
            className="shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            다른 파일
          </button>
        )}
      </div>

      <label
        htmlFor={inputId}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void processFile(f);
        }}
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition sm:py-12",
          dragOver
            ? "border-neutral-900 bg-neutral-50 dark:border-neutral-200 dark:bg-neutral-900/80"
            : "border-neutral-300 bg-white/60 hover:border-neutral-400 hover:bg-neutral-50/80 dark:border-neutral-600 dark:bg-neutral-950/40 dark:hover:border-neutral-500 dark:hover:bg-neutral-900/60",
        ].join(" ")}
      >
        <input
          id={inputId}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void processFile(f);
            e.target.value = "";
          }}
        />
        <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          PDF를 끌어다 놓거나 눌러서 선택
        </span>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          최대 용량은 기기 메모리에 따라 달라요 · 텍스트 레이어가 없는 스캔
          PDF는 글이 비어 나올 수 있어요
        </span>
      </label>

      <div aria-live="polite" className="min-h-[1.25rem] text-sm">
        {status === "loading" && (
          <p className="text-neutral-600 dark:text-neutral-400">
            PDF에서 글자를 읽는 중…
          </p>
        )}
        {status === "error" && errorMessage && (
          <p className="text-red-600 dark:text-red-400">{errorMessage}</p>
        )}
        {status === "ready" && fileName && (
          <p className="text-neutral-700 dark:text-neutral-300">
            <span className="font-medium">{fileName}</span>
            {pageCount != null && (
              <span className="text-neutral-500 dark:text-neutral-400">
                {" "}
                · {pageCount}페이지
              </span>
            )}
          </p>
        )}
      </div>

      {status === "ready" && fullText.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              보기
            </span>
            <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 dark:border-neutral-700 dark:bg-neutral-900">
              <button
                type="button"
                onClick={() => setView("parsed")}
                className={[
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  view === "parsed"
                    ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-50"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                ].join(" ")}
              >
                화자·대사 구분
              </button>
              <button
                type="button"
                onClick={() => setView("raw")}
                className={[
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  view === "raw"
                    ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-50"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                ].join(" ")}
              >
                추출 원문
              </button>
            </div>
            {view === "parsed" && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                + 를 누르면 그 줄을 근거로 FACT를 추가해요
              </span>
            )}
          </div>

          {view === "parsed" ? (
            <ul className="max-h-[min(70vh,42rem)] space-y-3 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950 sm:p-4">
              {blocks.map((b, idx) => {
                const evidence = `${b.speaker}: ${b.text}`;
                const isOpen = openIdx === idx;
                const justSaved = savedIdx === idx;
                return (
                  <li key={idx}>
                    <article className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/50 sm:p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                        <div className="shrink-0 sm:w-36">
                          <span className="inline-block max-w-full truncate rounded-md bg-neutral-200 px-2 py-1 text-xs font-semibold tracking-wide text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100">
                            {b.speaker}
                          </span>
                        </div>
                        <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200 sm:text-base">
                          {b.text}
                        </p>
                        <button
                          type="button"
                          onClick={() => openComposer(idx)}
                          aria-expanded={isOpen}
                          aria-label="이 줄을 근거로 FACT 추가"
                          className={[
                            "shrink-0 rounded-lg border px-2.5 py-1 text-sm font-semibold transition",
                            isOpen
                              ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                              : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                          ].join(" ")}
                        >
                          {isOpen ? "닫기" : "+"}
                        </button>
                      </div>

                      {justSaved && (
                        <p className="mt-2 text-xs font-medium text-green-700 dark:text-green-400">
                          FACT 탭에 추가됐어요
                        </p>
                      )}

                      {isOpen && (
                        <div className="mt-3 space-y-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950">
                          <div className="rounded-md bg-neutral-50 px-3 py-2 dark:bg-neutral-900/80">
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                              근거 (자동 첨부)
                            </p>
                            <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                              {evidence}
                            </p>
                          </div>

                          {/* 인물 선택 */}
                          <div>
                            <span className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                              인물
                            </span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setDraftTarget(COMMON_ID)}
                                className={[
                                  "rounded-lg border px-2.5 py-1.5 text-sm font-medium transition",
                                  draftTarget === COMMON_ID
                                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600",
                                ].join(" ")}
                                aria-pressed={draftTarget === COMMON_ID}
                              >
                                {COMMON_LABEL}
                              </button>
                              {characters.map((c) => {
                                const selected = draftTarget === c.id;
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setDraftTarget(c.id)}
                                    className={[
                                      "rounded-lg border px-2.5 py-1.5 text-sm font-medium transition",
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
                            {characters.length === 0 && (
                              <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                                인물은 FACT 탭에서 추가할 수 있어요
                              </p>
                            )}
                          </div>

                          {/* 카테고리 */}
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {FACT_CATEGORIES.map((cat) => {
                              const selected = draftCategory === cat;
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setDraftCategory(cat)}
                                  className={[
                                    "rounded-lg border px-2 py-2 text-sm font-medium transition",
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

                          <textarea
                            value={draftContent}
                            onChange={(e) => setDraftContent(e.target.value)}
                            rows={2}
                            autoFocus
                            placeholder="이 줄에서 떠오른 FACT를 적어요"
                            className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[15px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
                          />

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setOpenIdx(null)}
                              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              onClick={() => saveDraft(idx, evidence)}
                              disabled={!draftContent.trim()}
                              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                            >
                              FACT로 저장
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  </li>
                );
              })}
            </ul>
          ) : (
            <pre className="max-h-[min(70vh,42rem)] overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-neutral-200 bg-white p-3 text-[13px] leading-relaxed text-neutral-800 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 sm:p-4 sm:text-sm">
              {fullText}
            </pre>
          )}
        </div>
      )}

      {status === "ready" && fullText.length === 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          이 PDF에서는 텍스트를 찾지 못했어요. 스캔본이거나 글자가 이미지로만
          들어간 경우 OCR이 필요해요.
        </p>
      )}
    </section>
  );
}