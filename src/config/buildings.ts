import type { BuildingConfig } from '../types/building';
import buildingOutside from '../assets/building_outside.jpeg';

/**
 * Building configurations. Add more buildings here; each needs:
 * - id, name, sectionLabel, floorCount
 * - imageUrl (optional): use custom image, or omit to use generated numbered facade
 * - floors: array of FloorInfo with apartments per floor
 */

/** Floor 1 (ground) = bottom ~18%, Floor 9 (upper) = top ~82%. Tweak to match building photo. */
const TWO_FLOOR_BOUNDS = [82, 100];

export const buildings: BuildingConfig[] = [
  {
    id: 'building-a',
    name: 'Building A',
    sectionLabel: 'A',
    floorCount: 2,
    imageUrl: buildingOutside,
    floorBoundsPercent: TWO_FLOOR_BOUNDS,
    floors: [
      {
        floorNumber: 1,
        section: 'A',
        availableCount: 2,
        apartments: [
          { id: 'a1-1', label: 'A1', floor: 1, section: 'A', area: 65.5, status: 'available', rooms: '2+1' },
          { id: 'a1-2', label: 'A2', floor: 1, section: 'A', area: 72.0, status: 'sold', rooms: '3+1' },
          { id: 'a1-3', label: 'A3', floor: 1, section: 'A', area: 58.2, status: 'available', rooms: '2+1' },
        ],
      },
      {
        floorNumber: 9,
        section: 'A',
        availableCount: 1,
        apartments: [
          { id: 'a9-1', label: 'A20', floor: 9, section: 'A', area: 64.0, status: 'available', rooms: '2+1' },
          { id: 'a9-2', label: 'A21', floor: 9, section: 'A', area: 70.0, status: 'sold', rooms: '3+1' },
        ],
      },
    ],
  },
];

export function getBuildingById(id: string): BuildingConfig | undefined {
  return buildings.find((b) => b.id === id);
}

export function getFloor(buildingId: string, floorNumber: number) {
  const building = getBuildingById(buildingId);
  if (!building) return undefined;
  return building.floors.find((f) => f.floorNumber === floorNumber);
}
