export type DialogueBlock = {
  speaker: string;
  text: string;
};

const INLINE_SPEAKER = /^(.{1,48}?)\s*[：:]\s*(.+)$/;
const SCENE_HEADING =
  /^(INT\.|EXT\.|INT\/EXT\.|인트\.|익스트\.|장면\.|제\s*\d+\s*장|#\s*\d+)/i;

function isMostlyDialogueLine(line: string): boolean {
  const t = line.trim();
  if (t.length >= 45) return true;
  if (/[.!?…。！？]["」』]?$/.test(t) && t.length >= 12) return true;
  if (
    /^(그래|네|응|아니|하지만|그런데|그리고|그러면|왜냐하면)/.test(t) &&
    t.length > 8
  )
    return true;
  return false;
}

/** `（민수）`·`(MIN)`·`【나레이션】` 등 한 줄 화자 표기 */
function matchBracketSpeakerLine(line: string): string | null {
  const t = line.trim();
  const patterns = [
    /^（([^）]{1,40})）\s*$/,
    /^\(([^)]{1,40})\)\s*$/,
    /^【([^】]{1,40})】\s*$/,
    /^\[([^\]]{1,40})\]\s*$/,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

/** 다음 줄이 대사로 보일 때, 현재 줄을 화자 전용 한 줄로 볼 수 있는지 */
function looksLikeSpeakerOnly(
  line: string,
  nextLine: string | undefined,
): boolean {
  const t = line.trim();
  if (!t || !nextLine || !nextLine.trim()) return false;
  if (t.length > 36) return false;
  if (INLINE_SPEAKER.test(t)) return false;
  if (isMostlyDialogueLine(t)) return false;
  if (SCENE_HEADING.test(t)) return true;
  const nt = nextLine.trim();
  if (nt.length > t.length * 1.2) return true;
  if (/^[「"“'『]/.test(nt)) return true;
  if (t.length <= 18 && nt.length >= 8) return true;
  return false;
}

function isNewInlineTurn(line: string): boolean {
  const m = line.match(INLINE_SPEAKER);
  if (!m) return false;
  const name = m[1].trim();
  return name.length > 0 && name.length <= 40;
}

/**
 * 추출된 평문에서 캐릭터명·대사 패턴을 휴리스틱으로 나눕니다.
 * (`이름: 대사`, 한 줄 이름 + 다음 줄 대사, 장면 슬러그 등)
 */
export function parseDialogue(raw: string): DialogueBlock[] {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized
    .split("\n")
    .map((l) => l.replace(/\u00a0/g, " ").trimEnd());

  const blocks: DialogueBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    while (i < lines.length && !lines[i].trim()) i++;
    if (i >= lines.length) break;

    const line = lines[i];
    const next = i + 1 < lines.length ? lines[i + 1] : "";

    const inline = line.match(INLINE_SPEAKER);
    if (inline) {
      const speaker = inline[1].trim();
      let text = inline[2].trim();
      i++;
      while (i < lines.length && lines[i].trim()) {
        const L = lines[i];
        if (isNewInlineTurn(L)) break;
        if (looksLikeSpeakerOnly(L, lines[i + 1])) break;
        text += "\n" + L.trim();
        i++;
      }
      blocks.push({ speaker: speaker || "미상", text });
      continue;
    }

    const bracketName = matchBracketSpeakerLine(line);
    if (bracketName) {
      const speaker = bracketName;
      i++;
      const parts: string[] = [];
      while (i < lines.length && lines[i].trim()) {
        const L = lines[i];
        if (looksLikeSpeakerOnly(L, lines[i + 1])) break;
        if (isNewInlineTurn(L)) break;
        parts.push(L.trim());
        i++;
      }
      blocks.push({ speaker: speaker || "미상", text: parts.join("\n") });
      continue;
    }

    if (SCENE_HEADING.test(line.trim())) {
      let scene = line.trim();
      i++;
      while (i < lines.length && lines[i].trim()) {
        const L = lines[i];
        if (looksLikeSpeakerOnly(L, lines[i + 1])) break;
        if (isNewInlineTurn(L)) break;
        scene += "\n" + L.trim();
        i++;
      }
      blocks.push({ speaker: "장면", text: scene });
      continue;
    }

    if (looksLikeSpeakerOnly(line, next)) {
      const speaker = line.trim();
      i++;
      const parts: string[] = [];
      while (i < lines.length && lines[i].trim()) {
        const L = lines[i];
        if (looksLikeSpeakerOnly(L, lines[i + 1])) break;
        if (isNewInlineTurn(L)) break;
        parts.push(L.trim());
        i++;
      }
      blocks.push({ speaker, text: parts.join("\n") });
      continue;
    }

    const orphanStart = i;
    const parts: string[] = [];
    while (i < lines.length && lines[i].trim()) {
      const L = lines[i];
      if (
        looksLikeSpeakerOnly(L, lines[i + 1]) ||
        isNewInlineTurn(L) ||
        SCENE_HEADING.test(L.trim())
      ) {
        break;
      }
      parts.push(L.trim());
      i++;
    }
    if (parts.length) {
      blocks.push({
        speaker: "본문",
        text: parts.join("\n"),
      });
    } else {
      i = Math.max(i, orphanStart + 1);
    }
  }

  return blocks;
}
