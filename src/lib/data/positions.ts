export type PositionCategory = {
  id: string;
  name: string;
  positions: string[];
};

type PositionsJson = {
  categories: PositionCategory[];
};

const TURKISH_ALPHABET = "abcçdefgğhıijklmnoöprsştuüvyz";

let cachedCatalog: PositionCategory[] | null = null;

function turkishCompare(a: string, b: string): number {
  const normalize = (value: string) => value.trim().toLocaleLowerCase("tr");
  const left = normalize(a);
  const right = normalize(b);
  const maxLen = Math.max(left.length, right.length);

  for (let i = 0; i < maxLen; i++) {
    const charA = left[i];
    const charB = right[i];

    if (charA === undefined) return -1;
    if (charB === undefined) return 1;

    const indexA = TURKISH_ALPHABET.indexOf(charA);
    const indexB = TURKISH_ALPHABET.indexOf(charB);
    const orderA = indexA === -1 ? TURKISH_ALPHABET.length + charA.charCodeAt(0) : indexA;
    const orderB = indexB === -1 ? TURKISH_ALPHABET.length + charB.charCodeAt(0) : indexB;

    if (orderA !== orderB) {
      return orderA - orderB;
    }
  }

  return 0;
}

export async function loadPositionCatalog(): Promise<PositionCategory[]> {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  const response = await fetch("/positions.json");
  if (!response.ok) {
    throw new Error("Pozisyon kataloğu yüklenemedi.");
  }

  const data = (await response.json()) as PositionsJson;
  cachedCatalog = data.categories.map((category) => ({
    id: category.id,
    name: category.name,
    positions: [...category.positions],
  }));

  return cachedCatalog;
}

export async function getAllPositions(): Promise<string[]> {
  const catalog = await loadPositionCatalog();
  const unique = new Set<string>();

  for (const category of catalog) {
    for (const position of category.positions) {
      const trimmed = position.trim();
      if (trimmed) {
        unique.add(trimmed);
      }
    }
  }

  return Array.from(unique).sort(turkishCompare);
}
