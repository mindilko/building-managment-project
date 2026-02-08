import { getJsonArray, setJsonArray, replaceOrAppend } from './localStorageArray';
import type { BuildingConfig, ApartmentStatus, DotPosition } from '../types/building';

const BUILDINGS_KEY = 'building-management-buildings';

export function getBuildings(): BuildingConfig[] {
  return getJsonArray<BuildingConfig>(BUILDINGS_KEY);
}

export function saveBuilding(building: BuildingConfig): void {
  const list = getBuildings();
  const next = replaceOrAppend(list, building, (b) => b.id === building.id);
  setJsonArray(BUILDINGS_KEY, next);
}

export function getBuildingById(id: string): BuildingConfig | undefined {
  return getBuildings().find((b) => b.id === id);
}

export function deleteBuilding(id: string): void {
  const next = getBuildings().filter((b) => b.id !== id);
  localStorage.setItem(BUILDINGS_KEY, JSON.stringify(next));
}

export function getFloor(buildingId: string, floorNumber: number) {
  const building = getBuildingById(buildingId);
  if (!building) return undefined;
  return building.floors.find((f) => f.floorNumber === floorNumber);
}

export function updateApartmentStatus(
  buildingId: string,
  floorNumber: number,
  apartmentId: string,
  status: ApartmentStatus
): void {
  const building = getBuildingById(buildingId);
  if (!building) return;
  const floors = building.floors.map((f) => {
    if (f.floorNumber !== floorNumber) return f;
    const apartments = f.apartments.map((a) =>
      a.id === apartmentId ? { ...a, status } : a
    );
    const availableCount = apartments.filter((a) => a.status === 'available').length;
    return { ...f, apartments, availableCount };
  });
  saveBuilding({ ...building, floors });
}

export function updateApartmentDotPosition(
  buildingId: string,
  floorNumber: number,
  apartmentId: string,
  dotPosition: DotPosition
): void {
  const building = getBuildingById(buildingId);
  if (!building) return;
  const floors = building.floors.map((f) => {
    if (f.floorNumber !== floorNumber) return f;
    const apartments = f.apartments.map((a) =>
      a.id === apartmentId ? { ...a, dotPosition } : a
    );
    return { ...f, apartments };
  });
  saveBuilding({ ...building, floors });
}
