"use client";

export const STORAGE_KEY = "script-analyzer:facts:v1";
export const CHARACTERS_KEY = "script-analyzer:characters:v1";
export const COMMON_ID = "common";
export const COMMON_LABEL = "공통";

export const FACT_CATEGORIES = [
  "character",
  "relationship",
  "event",
  "world",
] as const;

export type FactCategory = (typeof FACT_CATEGORIES)[number];

export const FACT_CATEGORY_LABELS: Record<FactCategory, string> = {
  character: "캐릭터",
  relationship: "관계",
  event: "사건",
  world: "세계관",
};

export type Character = {
  id: string;
  name: string;
  createdAt: number;
};

export type StoredFact = {
  id: string;
  createdAt: number;
  category: FactCategory;
  content: string;
  evidence: string;
  characterId: string;
};

export function createFactId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `fact-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createCharacterId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `char-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isFactCategory(value: unknown): value is FactCategory {
  return (
    typeof value === "string" &&
    (FACT_CATEGORIES as readonly string[]).includes(value)
  );
}

function isValidFact(value: unknown): value is StoredFact {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.createdAt === "number" &&
    isFactCategory(v.category) &&
    typeof v.content === "string" &&
    typeof v.evidence === "string"
  );
}

function isValidCharacter(value: unknown): value is Character {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.createdAt === "number"
  );
}

/** 옛 데이터(characterId 없음)는 모두 "공통"으로 취급합니다. */
export function loadFacts(): StoredFact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidFact).map((f) => ({
      ...f,
      characterId:
        typeof (f as StoredFact).characterId === "string"
          ? (f as StoredFact).characterId
          : COMMON_ID,
    }));
  } catch {
    return [];
  }
}

export function saveFacts(facts: StoredFact[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(facts));
  } catch {
    // 저장 실패는 조용히 무시 (예: 용량 초과)
  }
}

export function loadCharacters(): Character[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHARACTERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCharacter);
  } catch {
    return [];
  }
}

export function saveCharacters(characters: Character[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
  } catch {
    // 저장 실패는 조용히 무시
  }
}