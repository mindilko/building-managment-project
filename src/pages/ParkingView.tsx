import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getParkingById, deleteParking } from '../lib/parkingStorage';
import type { ParkingSpace } from '../types/parking';
import './BuildingView.css';

export default function ParkingView() {
  const { parkingId } = useParams<{ parkingId: string }>();
  const navigate = useNavigate();
  const [hoveredSectionIndex, setHoveredSectionIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const parking = parkingId ? getParkingById(parkingId) : undefined;

  if (!parking) {
    return (
      <div className="building-view building-view--error">
        <p>Parking not found.</p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  const hasSections = parking.sections && parking.sections.length > 0;
  const totalSpaces = parking.spaces.length;

  const handleSectionClick = (sectionIndex: number) => {
    navigate(`/parking/${parking.id}/plan/${sectionIndex}`);
  };

  const handleSectionMouseEnter = (e: React.MouseEvent, sectionIndex: number) => {
    setHoveredSectionIndex(sectionIndex);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.bottom });
  };

  const handleSectionMouseLeave = () => {
    setHoveredSectionIndex(null);
    setTooltipPosition(null);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${parking.name}"? This cannot be undone.`)) {
      deleteParking(parking.id);
      navigate('/');
    }
  };

  return (
    <div className="building-view">
      <header className="building-view-header">
        <Link to="/" className="back-link">← Home</Link>
        <h1>{parking.name}</h1>
        <p>{totalSpaces} parking space{totalSpaces !== 1 ? 's' : ''} in {parking.sections.length} section{parking.sections.length !== 1 ? 's' : ''}</p>
        <div className="building-view-header-actions">
          <Link to={`/parking/${parking.id}/edit`} className="building-view-btn building-view-btn--edit">Edit</Link>
          <button type="button" className="building-view-btn building-view-btn--delete" onClick={handleDelete} aria-label={`Delete ${parking.name}`}>
            Delete
          </button>
        </div>
      </header>

      <div className={`building-facade-wrapper${hasSections ? ' building-facade-wrapper--image-fit' : ''}`}>
        <div className={`building-facade building-facade--image ${hasSections ? 'building-facade--image-with-shapes' : ''}`}>
          <img src={parking.overviewImageUrl} alt={parking.name} className="building-facade-img" />
          {hasSections && (
            <div className="floor-overlay">
              {parking.sections.map((section, sectionIndex) => {
                const a = section.area;
                return (
                  <button
                    key={sectionIndex}
                    type="button"
                    className={`floor-shape-btn ${hoveredSectionIndex === sectionIndex ? 'floor-shape-btn--hover' : ''}`}
                    style={{
                      left: `${a.x}%`,
                      top: `${a.y}%`,
                      width: `${a.width}%`,
                      height: `${a.height}%`,
                    }}
                    onClick={() => handleSectionClick(sectionIndex)}
                    onMouseEnter={(e) => handleSectionMouseEnter(e, sectionIndex)}
                    onMouseLeave={handleSectionMouseLeave}
                    aria-label={`Section ${sectionIndex + 1}, ${section.spaceCount} spaces`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {hoveredSectionIndex !== null && tooltipPosition && parking.sections[hoveredSectionIndex] && (
        <div
          className="floor-tooltip"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          <div className="floor-tooltip-row">
            <span>Section {hoveredSectionIndex + 1}</span>
          </div>
          <div className="floor-tooltip-row">
            <span>{parking.sections[hoveredSectionIndex].spaceCount} spaces – click to manage</span>
          </div>
        </div>
      )}

      <div className="floor-legend">
        {parking.sections.map((section, sectionIndex) => (
          <button
            key={sectionIndex}
            type="button"
            className="floor-legend-item"
            onClick={() => navigate(`/parking/${parking.id}/plan/${sectionIndex}`)}
          >
            <span>Section {sectionIndex + 1}</span>
            <span className="floor-legend-available">{section.spaceCount} spaces</span>
          </button>
        ))}
      </div>
    </div>
  );
}
