/**
 * Default position for a dot (parking circle) on a section plan image.
 * Lays out N dots in a grid that fits within the image (with margin) so they don't overlap.
 * @param index 0-based index of the dot within the section (0..total-1)
 * @param total Total number of dots in this section (used to compute grid size)
 * @returns { x, y } in percent (0–100)
 */
export function defaultDotPosition(index: number, total: number): { x: number; y: number } {
  const n = Math.max(1, total);
  const i = Math.max(0, Math.min(index, n - 1));
  const margin = 10;
  const width = 100 - 2 * margin;
  const height = 100 - 2 * margin;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const col = i % cols;
  const row = Math.floor(i / cols);
  const x = cols > 1 ? margin + (col / (cols - 1)) * width : 50;
  const y = rows > 1 ? margin + (row / (rows - 1)) * height : 50;
  return { x, y };
}
