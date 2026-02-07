import { useState, useRef, useCallback } from 'react';
import type { FloorAreaPercent } from '../types/building';
import './FloorAreaTool.css';

interface FloorAreaToolProps {
  imageUrl: string;
  floorNumbers: number[];
  onComplete: (areas: Record<number, FloorAreaPercent>) => void;
  /** When true, show "Redraw current" (only relevant when editing existing floor areas). */
  isEdit?: boolean;
  /** Existing floor areas (e.g. when editing). When provided, these are shown and can be redrawn. */
  initialAreas?: Record<number, FloorAreaPercent>;
}

export default function FloorAreaTool({ imageUrl, floorNumbers, onComplete, isEdit = false, initialAreas = {} }: FloorAreaToolProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [areas, setAreas] = useState<Record<number, FloorAreaPercent>>(initialAreas);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentFloor = floorNumbers[currentIndex];
  const isLast = currentIndex >= floorNumbers.length - 1;

  /** Use the image element's rect so percentages are relative to the visible image, not the container (avoids letterboxing offset). */
  const getPercent = useCallback((clientX: number, clientY: number) => {
    const img = imageRef.current;
    if (!img) return { x: 0, y: 0 };
    const rect = img.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getPercent(e.clientX, e.clientY);
    setDragStart({ x, y });
    setDragCurrent({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStart) {
      const { x, y } = getPercent(e.clientX, e.clientY);
      setDragCurrent({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (dragStart && dragCurrent) {
      const x = Math.min(dragStart.x, dragCurrent.x);
      const y = Math.min(dragStart.y, dragCurrent.y);
      const width = Math.max(2, Math.abs(dragCurrent.x - dragStart.x));
      const height = Math.max(2, Math.abs(dragCurrent.y - dragStart.y));
      setAreas((prev) => ({
        ...prev,
        [currentFloor]: { x, y, width, height },
      }));
      setDragStart(null);
      setDragCurrent(null);
      if (isLast) {
        onComplete({ ...areas, [currentFloor]: { x, y, width, height } });
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }
  };

  const handleClearCurrent = () => {
    setAreas((prev) => {
      const next = { ...prev };
      delete next[currentFloor];
      return next;
    });
    setDragStart(null);
    setDragCurrent(null);
  };

  const handleBack = () => {
    setDragStart(null);
    setDragCurrent(null);
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const handleDone = () => {
    onComplete(areas);
  };

  const allHaveAreas = floorNumbers.every((fn) => areas[fn]);

  return (
    <div className="floor-area-tool">
      <p className="floor-area-tool-hint">
        Draw a <strong>rectangle</strong> on the image for each floor. Drag from one corner to the opposite corner. The yellow box will become the clickable button for that floor.
      </p>
      <p className="floor-area-tool-step">
        Floor {currentFloor} — {areas[currentFloor] ? '✓ Drawn. Click "Next floor" or draw again to replace.' : 'Drag on the image to draw the button area.'}
      </p>
      <div
        ref={containerRef}
        className="floor-area-tool-image-wrap"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (dragStart && !dragCurrent) setDragCurrent(dragStart);
          handleMouseUp();
        }}
      >
        <img ref={imageRef} src={imageUrl} alt="Building" className="floor-area-tool-image" draggable={false} />
        {floorNumbers.map((fn) => {
          const a = areas[fn];
          if (!a) return null;
          return (
            <div
              key={fn}
              className="floor-area-tool-rect floor-area-tool-rect--saved"
              style={{
                left: `${a.x}%`,
                top: `${a.y}%`,
                width: `${a.width}%`,
                height: `${a.height}%`,
              }}
            >
              <span className="floor-area-tool-rect-label">{fn}</span>
            </div>
          );
        })}
        {dragStart && dragCurrent && (
          <div
            className="floor-area-tool-rect floor-area-tool-rect--preview"
            style={{
              left: `${Math.min(dragStart.x, dragCurrent.x)}%`,
              top: `${Math.min(dragStart.y, dragCurrent.y)}%`,
              width: `${Math.max(2, Math.abs(dragCurrent.x - dragStart.x))}%`,
              height: `${Math.max(2, Math.abs(dragCurrent.y - dragStart.y))}%`,
            }}
          />
        )}
      </div>
      <div className="floor-area-tool-actions">
        {isEdit && (
          <button type="button" className="floor-area-tool-btn floor-area-tool-btn--secondary" onClick={handleClearCurrent}>
            Redraw current
          </button>
        )}
        {currentIndex > 0 && (
          <button type="button" className="floor-area-tool-btn floor-area-tool-btn--secondary" onClick={handleBack}>
            Previous floor
          </button>
        )}
        {areas[currentFloor] && !isLast && (
          <button
            type="button"
            className="floor-area-tool-btn floor-area-tool-btn--primary"
            onClick={() => setCurrentIndex((i) => i + 1)}
          >
            Next floor
          </button>
        )}
        {allHaveAreas && (
          <button type="button" className="floor-area-tool-btn floor-area-tool-btn--primary" onClick={handleDone}>
            Done
          </button>
        )}
      </div>
    </div>
  );
}
