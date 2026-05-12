type PdfTextChunk = {
  str: string;
  transform: number[];
};

let workerSrcSet = false;

function ensureWorker(pdfjs: typeof import("pdfjs-dist")) {
  if (workerSrcSet) return;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  workerSrcSet = true;
}

function isPdfTextChunk(item: unknown): item is PdfTextChunk {
  if (typeof item !== "object" || item === null) return false;
  const o = item as Record<string, unknown>;
  return typeof o.str === "string" && Array.isArray(o.transform);
}

/** PDF 좌표계 기준으로 줄 단위로 묶어 읽기 순서에 가깝게 복원합니다. */
function textItemsToPlainLines(items: unknown[]): string[] {
  const withPos = items
    .filter(isPdfTextChunk)
    .map((it) => ({
      str: it.str,
      x: it.transform[4],
      y: it.transform[5],
    }))
    .filter((it) => it.str.trim().length > 0);

  if (withPos.length === 0) return [];

  withPos.sort((a, b) => {
    const dy = Math.abs(a.y - b.y);
    if (dy > 2.5) return b.y - a.y;
    return a.x - b.x;
  });

  const lines: string[] = [];
  let row: string[] = [];
  let rowY: number | null = null;
  const rowThreshold = 4;

  for (const it of withPos) {
    if (rowY === null || Math.abs(it.y - rowY) <= rowThreshold) {
      row.push(it.str);
      rowY =
        rowY === null ? it.y : (rowY * (row.length - 1) + it.y) / row.length;
    } else {
      lines.push(row.join(" ").replace(/\s+/g, " ").trim());
      row = [it.str];
      rowY = it.y;
    }
  }
  if (row.length) lines.push(row.join(" ").replace(/\s+/g, " ").trim());

  return lines;
}

export async function extractTextFromPdfBuffer(buffer: ArrayBuffer): Promise<{
  fullText: string;
  pageCount: number;
}> {
  const pdfjs = await import("pdfjs-dist");
  ensureWorker(pdfjs);

  const task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await task.promise;
  const pageCount = pdf.numPages;

  const pageTexts: string[] = [];
  for (let p = 1; p <= pageCount; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const lines = textItemsToPlainLines(content.items);
    pageTexts.push(lines.join("\n"));
  }

  const fullText = pageTexts.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();

  return { fullText, pageCount };
}
