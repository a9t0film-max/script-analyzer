export type FactCategory = "character" | "relationship" | "event" | "world";

export type StoredFact = {
  id: string;
  createdAt: number;
  category: FactCategory;
  content: string;
  evidence: string;
};

export const FACT_CATEGORY_LABELS: Record<FactCategory, string> = {
  character: "캐릭터",
  relationship: "관계",
  event: "사건",
  world: "세계관",
};

export const FACT_CATEGORIES: FactCategory[] = [
  "character",
  "relationship",
  "event",
  "world",
];

const STORAGE_KEY = "script-analyzer:facts:v1";

function isFactCategory(x: unknown): x is FactCategory {
  return (
    x === "character" ||
    x === "relationship" ||
    x === "event" ||
    x === "world"
  );
}

function isStoredFact(x: unknown): x is StoredFact {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.createdAt === "number" &&
    isFactCategory(o.category) &&
    typeof o.content === "string" &&
    typeof o.evidence === "string"
  );
}

export function loadFacts(): StoredFact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredFact);
  } catch {
    return [];
  }
}

export function saveFacts(facts: StoredFact[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(facts));
}

export function createFactId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
