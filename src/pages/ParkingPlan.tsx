import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getParkingById, updateParkingSpaceStatus, updateParkingSpaceDotPosition } from '../lib/parkingStorage';
import { defaultDotPosition } from '../lib/dotPosition';
import type { ParkingStatus } from '../types/parking';
import type { DotPosition } from '../types/building';
import './FloorPlan.css';

const STATUS_OPTIONS: ParkingStatus[] = ['available', 'in_negotiation', 'sold'];

const statusLabels: Record<string, string> = {
  available: 'Available',
  in_negotiation: 'In negotiation',
  sold: 'Sold',
};

const statusClass: Record<string, string> = {
  available: 'apartment-card--available',
  in_negotiation: 'apartment-card--in-negotiation',
  sold: 'apartment-card--sold',
};

export default function ParkingPlan() {
  const { parkingId, sectionIndex } = useParams<{ parkingId: string; sectionIndex: string }>();
  const sectionIdx = sectionIndex ? parseInt(sectionIndex, 10) : 0;
  const [parking, setParking] = useState(() => (parkingId ? getParkingById(parkingId) : undefined));
  const dotsContainerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<DotPosition | null>(null);
  const dragPositionRef = useRef<DotPosition | null>(null);
  dragPositionRef.current = dragPosition;

  useEffect(() => {
    if (parkingId) setParking(getParkingById(parkingId));
  }, [parkingId]);

  const section = parking?.sections?.[sectionIdx];
  const spacesInSection = parking?.spaces.filter((s) => s.sectionIndex === sectionIdx) ?? [];

  const handleStatusChange = (spaceId: string, status: ParkingStatus) => {
    if (!parkingId || !parking) return;
    updateParkingSpaceStatus(parkingId, spaceId, status);
    setParking(getParkingById(parkingId));
  };

  const getPercentFromEvent = useCallback((clientX: number, clientY: number): DotPosition => {
    const el = dotsContainerRef.current;
    if (!el) return { x: 50, y: 50 };
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }, []);

  const handleDotMouseDown = (e: React.MouseEvent, spaceId: string) => {
    if ((e.target as HTMLElement).closest('select')) return;
    e.preventDefault();
    const space = spacesInSection.find((s) => s.id === spaceId);
    const i = spacesInSection.findIndex((s) => s.id === spaceId);
    const total = spacesInSection.length;
    const pos = space?.dotPosition ?? defaultDotPosition(i >= 0 ? i : 0, total);
    setDraggingId(spaceId);
    setDragPosition(pos);
  };

  useEffect(() => {
    if (!draggingId) return;
    const onMove = (e: MouseEvent) => setDragPosition(getPercentFromEvent(e.clientX, e.clientY));
    const onUp = () => {
      if (parkingId && parking && draggingId) {
        const pos = dragPositionRef.current ?? { x: 50, y: 50 };
        updateParkingSpaceDotPosition(parkingId, draggingId, pos);
        setParking(getParkingById(parkingId));
      }
      setDraggingId(null);
      setDragPosition(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingId, parkingId, getPercentFromEvent]);

  if (!parking) {
    return (
      <div className="floor-plan floor-plan--error">
        <p>Parking not found.</p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  if (!section || sectionIdx < 0 || sectionIdx >= parking.sections.length) {
    return (
      <div className="floor-plan floor-plan--error">
        <p>Section not found.</p>
        <Link to={`/parking/${parking.id}`}>← {parking.name}</Link>
      </div>
    );
  }

  const availableCount = spacesInSection.filter((s) => s.status === 'available').length;

  return (
    <div className="floor-plan">
      <header className="floor-plan-header">
        <Link to={`/parking/${parking.id}`} className="back-link">
          ← {parking.name}
        </Link>
        <h1>Section {sectionIdx + 1} – plan</h1>
        <p className="floor-plan-available">
          {availableCount} of {spacesInSection.length} spaces available
        </p>
        {parking.sections.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {parking.sections.map((_, i) => (
              <Link
                key={i}
                to={`/parking/${parking.id}/plan/${i}`}
                className={i === sectionIdx ? 'floor-plan-section-link--current' : ''}
                style={{ fontSize: '0.9rem', color: 'var(--accent)' }}
              >
                Section {i + 1}
              </Link>
            ))}
          </div>
        )}
      </header>

      <div className="floor-plan-content">
        <div className="floor-plan-visual">
          <div ref={dotsContainerRef} className="floor-plan-image" style={{ backgroundImage: `url(${section.planImageUrl})` }}>
            <div className="apartment-dots">
              {spacesInSection.map((space, i) => {
                const displayStatus = space.status;
                const total = spacesInSection.length;
                const pos = draggingId === space.id && dragPosition
                  ? dragPosition
                  : (space.dotPosition ?? defaultDotPosition(i, total));
                return (
                  <div
                    key={space.id}
                    className={`apartment-dot apartment-dot--${displayStatus.replace('_', '-')} ${draggingId === space.id ? 'apartment-dot--dragging' : ''}`}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    title={`${space.label} – ${statusLabels[displayStatus]}. Drag to move.`}
                    onMouseDown={(e) => handleDotMouseDown(e, space.id)}
                  >
                    {space.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="apartment-list">
          <h2>Parking spaces (Section {sectionIdx + 1})</h2>
          <div className="apartment-grid">
            {spacesInSection.map((space) => (
              <article key={space.id} className={`apartment-card ${statusClass[space.status]}`}>
                <div className="apartment-card-header">
                  <span className="apartment-label">{space.label}</span>
                  <select
                    id={`parking-status-${space.id}`}
                    name={`parking-status-${space.id}`}
                    value={space.status}
                    onChange={(e) => handleStatusChange(space.id, e.target.value as ParkingStatus)}
                    className={`apartment-status-select apartment-status--${space.status.replace('_', '-')}`}
                    aria-label={`Status for ${space.label}`}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {statusLabels[opt]}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
