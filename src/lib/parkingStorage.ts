import { getJsonArray, setJsonArray, replaceOrAppend } from './localStorageArray';
import type { ParkingConfig, ParkingStatus } from '../types/parking';
import type { DotPosition } from '../types/building';

const PARKINGS_KEY = 'building-management-parkings';

export function getParkings(): ParkingConfig[] {
  return getJsonArray<ParkingConfig>(PARKINGS_KEY);
}

export function saveParking(parking: ParkingConfig): void {
  const list = getParkings();
  const next = replaceOrAppend(list, parking, (p) => p.id === parking.id);
  setJsonArray(PARKINGS_KEY, next);
}

export function getParkingById(id: string): ParkingConfig | undefined {
  return getParkings().find((p) => p.id === id);
}

export function deleteParking(id: string): void {
  const next = getParkings().filter((p) => p.id !== id);
  localStorage.setItem(PARKINGS_KEY, JSON.stringify(next));
}

export function updateParkingSpaceStatus(
  parkingId: string,
  spaceId: string,
  status: ParkingStatus
): void {
  const parking = getParkingById(parkingId);
  if (!parking) return;
  const spaces = parking.spaces.map((s) => (s.id === spaceId ? { ...s, status } : s));
  saveParking({ ...parking, spaces });
}

export function updateParkingSpaceDotPosition(
  parkingId: string,
  spaceId: string,
  dotPosition: DotPosition
): void {
  const parking = getParkingById(parkingId);
  if (!parking) return;
  const spaces = parking.spaces.map((s) =>
    s.id === spaceId ? { ...s, dotPosition } : s
  );
  saveParking({ ...parking, spaces });
}
