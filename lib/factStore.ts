import { useSyncExternalStore } from "react";
import {
  STORAGE_KEY,
  CHARACTERS_KEY,
  COMMON_ID,
  type Character,
  type FactCategory,
  type StoredFact,
  createFactId,
  createCharacterId,
  loadFacts,
  saveFacts,
  loadCharacters,
  saveCharacters,
} from "./factStorage";

const EMPTY_FACTS: StoredFact[] = [];
const EMPTY_CHARS: Character[] = [];

let facts: StoredFact[] | null = null;
let characters: Character[] | null = null;
const listeners = new Set<() => void>();
let storageBound = false;

function ensureFacts(): StoredFact[] {
  if (facts === null) facts = loadFacts();
  return facts;
}
function ensureCharacters(): Character[] {
  if (characters === null) characters = loadCharacters();
  return characters;
}

function emit(): void {
  for (const listener of listeners) listener();
}

function commitFacts(next: StoredFact[]): void {
  facts = next;
  saveFacts(next);
  emit();
}
function commitCharacters(next: Character[]): void {
  characters = next;
  saveCharacters(next);
  emit();
}

function bindStorage(): void {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      facts = loadFacts();
      emit();
    } else if (e.key === CHARACTERS_KEY) {
      characters = loadCharacters();
      emit();
    } else if (e.key === null) {
      facts = loadFacts();
      characters = loadCharacters();
      emit();
    }
  });
}

function subscribe(listener: () => void): () => void {
  bindStorage();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getFactsSnapshot(): StoredFact[] {
  return ensureFacts();
}
function getCharsSnapshot(): Character[] {
  return ensureCharacters();
}

export function useFacts(): StoredFact[] {
  return useSyncExternalStore(
    subscribe,
    getFactsSnapshot,
    () => EMPTY_FACTS,
  );
}
export function useCharacters(): Character[] {
  return useSyncExternalStore(
    subscribe,
    getCharsSnapshot,
    () => EMPTY_CHARS,
  );
}

export type NewFactInput = {
  category: FactCategory;
  content: string;
  evidence: string;
  characterId: string;
};

export function addFact(input: NewFactInput): StoredFact {
  const fact: StoredFact = {
    id: createFactId(),
    createdAt: Date.now(),
    category: input.category,
    content: input.content,
    evidence: input.evidence,
    characterId: input.characterId,
  };
  commitFacts([fact, ...ensureFacts()]);
  return fact;
}

export function removeFact(id: string): void {
  commitFacts(ensureFacts().filter((f) => f.id !== id));
}

export function addCharacter(name: string): Character {
  const character: Character = {
    id: createCharacterId(),
    name,
    createdAt: Date.now(),
  };
  commitCharacters([...ensureCharacters(), character]);
  return character;
}

export function renameCharacter(id: string, name: string): void {
  commitCharacters(
    ensureCharacters().map((c) => (c.id === id ? { ...c, name } : c)),
  );
}

/** 인물 삭제 시, 해당 인물의 FACT는 지우지 않고 공통으로 옮깁니다. */
export function removeCharacter(id: string): void {
  const movedFacts = ensureFacts().map((f) =>
    f.characterId === id ? { ...f, characterId: COMMON_ID } : f,
  );
  commitFacts(movedFacts);
  commitCharacters(ensureCharacters().filter((c) => c.id !== id));
}