import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import FloorAreaTool from '../components/FloorAreaTool';
import { saveBuilding, getBuildingById, getBuildings } from '../lib/storage';
import type { BuildingConfig, FloorInfo, Apartment, FloorAreaPercent } from '../types/building';
import './CreateBuilding.css';

type FloorData = {
  apartmentCount: number;
  areas: number[];
  floorPlanImageUrl?: string;
  areaPercent?: FloorAreaPercent;
};

const STEPS = [
  'Name & floors',
  'Building image',
  'Draw floor buttons',
  'Apartments per floor',
  'Apartment sizes',
  'Floor plan images',
  'Save',
];

export default function CreateBuilding() {
  const navigate = useNavigate();
  const { buildingId } = useParams<{ buildingId?: string }>();
  const isEdit = Boolean(buildingId);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [floorCount, setFloorCount] = useState(8);
  const [imageUrl, setImageUrl] = useState('');
  const [floorsData, setFloorsData] = useState<Record<number, FloorData>>({});
  const [loaded, setLoaded] = useState(!isEdit);
  const totalFloors = Math.max(1, Math.min(50, floorCount));
  const floorNumbers = Array.from({ length: totalFloors }, (_, i) => i + 1);

  useEffect(() => {
    if (!isEdit || !buildingId) return;
    const b = getBuildingById(buildingId);
    if (!b) return;
    setName(b.name);
    setFloorCount(b.floorCount);
    setImageUrl(b.imageUrl ?? '');
    const fd: Record<number, FloorData> = {};
    b.floors.forEach((f) => {
      fd[f.floorNumber] = {
        apartmentCount: f.apartments.length,
        areas: f.apartments.map((a) => a.area),
        floorPlanImageUrl: f.floorPlanImageUrl,
        areaPercent: f.areaPercent,
      };
    });
    setFloorsData(fd);
    setLoaded(true);
  }, [isEdit, buildingId]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleFloorAreasComplete = useCallback((areas: Record<number, FloorAreaPercent>) => {
    setFloorsData((prev) => {
      const next = { ...prev };
      for (let fn = 1; fn <= totalFloors; fn++) {
        const existing = next[fn] ?? { apartmentCount: 0, areas: [] };
        next[fn] = { ...existing, areaPercent: areas[fn] };
      }
      return next;
    });
    setStep(4);
  }, [totalFloors]);

  const setApartmentCount = (floorNumber: number, count: number) => {
    const n = Math.max(0, Math.min(99, count));
    setFloorsData((prev) => {
      const prevF = prev[floorNumber];
      const existingAreas = prevF?.areas ?? [];
      const areas = Array.from({ length: n }, (_, i) => existingAreas[i] ?? 0);
      return { ...prev, [floorNumber]: { ...prevF, apartmentCount: n, areas } };
    });
  };

  const setApartmentArea = (floorNumber: number, index: number, area: number) => {
    setFloorsData((prev) => {
      const f = prev[floorNumber] ?? { apartmentCount: 0, areas: [] };
      const areas = [...(f.areas ?? [])];
      areas[index] = Math.max(0, area);
      return { ...prev, [floorNumber]: { ...f, areas } };
    });
  };

  const removeApartment = (floorNumber: number, index: number) => {
    setFloorsData((prev) => {
      const f = prev[floorNumber] ?? { apartmentCount: 0, areas: [] };
      const count = Math.max(0, (f.apartmentCount ?? 0) - 1);
      const areas = (f.areas ?? []).filter((_, i) => i !== index);
      return { ...prev, [floorNumber]: { ...f, apartmentCount: count, areas } };
    });
  };

  const setFloorPlanImage = (floorNumber: number, url: string) => {
    setFloorsData((prev) => ({
      ...prev,
      [floorNumber]: { ...(prev[floorNumber] ?? { apartmentCount: 0, areas: [] }), floorPlanImageUrl: url },
    }));
  };

  const removeFloorPlanImage = (floorNumber: number) => {
    setFloorsData((prev) => {
      const next = { ...prev };
      const f = next[floorNumber];
      if (f) next[floorNumber] = { ...f, floorPlanImageUrl: undefined };
      return next;
    });
  };

  const handleFloorPlanFile = (floorNumber: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFloorPlanImage(floorNumber, String(reader.result));
    reader.readAsDataURL(file);
  };

  const buildAndSave = () => {
    if (isNameTaken(name || '', isEdit ? buildingId : undefined)) {
      window.alert('A building with this name already exists. Please choose a different name.');
      return;
    }
    const id = isEdit && buildingId ? buildingId : `building-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const sectionLabel = name.slice(0, 1).toUpperCase() || 'A';
    const floors: FloorInfo[] = floorNumbers.map((floorNumber) => {
      const fd = floorsData[floorNumber] ?? { apartmentCount: 0, areas: [] };
      const apartments: Apartment[] = Array.from({ length: fd.apartmentCount }, (_, i) => ({
        id: `${id}-f${floorNumber}-a${i + 1}`,
        label: `${sectionLabel}${floorNumber}-${i + 1}`,
        floor: floorNumber,
        section: sectionLabel,
        area: fd.areas[i] ?? 0,
        status: 'available' as const,
      }));
      const availableCount = apartments.filter((a) => a.status === 'available').length;
      return {
        floorNumber,
        section: sectionLabel,
        availableCount,
        apartments,
        floorPlanImageUrl: fd.floorPlanImageUrl,
        areaPercent: fd.areaPercent,
      };
    });

    const existing = isEdit && buildingId ? getBuildingById(buildingId) : undefined;
    const building: BuildingConfig = {
      id,
      name: name || 'Unnamed Building',
      sectionLabel,
      floorCount: totalFloors,
      imageUrl: imageUrl || undefined,
      floors,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    saveBuilding(building);
    navigate(isEdit ? `/building/${id}` : '/');
  };

  const isNameTaken = (buildingName: string, excludeId?: string): boolean => {
    const normalized = buildingName.trim().toLowerCase();
    if (!normalized) return false;
    return getBuildings().some(
      (b) => b.id !== excludeId && b.name.trim().toLowerCase() === normalized
    );
  };

  const nameError = name.trim().length > 0 && isNameTaken(name, isEdit ? buildingId : undefined);
  const canNextStep1 = name.trim().length > 0 && totalFloors >= 1 && !nameError;
  const canNextStep2 = imageUrl.length > 0;
  const allAreasFilled = floorNumbers.every((fn) => {
    const fd = floorsData[fn];
    const count = fd?.apartmentCount ?? 0;
    const areas = fd?.areas ?? [];
    if (count === 0) return true;
    return areas.length >= count;
  });

  if (isEdit && !loaded) {
    return (
      <div className="create-building">
        <header className="create-building-header">
          <Link to="/" className="create-building-back">← Back</Link>
          <h1>Edit building</h1>
        </header>
        <p className="create-building-p">Loading…</p>
      </div>
    );
  }

  return (
    <div className="create-building">
      <header className="create-building-header">
        <Link to={isEdit ? `/building/${buildingId}` : '/'} className="create-building-back">← Back</Link>
        <h1>{isEdit ? 'Edit building' : 'Create new building'}</h1>
        <div className="create-building-progress">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={`create-building-step ${i + 1 === step ? 'create-building-step--current' : ''} ${i + 1 < step ? 'create-building-step--done' : ''}`}
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>
      </header>

      <div className="create-building-body">
        {step === 1 && (
          <>
            <label className="create-building-field">
              <span>Building name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tower A"
                autoFocus
                className={nameError ? 'create-building-input--error' : undefined}
                aria-invalid={nameError}
              />
              {nameError && (
                <span className="create-building-error" role="alert">
                  A building with this name already exists. Choose a different name.
                </span>
              )}
            </label>
            <label className="create-building-field">
              <span>Number of floors</span>
              <input
                type="number"
                min={1}
                max={50}
                value={floorCount}
                onChange={(e) => setFloorCount(Number(e.target.value) || 1)}
              />
              <span className="create-building-hint">
                Use the actual number of floors. In the next step you’ll draw a rectangle (button) on the image for each floor.
              </span>
            </label>
            <button type="button" className="create-building-next" onClick={() => setStep(2)} disabled={!canNextStep1}>
              Next
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="create-building-p">Upload an image of the building (facade).</p>
            <label className="create-building-upload">
              <input type="file" accept="image/*" onChange={handleImageFile} />
              <span>{imageUrl ? 'Replace image' : 'Choose image'}</span>
            </label>
            {imageUrl && (
              <>
                <div className="create-building-preview">
                  <img src={imageUrl} alt="Building" />
                </div>
                <button type="button" className="create-building-btn create-building-btn--secondary create-building-btn--danger" onClick={() => setImageUrl('')}>
                  Remove image
                </button>
              </>
            )}
            <div className="create-building-row">
              <button type="button" className="create-building-btn create-building-btn--secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" className="create-building-btn create-building-btn--primary" onClick={() => setStep(3)} disabled={!canNextStep2}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="create-building-p">Draw a rectangle on the image for each floor. That shape will be the clickable button for that floor.</p>
            <FloorAreaTool
              imageUrl={imageUrl}
              floorNumbers={floorNumbers}
              onComplete={handleFloorAreasComplete}
              isEdit={isEdit}
            />
            <div className="create-building-row">
              <button type="button" className="create-building-btn create-building-btn--secondary" onClick={() => setStep(2)}>
                Back
              </button>
              {isEdit && floorNumbers.every((fn) => floorsData[fn]?.areaPercent) && (
                <button type="button" className="create-building-btn create-building-btn--primary" onClick={() => setStep(4)}>
                  Next
                </button>
              )}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <p className="create-building-p">How many apartments on each floor?</p>
            {floorNumbers.map((fn) => (
              <label key={fn} className="create-building-field create-building-field--inline">
                <span>Floor {fn}</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={floorsData[fn]?.apartmentCount ?? 0}
                  onChange={(e) => setApartmentCount(fn, Number(e.target.value) || 0)}
                />
              </label>
            ))}
            <div className="create-building-row">
              <button type="button" className="create-building-btn create-building-btn--secondary" onClick={() => setStep(3)}>
                Back
              </button>
              <button type="button" className="create-building-btn create-building-btn--primary" onClick={() => setStep(5)}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <p className="create-building-p">Enter the area (m²) for each apartment.</p>
            {floorNumbers.map((fn) => {
              const fd = floorsData[fn] ?? { apartmentCount: 0, areas: [] };
              const count = fd.apartmentCount;
              if (count === 0) return null;
              return (
                <div key={fn} className="create-building-floor-block">
                  <strong>Floor {fn}</strong>
                  <div className="create-building-areas">
                    {Array.from({ length: count }, (_, i) => (
                      <div key={i} className="create-building-apartment-row">
                        <label className="create-building-field create-building-field--inline">
                          <span>Ap. {i + 1} (m²)</span>
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={fd.areas[i] ?? ''}
                            onChange={(e) => setApartmentArea(fn, i, Number(e.target.value) || 0)}
                          />
                        </label>
                        <button type="button" className="create-building-btn create-building-btn--small create-building-btn--danger" onClick={() => removeApartment(fn, i)} aria-label={`Remove apartment ${i + 1}`}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="create-building-row">
              <button type="button" className="create-building-btn create-building-btn--secondary" onClick={() => setStep(4)}>
                Back
              </button>
              <button type="button" className="create-building-btn create-building-btn--primary" onClick={() => setStep(6)} disabled={!allAreasFilled}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <p className="create-building-p">Optional: add a floor plan image for each floor. If you don’t have one, skip.</p>
            {floorNumbers.map((fn) => (
              <div key={fn} className="create-building-floor-plan-row">
                <span>Floor {fn}</span>
                <div className="create-building-floor-plan-actions">
                  <label className="create-building-upload create-building-upload--small">
                    <input type="file" accept="image/*" onChange={(e) => handleFloorPlanFile(fn, e)} />
                    <span>{floorsData[fn]?.floorPlanImageUrl ? 'Replace plan' : 'Add plan image'}</span>
                  </label>
                  {floorsData[fn]?.floorPlanImageUrl && (
                    <button type="button" className="create-building-btn create-building-btn--small create-building-btn--danger" onClick={() => removeFloorPlanImage(fn)}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="create-building-row">
              <button type="button" className="create-building-btn create-building-btn--secondary" onClick={() => setStep(5)}>
                Back
              </button>
              <button type="button" className="create-building-btn create-building-btn--primary" onClick={() => setStep(7)}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 7 && (
          <>
            <p className="create-building-p">{isEdit ? 'Save changes to your building.' : 'Save your building. It will appear under “Existing buildings” on the start page.'}</p>
            <button type="button" className="create-building-btn create-building-btn--primary create-building-btn--large" onClick={buildAndSave}>
              {isEdit ? 'Save changes' : 'Save building'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
