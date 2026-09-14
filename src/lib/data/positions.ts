export type PositionCategory = {
  id: string;
  name: string;
  order: number;
  positions: string[];
};

export {
  clearPositionCatalogCache,
  getAllPositions,
  loadJobCategories,
  loadPositionCatalog,
  positionExistsInCatalog,
  resolveCategoryId,
} from "@/lib/data/position-catalog";
