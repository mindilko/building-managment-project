import type { DotPosition } from './building';

/** Same status set as apartments. */
export type ParkingStatus = 'available' | 'in_negotiation' | 'sold';

/** Rectangle as % of image (0–100). Used for drawn section area on overview image. */
export interface ParkingAreaPercent {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One section drawn on the overview image: area on overview + plan image for circles + space count. */
export interface ParkingSection {
  /** Drawn rectangle on the overview image (%). */
  area: ParkingAreaPercent;
  /** Image used for circle management (plan view) in this section. */
  planImageUrl: string;
  /** Number of parking spaces in this section. */
  spaceCount: number;
}

export interface ParkingSpace {
  id: string;
  label: string; // e.g. "P1"
  status: ParkingStatus;
  /** Which section (index) this space belongs to; dots are shown on that section's plan image. */
  sectionIndex: number;
  /** Position of the circle on the section's plan image (%). */
  dotPosition?: DotPosition;
}

export interface ParkingConfig {
  id: string;
  name: string;
  /** Overview image (big picture) with drawn sections. */
  overviewImageUrl: string;
  sections: ParkingSection[];
  spaces: ParkingSpace[];
  createdAt?: number;
}
