import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PositionCategory } from "@/lib/data/positions";

const TURKISH_ALPHABET = "abcçdefgğhıijklmnoöprsştuüvyz";

/** Mobil ile uyumlu: Firestore `avukatlik` → web `hukuk` */
export function resolveCategoryId(id: string): string {
  return id === "avukatlik" ? "hukuk" : id;
}

function turkishCompare(a: string, b: string): number {
  const left = a.trim().toLocaleLowerCase("tr");
  const right = b.trim().toLocaleLowerCase("tr");
  const maxLen = Math.max(left.length, right.length);

  for (let i = 0; i < maxLen; i++) {
    const charA = left[i];
    const charB = right[i];
    if (charA === undefined) return -1;
    if (charB === undefined) return 1;

    const indexA = TURKISH_ALPHABET.indexOf(charA);
    const indexB = TURKISH_ALPHABET.indexOf(charB);
    const orderA =
      indexA === -1 ? TURKISH_ALPHABET.length + charA.charCodeAt(0) : indexA;
    const orderB =
      indexB === -1 ? TURKISH_ALPHABET.length + charB.charCodeAt(0) : indexB;

    if (orderA !== orderB) return orderA - orderB;
  }

  return 0;
}

function normalizePositions(positions: unknown): string[] {
  if (!Array.isArray(positions)) return [];
  return positions
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

let cachedCatalog: PositionCategory[] | null = null;

async function loadAssetCatalog(): Promise<PositionCategory[]> {
  const response = await fetch("/positions.json");
  if (!response.ok) {
    throw new Error("Pozisyon kataloğu yüklenemedi.");
  }

  const data = (await response.json()) as {
    categories: Array<{
      id: string;
      name: string;
      positions: string[];
    }>;
  };

  return data.categories.map((category, index) => ({
    id: resolveCategoryId(category.id),
    name: category.name,
    order: index,
    positions: normalizePositions(category.positions),
  }));
}

export async function loadPositionCatalog(): Promise<PositionCategory[]> {
  if (cachedCatalog) return cachedCatalog;

  try {
    const snap = await getDocs(collection(db, "position_catalog"));
    if (!snap.empty) {
      const fromFirestore = snap.docs
        .map((docSnap) => {
          const data = docSnap.data();
          const name = typeof data.name === "string" ? data.name.trim() : "";
          if (!name) return null;

          return {
            id: resolveCategoryId(docSnap.id),
            name,
            order: typeof data.order === "number" ? data.order : 0,
            positions: normalizePositions(data.positions),
          };
        })
        .filter((item): item is PositionCategory => item !== null)
        .sort(
          (a, b) => a.order - b.order || a.name.localeCompare(b.name, "tr"),
        );

      if (fromFirestore.length > 0) {
        cachedCatalog = fromFirestore;
        return cachedCatalog;
      }
    }
  } catch (error) {
    console.warn("[position-catalog] Firestore yüklenemedi, JSON kullanılıyor:", error);
  }

  cachedCatalog = await loadAssetCatalog();
  return cachedCatalog;
}

export function clearPositionCatalogCache() {
  cachedCatalog = null;
}

export async function getAllPositions(): Promise<string[]> {
  const catalog = await loadPositionCatalog();
  const unique = new Set<string>();

  for (const category of catalog) {
    for (const position of category.positions) {
      unique.add(position);
    }
  }

  return Array.from(unique).sort(turkishCompare);
}

export async function loadJobCategories(): Promise<
  { id: string; label: string }[]
> {
  const catalog = await loadPositionCatalog();
  return catalog.map((category) => ({
    id: category.id,
    label: category.name,
  }));
}

export function positionExistsInCatalog(
  catalog: PositionCategory[],
  text: string,
): boolean {
  const query = text.trim().toLocaleLowerCase("tr");
  if (!query) return false;

  return catalog.some((category) =>
    category.positions.some(
      (position) => position.toLocaleLowerCase("tr") === query,
    ),
  );
}
