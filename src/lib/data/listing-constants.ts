export const SALARY_LADDER: number[] = [
  28000, 30000, 32000, 35000, 40000, 45000, 50000, 55000, 60000, 70000, 80000,
  90000, 100000,
];

export const SALARY_UPPER_LIMIT = 100000;

export const WORK_TYPES: { id: string; label: string }[] = [
  { id: "fullTime", label: "Tam Zamanlı" },
  { id: "partTime", label: "Yarı Zamanlı" },
  { id: "freelance", label: "Serbest / Proje Bazlı" },
  { id: "daily", label: "Günlük İşler" },
];

export function usesSalaryRange(workTypeId: string): boolean {
  return workTypeId === "fullTime" || workTypeId === "partTime";
}

export function workTypeLabelFromId(id: string): string {
  return WORK_TYPES.find((type) => type.id === id)?.label ?? id;
}

export function workTypeIdFromLabel(label: string): string {
  const byId = WORK_TYPES.find((type) => type.id === label);
  if (byId) {
    return byId.id;
  }
  return WORK_TYPES.find((type) => type.label === label)?.id ?? "";
}

export function usesSalaryRangeByLabel(label: string): boolean {
  return label === "Tam Zamanlı" || label === "Yarı Zamanlı";
}

export const WORK_SHIFTS: string[] = ["Gündüz", "Gece"];

export const BENEFITS: string[] = ["Prim", "Yol", "Yemek", "Sigorta"];

export function formatTry(value: number): string {
  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function salaryToStorage(
  minIndex: number,
  maxIndex: number,
): { min: string; max: string | null } {
  const minValue = SALARY_LADDER[minIndex] ?? SALARY_LADDER[0];
  const maxValue = SALARY_LADDER[maxIndex] ?? minValue;

  if (minValue >= SALARY_UPPER_LIMIT) {
    return { min: String(minValue), max: null };
  }

  return { min: String(minValue), max: String(maxValue) };
}

function findNearestLadderIndex(value: number): number {
  let bestIndex = 0;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let i = 0; i < SALARY_LADDER.length; i++) {
    const diff = Math.abs(SALARY_LADDER[i] - value);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function salaryIndicesFromStorage(
  minStr: string | null,
  maxStr: string | null,
): { minIndex: number; maxIndex: number } | null {
  if (!minStr) {
    return null;
  }

  const minValue = Number(minStr);
  if (Number.isNaN(minValue)) {
    return null;
  }

  let minIndex = findNearestLadderIndex(minValue);
  let maxIndex: number;

  if (!maxStr) {
    maxIndex = minIndex;
  } else {
    const maxValue = Number(maxStr);
    maxIndex = Number.isNaN(maxValue)
      ? minIndex
      : findNearestLadderIndex(maxValue);
  }

  if (maxIndex < minIndex) {
    maxIndex = minIndex;
  }

  return { minIndex, maxIndex };
}

export function formatSalaryDisplay(
  min: string | null,
  max: string | null,
): string | null {
  if (!min) {
    return null;
  }

  const minValue = Number(min);
  if (Number.isNaN(minValue)) {
    return null;
  }

  if (!max) {
    if (minValue >= SALARY_UPPER_LIMIT) {
      return `₺${formatTry(minValue)}+`;
    }
    return `₺${formatTry(minValue)}`;
  }

  const maxValue = Number(max);
  if (Number.isNaN(maxValue)) {
    return `₺${formatTry(minValue)}`;
  }

  if (minValue === maxValue) {
    return `₺${formatTry(minValue)}`;
  }

  return `₺${formatTry(minValue)} – ₺${formatTry(maxValue)}`;
}
