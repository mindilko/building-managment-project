export type ApartmentStatus = 'available' | 'in_negotiation' | 'sold';

/** Position of the apartment dot on the floor plan image, as % (0–100). */
export interface DotPosition {
  x: number;
  y: number;
}

export interface Apartment {
  id: string;
  label: string;       // e.g. "B31"
  floor: number;
  section: string;    // e.g. "B"
  area: number;       // m²
  status: ApartmentStatus;
  rooms?: string;     // e.g. "2+1"
  /** Optional: position of the green circle on the floor plan image (%). If not set, a default layout is used. */
  dotPosition?: DotPosition;
}

/** Rectangle as % of image (0–100). Used for custom floor button position/size. */
export interface FloorAreaPercent {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloorInfo {
  floorNumber: number;
  section: string;
  availableCount: number;
  apartments: Apartment[];
  /** Optional floor plan image URL (e.g. blueprint). If not set, a placeholder with apartment list is shown. */
  floorPlanImageUrl?: string;
  /** Optional: custom button shape/position on building image (%). If set, this floor uses a drawn shape instead of a splitter strip. */
  areaPercent?: FloorAreaPercent;
}

export interface BuildingConfig {
  id: string;
  name: string;
  sectionLabel: string;   // e.g. "Section B" -> "B"
  /** Custom building facade image URL. If not set, a numbered facade is generated. */
  imageUrl?: string;
  /** Number of floors (used for overlay regions and generated facade). */
  floorCount: number;
  /** Floors are 1-based (1 = ground/first). */
  floors: FloorInfo[];
  /**
   * Optional: top edge of each floor as % from top of image (0–100). Index 0 = floor 1 (bottom), index 8 = floor 9 (top) = 100.
   * Length must be floorCount; last value should be 100. E.g. [11.1, 22.2, ..., 100] for 9 equal floors.
   * If omitted, floors are split equally.
   */
  floorBoundsPercent?: number[];
  /** Creation time (ms since epoch). Used for sorting. */
  createdAt?: number;
}
