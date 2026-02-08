import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getBuildingById, deleteBuilding } from '../lib/storage';
import type { FloorInfo } from '../types/building';
import './BuildingView.css';

export default function BuildingView() {
  const { buildingId } = useParams<{ buildingId: string }>();
  const navigate = useNavigate();
  const [hoveredFloor, setHoveredFloor] = useState<FloorInfo | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const building = buildingId ? getBuildingById(buildingId) : undefined;

  if (!building) {
    return (
      <div className="building-view building-view--error">
        <p>Building not found.</p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  const floorCount = building.floorCount;
  const hasCustomImage = Boolean(building.imageUrl);
  const useShapeButtons = building.floors.some((f) => f.areaPercent);
  const isImageOnly = hasCustomImage && !useShapeButtons;
  const isImageWithShapes = hasCustomImage && useShapeButtons;
  const bounds = building.floorBoundsPercent;

  const getFloorHeightPercent = (indexFromTop: number) => {
    if (bounds && bounds.length === floorCount) {
      const topOfStrip = indexFromTop === floorCount - 1 ? 100 : bounds[floorCount - 2 - indexFromTop];
      const bottomOfStrip = indexFromTop === 0 ? 0 : bounds[floorCount - 1 - indexFromTop];
      return topOfStrip - bottomOfStrip;
    }
    return 100 / floorCount;
  };

  const handleFloorClick = (floorNumber: number) => {
    navigate(`/building/${building.id}/floor/${floorNumber}`);
  };

  const handleFloorMouseEnter = (e: React.MouseEvent, floor: FloorInfo) => {
    setHoveredFloor(floor);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.bottom });
  };

  const handleFloorMouseLeave = () => {
    setHoveredFloor(null);
    setTooltipPosition(null);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${building.name}"? This cannot be undone.`)) {
      deleteBuilding(building.id);
      navigate('/');
    }
  };

  return (
    <div className="building-view">
      <header className="building-view-header">
        <Link to="/" className="back-link">← Buildings</Link>
        <h1>{building.name}</h1>
        <p>Click a floor to see apartments</p>
        <div className="building-view-header-actions">
          <Link to={`/building/${building.id}/edit`} className="building-view-btn building-view-btn--edit">Edit</Link>
          <button type="button" className="building-view-btn building-view-btn--delete" onClick={handleDelete} aria-label={`Delete ${building.name}`}>
            Delete
          </button>
        </div>
      </header>

      <div className={`building-facade-wrapper${isImageWithShapes ? ' building-facade-wrapper--image-fit' : ''}`}>
        <div
          className={`building-facade ${isImageOnly ? 'building-facade--image' : isImageWithShapes ? 'building-facade--image building-facade--image-with-shapes' : 'building-facade--generated'}`}
          style={isImageOnly ? { backgroundImage: `url(${building.imageUrl})` } : undefined}
        >
          {isImageWithShapes ? (
            <>
              <img src={building.imageUrl} alt={building.name} className="building-facade-img" />
              <div className="floor-overlay">
                {building.floors.map((floor) => {
                  const a = floor.areaPercent;
                  if (!a) return null;
                  return (
                    <button
                      key={floor.floorNumber}
                      type="button"
                      className={`floor-shape-btn ${hoveredFloor?.floorNumber === floor.floorNumber ? 'floor-shape-btn--hover' : ''}`}
                      style={{
                        left: `${a.x}%`,
                        top: `${a.y}%`,
                        width: `${a.width}%`,
                        height: `${a.height}%`,
                      }}
                      onClick={() => handleFloorClick(floor.floorNumber)}
                      onMouseEnter={(e) => handleFloorMouseEnter(e, floor)}
                      onMouseLeave={handleFloorMouseLeave}
                      aria-label={`Floor ${floor.floorNumber}, ${floor.availableCount} available`}
                    />
                  );
                })}
              </div>
            </>
          ) : !hasCustomImage ? (
            <div className="generated-facade">
              {building.floors
                .slice()
                .reverse()
                .map((floor) => (
                  <div
                    key={floor.floorNumber}
                    className="generated-floor"
                    style={{ flex: 1 }}
                  >
                    <span className="generated-floor-number">{floor.floorNumber}</span>
                  </div>
                ))}
            </div>
          ) : null}
        </div>

        {!isImageWithShapes && (
        <div className="floor-overlay">
          {building.floors
            .slice()
            .reverse()
            .map((floor, indexFromTop) => (
              <button
                key={floor.floorNumber}
                type="button"
                className={`floor-strip ${hoveredFloor?.floorNumber === floor.floorNumber ? 'floor-strip--hover' : ''}`}
                style={{ height: `${getFloorHeightPercent(indexFromTop)}%` }}
                onClick={() => handleFloorClick(floor.floorNumber)}
                onMouseEnter={(e) => handleFloorMouseEnter(e, floor)}
                onMouseLeave={handleFloorMouseLeave}
                aria-label={`Floor ${floor.floorNumber}, ${floor.availableCount} available`}
              />
            ))}
        </div>
        )}
      </div>

      {hoveredFloor && tooltipPosition && (
        <div
          className="floor-tooltip"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <div className="floor-tooltip-row">
            <span>Section {hoveredFloor.section}</span>
          </div>
          <div className="floor-tooltip-row">
            <span>Floor {hoveredFloor.floorNumber}</span>
          </div>
          <div className="floor-tooltip-row">
            <span>Available apartments: {hoveredFloor.availableCount}</span>
          </div>
        </div>
      )}

      <div className="floor-legend">
        {building.floors.map((f) => (
          <button
            key={f.floorNumber}
            type="button"
            className="floor-legend-item"
            onClick={() => handleFloorClick(f.floorNumber)}
          >
            <span>Floor {f.floorNumber}</span>
            <span className="floor-legend-available">{f.availableCount} available</span>
          </button>
        ))}
      </div>
    </div>
  );
}
