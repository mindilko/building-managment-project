import { useState, useRef, useCallback } from 'react';
import { plural } from '../lib/utils';
import './FloorSplitTool.css';

interface FloorSplitToolProps {
  imageUrl: string;
  floorCount: number;
  onComplete: (boundsPercent: number[]) => void;
}

export default function FloorSplitTool({ imageUrl, floorCount, onComplete }: FloorSplitToolProps) {
  const [bounds, setBounds] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const needed = floorCount - 1;

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (bounds.length >= needed) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const percent = Math.max(2, Math.min(98, (y / rect.height) * 100));
      const next = [...bounds, percent].sort((a, b) => a - b);
      setBounds(next);
    },
    [bounds, needed]
  );

  const handleReset = () => setBounds([]);

  const handleDone = () => {
    if (bounds.length !== needed) return;
    const sorted = [...bounds].sort((a, b) => a - b);
    onComplete([...sorted, 100]);
  };

  return (
    <div className="floor-split-tool">
      <p className="floor-split-tool-hint">
        Click where each floor meets the next (top to bottom). You’ll get one yellow strip per floor. Place {needed} {plural(needed, 'boundary line', 'boundary lines')}.
      </p>
      <div
        ref={containerRef}
        className="floor-split-tool-image-wrap"
        onClick={handleImageClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLElement).click()}
        aria-label="Click to place floor boundary"
      >
        <img src={imageUrl} alt="Building" className="floor-split-tool-image" draggable={false} />
        {bounds.map((pct, i) => (
          <div
            key={i}
            className="floor-split-tool-line"
            style={{ top: `${pct}%` }}
          />
        ))}
      </div>
      <div className="floor-split-tool-status">
        Placed {bounds.length} of {needed} {plural(bounds.length, 'boundary', 'boundaries')}.
      </div>
      <div className="floor-split-tool-actions">
        <button type="button" onClick={handleReset} className="floor-split-tool-btn floor-split-tool-btn--secondary">
          Reset
        </button>
        <button
          type="button"
          onClick={handleDone}
          disabled={bounds.length !== needed}
          className="floor-split-tool-btn floor-split-tool-btn--primary"
        >
          Done
        </button>
      </div>
    </div>
  );
}
