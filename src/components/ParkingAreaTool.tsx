import { useState, useRef, useCallback } from 'react';
import type { ParkingAreaPercent } from '../types/parking';
import './FloorAreaTool.css';

interface ParkingAreaToolProps {
  imageUrl: string;
  onComplete: (areas: Record<number, ParkingAreaPercent>) => void;
  isEdit?: boolean;
  initialAreas?: Record<number, ParkingAreaPercent>;
}

export default function ParkingAreaTool({
  imageUrl,
  onComplete,
  isEdit = false,
  initialAreas = {},
}: ParkingAreaToolProps) {
  const [areas, setAreas] = useState<Record<number, ParkingAreaPercent>>(initialAreas);
  const [currentSection, setCurrentSection] = useState(() => {
    const keys = Object.keys(initialAreas).map(Number);
    return keys.length > 0 ? Math.max(...keys, 0) + 1 : 1;
  });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const sectionNumbers = Object.keys(areas)
    .map(Number)
    .sort((a, b) => a - b);
  const hasCurrentArea = Boolean(areas[currentSection]);

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
      const newAreas = { ...areas, [currentSection]: { x, y, width, height } };
      setAreas(newAreas);
      setDragStart(null);
      setDragCurrent(null);
    }
  };

  const handleClearCurrent = () => {
    setAreas((prev) => {
      const next = { ...prev };
      delete next[currentSection];
      return next;
    });
    setDragStart(null);
    setDragCurrent(null);
  };

  const handleAddSection = () => {
    setDragStart(null);
    setDragCurrent(null);
    setCurrentSection((s) => s + 1);
  };

  const handleBack = () => {
    setDragStart(null);
    setDragCurrent(null);
    setCurrentSection((s) => Math.max(1, s - 1));
  };

  const handleDone = () => {
    onComplete(areas);
  };

  const canDone = sectionNumbers.length > 0;

  return (
    <div className="floor-area-tool">
      <p className="floor-area-tool-hint">
        Draw <strong>one rectangle per section</strong> on the overview image. Each section will get its own plan image in the next step. Drag from one corner to the opposite corner.
      </p>
      <p className="floor-area-tool-step">
        Section {currentSection} — {hasCurrentArea ? '✓ Drawn. Click "Add another section" or draw again to replace.' : 'Drag on the image to draw this section.'}
      </p>
      <div
        className="floor-area-tool-image-wrap"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (dragStart && !dragCurrent) setDragCurrent(dragStart);
          handleMouseUp();
        }}
      >
        <img ref={imageRef} src={imageUrl} alt="Parking overview" className="floor-area-tool-image" draggable={false} />
        {sectionNumbers.map((sn) => {
          const a = areas[sn];
          if (!a) return null;
          return (
            <div
              key={sn}
              className="floor-area-tool-rect floor-area-tool-rect--saved"
              style={{
                left: `${a.x}%`,
                top: `${a.y}%`,
                width: `${a.width}%`,
                height: `${a.height}%`,
              }}
            >
              <span className="floor-area-tool-rect-label">Sec {sn}</span>
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
        {isEdit && hasCurrentArea && (
          <button type="button" className="floor-area-tool-btn floor-area-tool-btn--secondary" onClick={handleClearCurrent}>
            Redraw current section
          </button>
        )}
        {currentSection > 1 && (
          <button type="button" className="floor-area-tool-btn floor-area-tool-btn--secondary" onClick={handleBack}>
            Previous section
          </button>
        )}
        {hasCurrentArea && (
          <button type="button" className="floor-area-tool-btn floor-area-tool-btn--primary" onClick={handleAddSection}>
            Add another section
          </button>
        )}
        {canDone && (
          <button type="button" className="floor-area-tool-btn floor-area-tool-btn--primary" onClick={handleDone}>
            Done
          </button>
        )}
      </div>
    </div>
  );
}
