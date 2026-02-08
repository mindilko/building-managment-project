import type { ParkingConfig, ParkingStatus, DotPosition } from '../types/parking';

const PARKINGS_KEY = 'building-management-parkings';

export function getParkings(): ParkingConfig[] {
  try {
    const raw = localStorage.getItem(PARKINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ParkingConfig[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveParking(parking: ParkingConfig): void {
  const list = getParkings();
  const index = list.findIndex((p) => p.id === parking.id);
  const next = index >= 0 ? list.map((p, i) => (i === index ? parking : p)) : [...list, parking];
  localStorage.setItem(PARKINGS_KEY, JSON.stringify(next));
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
