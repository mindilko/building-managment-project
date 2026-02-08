import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBuildingById, getFloor, updateApartmentStatus, updateApartmentDotPosition } from '../lib/storage';
import type { ApartmentStatus, DotPosition } from '../types/building';
import './FloorPlan.css';

const STATUS_OPTIONS: ApartmentStatus[] = ['available', 'in_negotiation', 'sold'];

const statusLabels: Record<string, string> = {
  available: 'Available',
  in_negotiation: 'In negotiation',
  sold: 'Sold',
  reserved: 'In negotiation', // backward compat
};

const statusClass: Record<string, string> = {
  available: 'apartment-card--available',
  in_negotiation: 'apartment-card--in-negotiation',
  sold: 'apartment-card--sold',
  reserved: 'apartment-card--in-negotiation',
};

function normalizeStatus(s: string): ApartmentStatus {
  return s === 'reserved' ? 'in_negotiation' : (s as ApartmentStatus);
}

function statusClassKey(s: string): string {
  return s.replace('_', '-');
}

function defaultDotPosition(i: number): { x: number; y: number } {
  return {
    x: 15 + (i % 4) * 25,
    y: 20 + Math.floor(i / 4) * 30,
  };
}

export default function FloorPlan() {
  const { buildingId, floorNumber } = useParams<{ buildingId: string; floorNumber: string }>();
  const floorNum = floorNumber ? parseInt(floorNumber, 10) : NaN;
  const [building, setBuilding] = useState(() => (buildingId ? getBuildingById(buildingId) : undefined));
  const floor = building && !isNaN(floorNum) ? getFloor(building.id, floorNum) : undefined;
  const dotsContainerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<DotPosition | null>(null);
  const dragPositionRef = useRef<DotPosition | null>(null);
  dragPositionRef.current = dragPosition;

  useEffect(() => {
    if (buildingId) setBuilding(getBuildingById(buildingId));
  }, [buildingId]);

  const handleStatusChange = (apartmentId: string, status: ApartmentStatus) => {
    if (!buildingId || !floor || isNaN(floorNum)) return;
    updateApartmentStatus(buildingId, floor.floorNumber, apartmentId, status);
    setBuilding(getBuildingById(buildingId));
  };

  const getPercentFromEvent = useCallback((clientX: number, clientY: number): DotPosition => {
    const el = dotsContainerRef.current;
    if (!el) return { x: 50, y: 50 };
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }, []);

  const handleDotMouseDown = (e: React.MouseEvent, apartmentId: string) => {
    if ((e.target as HTMLElement).closest('select')) return;
    e.preventDefault();
    const apt = floor?.apartments.find((a) => a.id === apartmentId);
    const pos = apt?.dotPosition ?? defaultDotPosition(floor!.apartments.findIndex((a) => a.id === apartmentId));
    setDraggingId(apartmentId);
    setDragPosition(pos);
  };

  useEffect(() => {
    if (!draggingId) return;
    const onMove = (e: MouseEvent) => setDragPosition(getPercentFromEvent(e.clientX, e.clientY));
    const onUp = () => {
      if (buildingId && floor && draggingId) {
        const pos = dragPositionRef.current ?? { x: 50, y: 50 };
        updateApartmentDotPosition(buildingId, floor.floorNumber, draggingId, pos);
        setBuilding(getBuildingById(buildingId));
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
  }, [draggingId, buildingId, floor?.floorNumber, getPercentFromEvent]);

  if (!building || !floor) {
    return (
      <div className="floor-plan floor-plan--error">
        <p>Floor not found.</p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="floor-plan">
      <header className="floor-plan-header">
        <Link to={`/building/${building.id}`} className="back-link">
          ← {building.name}
        </Link>
        <h1>Floor {floor.floorNumber}</h1>
        <p className="floor-plan-section">Section {floor.section}</p>
        <p className="floor-plan-available">
          {floor.availableCount} of {floor.apartments.length} apartments available
        </p>
      </header>

      <div className="floor-plan-content">
        <div className="floor-plan-visual">
          {floor.floorPlanImageUrl ? (
            <div
              ref={dotsContainerRef}
              className="floor-plan-image"
              style={{ backgroundImage: `url(${floor.floorPlanImageUrl})` }}
            >
              <div className="apartment-dots">
                {floor.apartments.map((apt, i) => {
                  const displayStatus = normalizeStatus(apt.status);
                  const pos = draggingId === apt.id && dragPosition
                    ? dragPosition
                    : (apt.dotPosition ?? defaultDotPosition(i));
                  return (
                    <div
                      key={apt.id}
                      className={`apartment-dot apartment-dot--${statusClassKey(displayStatus)} ${draggingId === apt.id ? 'apartment-dot--dragging' : ''}`}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      title={`${apt.label} – ${statusLabels[displayStatus]} – ${apt.area} m². Drag to move.`}
                      onMouseDown={(e) => handleDotMouseDown(e, apt.id)}
                    >
                      {apt.label}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div ref={dotsContainerRef} className="floor-plan-placeholder">
              <span className="floor-plan-label">Floor {floor.floorNumber} plan</span>
              <span className="floor-plan-hint">
                No floor plan image. Apartments are listed below.
              </span>
              <div className="apartment-dots">
                {floor.apartments.map((apt, i) => {
                  const displayStatus = normalizeStatus(apt.status);
                  const pos = draggingId === apt.id && dragPosition
                    ? dragPosition
                    : (apt.dotPosition ?? defaultDotPosition(i));
                  return (
                    <div
                      key={apt.id}
                      className={`apartment-dot apartment-dot--${statusClassKey(displayStatus)} ${draggingId === apt.id ? 'apartment-dot--dragging' : ''}`}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      title={`${apt.label} – ${statusLabels[displayStatus]} – ${apt.area} m². Drag to move.`}
                      onMouseDown={(e) => handleDotMouseDown(e, apt.id)}
                    >
                      {apt.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="apartment-list">
          <h2>Apartments on this floor</h2>
          <div className="apartment-grid">
            {floor.apartments.map((apt) => {
              const displayStatus = normalizeStatus(apt.status);
              return (
                <article
                  key={apt.id}
                  className={`apartment-card ${statusClass[displayStatus]}`}
                >
                  <div className="apartment-card-header">
                    <span className="apartment-label">Ap. {apt.label}</span>
                    <select
                      id={`apartment-status-${apt.id}`}
                      name={`apartment-status-${apt.id}`}
                      value={displayStatus}
                      onChange={(e) => handleStatusChange(apt.id, e.target.value as ApartmentStatus)}
                      className={`apartment-status-select apartment-status--${statusClassKey(displayStatus)}`}
                      aria-label={`Status for apartment ${apt.label}`}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {statusLabels[opt]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="apartment-card-details">
                    <span>{apt.area} m²</span>
                    {apt.rooms && <span>{apt.rooms} rooms</span>}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
