"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { extractTextFromPdfBuffer } from "@/lib/extractPdfText";
import { parseDialogue } from "@/lib/parseDialogue";

type LoadStatus = "idle" | "loading" | "error" | "ready";
type ViewMode = "parsed" | "raw";

export function ScriptPanel() {
  const inputId = useId();
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [fullText, setFullText] = useState("");
  const [view, setView] = useState<ViewMode>("parsed");
  const [dragOver, setDragOver] = useState(false);

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
  }, []);

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
                자동 구분은 휴리스틱이라 대본 형식에 따라 어긋날 수 있어요
              </span>
            )}
          </div>

          {view === "parsed" ? (
            <ul className="max-h-[min(70vh,42rem)] space-y-3 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950 sm:p-4">
              {blocks.map((b, idx) => (
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
                    </div>
                  </article>
                </li>
              ))}
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
