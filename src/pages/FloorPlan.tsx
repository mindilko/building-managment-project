import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBuildingById, getFloor, updateApartmentStatus } from '../lib/storage';
import type { ApartmentStatus } from '../types/building';
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

/** Normalize legacy 'reserved' to 'in_negotiation' for display and edit. */
function normalizeStatus(s: string): ApartmentStatus {
  return s === 'reserved' ? 'in_negotiation' : (s as ApartmentStatus);
}

export default function FloorPlan() {
  const { buildingId, floorNumber } = useParams<{ buildingId: string; floorNumber: string }>();
  const floorNum = floorNumber ? parseInt(floorNumber, 10) : NaN;
  const [building, setBuilding] = useState(() => (buildingId ? getBuildingById(buildingId) : undefined));
  const floor = building && !isNaN(floorNum) ? getFloor(building.id, floorNum) : undefined;

  useEffect(() => {
    if (buildingId) setBuilding(getBuildingById(buildingId));
  }, [buildingId]);

  const handleStatusChange = (apartmentId: string, status: ApartmentStatus) => {
    if (!buildingId || !floor || isNaN(floorNum)) return;
    updateApartmentStatus(buildingId, floor.floorNumber, apartmentId, status);
    setBuilding(getBuildingById(buildingId));
  };

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
              className="floor-plan-image"
              style={{ backgroundImage: `url(${floor.floorPlanImageUrl})` }}
            >
              <div className="apartment-dots">
                {floor.apartments.map((apt, i) => {
                  const displayStatus = normalizeStatus(apt.status);
                  return (
                    <div
                      key={apt.id}
                      className={`apartment-dot apartment-dot--${displayStatus}`}
                      style={{
                        left: `${15 + (i % 4) * 25}%`,
                        top: `${20 + Math.floor(i / 4) * 30}%`,
                      }}
                      title={`${apt.label} – ${statusLabels[displayStatus]} – ${apt.area} m²`}
                    >
                      {apt.label}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="floor-plan-placeholder">
              <span className="floor-plan-label">Floor {floor.floorNumber} plan</span>
              <span className="floor-plan-hint">
                No floor plan image. Apartments are listed below.
              </span>
              <div className="apartment-dots">
                {floor.apartments.map((apt, i) => {
                  const displayStatus = normalizeStatus(apt.status);
                  return (
                    <div
                      key={apt.id}
                      className={`apartment-dot apartment-dot--${displayStatus}`}
                      style={{
                        left: `${15 + (i % 4) * 25}%`,
                        top: `${20 + Math.floor(i / 4) * 30}%`,
                      }}
                      title={`${apt.label} – ${statusLabels[displayStatus]} – ${apt.area} m²`}
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
                      value={displayStatus}
                      onChange={(e) => handleStatusChange(apt.id, e.target.value as ApartmentStatus)}
                      className={`apartment-status-select apartment-status--${displayStatus}`}
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
