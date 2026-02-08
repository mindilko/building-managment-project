import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBuildings, deleteBuilding } from '../lib/storage';
import { getParkings, deleteParking } from '../lib/parkingStorage';
import type { BuildingConfig } from '../types/building';
import type { ParkingConfig } from '../types/parking';
import './Home.css';

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

function formatCreatedAt(createdAt: number | undefined): string {
  if (createdAt == null || createdAt === 0) return '';
  return new Date(createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function sortBuildings(buildings: BuildingConfig[], sortBy: SortOption): BuildingConfig[] {
  const sorted = [...buildings];
  switch (sortBy) {
    case 'date-desc':
      return sorted.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    case 'date-asc':
      return sorted.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: 'base' }));
    default:
      return sorted;
  }
}

function sortParkings(parkings: ParkingConfig[], sortBy: SortOption): ParkingConfig[] {
  const sorted = [...parkings];
  switch (sortBy) {
    case 'date-desc':
      return sorted.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    case 'date-asc':
      return sorted.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: 'base' }));
    default:
      return sorted;
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [parkingSortBy, setParkingSortBy] = useState<SortOption>('name-asc');
  const buildings = getBuildings();
  const parkings = getParkings();
  const sortedBuildings = useMemo(() => sortBuildings(buildings, sortBy), [buildings, sortBy]);
  const sortedParkings = useMemo(() => sortParkings(parkings, parkingSortBy), [parkings, parkingSortBy]);

  const handleDeleteBuilding = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteBuilding(id);
      navigate(0);
    }
  };

  const handleDeleteParking = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteParking(id);
      navigate(0);
    }
  };

  return (
    <div className="home">
      <header className="home-header">
        <h1>Building Management Tool</h1>
        <p>Create a new building/parking, or explore an existing one.</p>
      </header>

      <div className="home-create-actions">
        <Link to="/create" className="home-create-new">
          + Create new building
        </Link>
        <Link to="/parking/create" className="home-create-new">
          + Create new parking
        </Link>
      </div>

      <div className="home-sections">
        <section className="home-existing">
          <div className="home-existing-header">
            <h2>Existing buildings</h2>
          {buildings.length > 0 && (
            <label className="home-sort" htmlFor="home-sort-buildings">
              <span className="home-sort-label">Sort by</span>
              <select
                id="home-sort-buildings"
                name="sort-buildings"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="home-sort-select"
                aria-label="Sort buildings"
              >
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
              </select>
            </label>
          )}
        </div>
        {buildings.length === 0 ? (
          <p className="home-empty">No buildings yet. Create one to get started.</p>
        ) : (
          <div className="building-list">
            {sortedBuildings.map((building) => (
              <div key={building.id} className="building-card">
                <Link to={`/building/${building.id}`} className="building-card-link">
                  <span className="building-name">{building.name}</span>
                  <span className="building-meta">
                    {building.floorCount} floor{building.floorCount !== 1 ? 's' : ''}
                    {formatCreatedAt(building.createdAt) && (
                      <> · {formatCreatedAt(building.createdAt)}</>
                    )}
                  </span>
                </Link>
                <div className="building-card-actions">
                  <Link
                    to={`/building/${building.id}/edit`}
                    className="building-card-btn building-card-btn--edit"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="building-card-btn building-card-btn--delete"
                    onClick={(e) => handleDeleteBuilding(e, building.id, building.name)}
                    aria-label={`Delete ${building.name}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </section>

        <section className="home-existing">
          <div className="home-existing-header">
            <h2>Existing parkings</h2>
            {parkings.length > 0 && (
              <label className="home-sort" htmlFor="home-sort-parkings">
                <span className="home-sort-label">Sort by</span>
                <select
                  id="home-sort-parkings"
                  name="sort-parkings"
                  value={parkingSortBy}
                  onChange={(e) => setParkingSortBy(e.target.value as SortOption)}
                  className="home-sort-select"
                  aria-label="Sort parkings"
                >
                  <option value="date-desc">Newest first</option>
                  <option value="date-asc">Oldest first</option>
                  <option value="name-asc">Name A–Z</option>
                  <option value="name-desc">Name Z–A</option>
                </select>
              </label>
            )}
          </div>
          {parkings.length === 0 ? (
            <p className="home-empty">No parkings yet. Create one to get started.</p>
          ) : (
            <div className="building-list">
              {sortedParkings.map((parking) => (
                <div key={parking.id} className="building-card">
                  <Link to={`/parking/${parking.id}`} className="building-card-link">
                    <span className="building-name">{parking.name}</span>
                    <span className="building-meta">
                      {parking.spaces.length} space{parking.spaces.length !== 1 ? 's' : ''}
                      {formatCreatedAt(parking.createdAt) && (
                        <> · {formatCreatedAt(parking.createdAt)}</>
                      )}
                    </span>
                  </Link>
                  <div className="building-card-actions">
                    <Link
                      to={`/parking/${parking.id}/edit`}
                      className="building-card-btn building-card-btn--edit"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="building-card-btn building-card-btn--delete"
                      onClick={(e) => handleDeleteParking(e, parking.id, parking.name)}
                      aria-label={`Delete ${parking.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
