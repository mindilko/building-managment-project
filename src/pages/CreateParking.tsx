import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ParkingAreaTool from '../components/ParkingAreaTool';
import { saveParking, getParkingById, getParkings } from '../lib/parkingStorage';
import { compressImageFile } from '../lib/imageCompression';
import type { ParkingConfig, ParkingSpace, ParkingSection, ParkingAreaPercent } from '../types/parking';
import './CreateBuilding.css';

const STEPS = ['Name', 'Overview image', 'Draw sections', 'Plan images', 'Space count per section', 'Save'];

function defaultDotPosition(i: number): { x: number; y: number } {
  return {
    x: 15 + (i % 4) * 25,
    y: 20 + Math.floor(i / 4) * 30,
  };
}

export default function CreateParking() {
  const navigate = useNavigate();
  const { parkingId } = useParams<{ parkingId?: string }>();
  const isEdit = Boolean(parkingId);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [overviewImageUrl, setOverviewImageUrl] = useState('');
  const [sectionAreas, setSectionAreas] = useState<Record<number, ParkingAreaPercent>>({});
  const [sectionPlanImages, setSectionPlanImages] = useState<Record<number, string>>({});
  const [sectionSpaceCounts, setSectionSpaceCounts] = useState<Record<number, number>>({});
  const [loaded, setLoaded] = useState(!isEdit);

  const sectionNumbers = Object.keys(sectionAreas)
    .map(Number)
    .sort((a, b) => a - b);

  useEffect(() => {
    if (!isEdit || !parkingId) return;
    const p = getParkingById(parkingId);
    if (!p) return;
    setName(p.name);
    setOverviewImageUrl(p.overviewImageUrl);
    const areas: Record<number, ParkingAreaPercent> = {};
    const plans: Record<number, string> = {};
    const counts: Record<number, number> = {};
    p.sections.forEach((sec, idx) => {
      const sn = idx + 1;
      areas[sn] = sec.area;
      plans[sn] = sec.planImageUrl;
      counts[sn] = sec.spaceCount;
    });
    setSectionAreas(areas);
    setSectionPlanImages(plans);
    setSectionSpaceCounts(counts);
    setLoaded(true);
  }, [isEdit, parkingId]);

  const handleOverviewImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setOverviewImageUrl(dataUrl);
    } catch {
      window.alert('Could not process the image. Try a different file.');
    }
    e.target.value = '';
  };

  const handleSectionPlanImage = async (sectionNum: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setSectionPlanImages((prev) => ({ ...prev, [sectionNum]: dataUrl }));
    } catch {
      window.alert('Could not process the image. Try a different file.');
    }
    e.target.value = '';
  };

  const handleAreasComplete = useCallback((areas: Record<number, ParkingAreaPercent>) => {
    setSectionAreas(areas);
    setStep(4);
  }, []);

  const setSectionSpaceCount = (sectionNum: number, count: number) => {
    const n = Math.max(0, Math.min(200, count));
    setSectionSpaceCounts((prev) => ({ ...prev, [sectionNum]: n }));
  };

  const isNameTaken = (parkingName: string, excludeId?: string): boolean => {
    const normalized = parkingName.trim().toLowerCase();
    if (!normalized) return false;
    return getParkings().some(
      (p) => p.id !== excludeId && p.name.trim().toLowerCase() === normalized
    );
  };

  const buildAndSave = () => {
    if (isNameTaken(name || '', isEdit ? parkingId : undefined)) {
      window.alert('A parking with this name already exists. Please choose a different name.');
      return;
    }
    const id = isEdit && parkingId ? parkingId : `parking-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const existing = isEdit && parkingId ? getParkingById(parkingId) : undefined;

    const sections: ParkingSection[] = sectionNumbers.map((sn) => ({
      area: sectionAreas[sn],
      planImageUrl: sectionPlanImages[sn] ?? '',
      spaceCount: sectionSpaceCounts[sn] ?? 0,
    }));

    let globalIndex = 0;
    const spaces: ParkingSpace[] = [];
    sections.forEach((sec, sectionIndex) => {
      const count = Math.max(0, sec.spaceCount);
      for (let i = 0; i < count; i++) {
        globalIndex++;
        const label = `P${globalIndex}`;
        const existingSpace = existing?.spaces.find((s) => s.label === label);
        spaces.push({
          id: existingSpace?.id ?? `${id}-${label}`,
          label,
          status: existingSpace?.status ?? 'available',
          sectionIndex,
          dotPosition: existingSpace?.dotPosition ?? defaultDotPosition(spaces.length),
        });
      }
    });

    const parking: ParkingConfig = {
      id,
      name: name || 'Unnamed Parking',
      overviewImageUrl,
      sections,
      spaces,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    saveParking(parking);
    navigate(isEdit ? `/parking/${id}` : '/');
  };

  const canNextStep1 = name.trim().length > 0 && !isNameTaken(name, isEdit ? parkingId : undefined);
  const canNextStep2 = overviewImageUrl.length > 0;
  const allHavePlanImages = sectionNumbers.length > 0 && sectionNumbers.every((sn) => sectionPlanImages[sn]);
  const allHaveSpaceCounts = sectionNumbers.length > 0 && sectionNumbers.every((sn) => (sectionSpaceCounts[sn] ?? 0) > 0);
  const totalSpaces = sectionNumbers.reduce((sum, sn) => sum + (sectionSpaceCounts[sn] ?? 0), 0);
  const canSave = allHavePlanImages && allHaveSpaceCounts && totalSpaces > 0;
  const nameError = name.trim().length > 0 && isNameTaken(name, isEdit ? parkingId : undefined);

  if (!loaded) {
    return (
      <div className="create-building">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="create-building">
      <header className="create-building-header">
        <Link to="/" className="create-building-back">
          ← Home
        </Link>
        <h1>{isEdit ? 'Edit parking' : 'Create new parking'}</h1>
        <div className="create-building-progress">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`create-building-step ${step > i + 1 ? 'create-building-step--done' : step === i + 1 ? 'create-building-step--current' : ''}`}
            >
              {i + 1}. {s}
            </span>
          ))}
        </div>
      </header>

      <div className="create-building-body">
        {step === 1 && (
          <>
            <label className="create-building-field">
              <span>Parking name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Underground A"
                className={nameError ? 'create-building-input--error' : ''}
              />
              {nameError && <span className="create-building-error">A parking with this name already exists.</span>}
            </label>
            <button type="button" className="create-building-next" onClick={() => setStep(2)} disabled={!canNextStep1}>
              Next
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="create-building-p">Upload the <strong>overview</strong> image of the parking (the big picture where you will draw sections).</p>
            <label className="create-building-upload">
              <input type="file" accept="image/*" onChange={handleOverviewImage} />
              <span>{overviewImageUrl ? 'Replace image' : 'Choose image'}</span>
            </label>
            {overviewImageUrl && (
              <>
                <div className="create-building-preview">
                  <img src={overviewImageUrl} alt="Parking overview" />
                </div>
                <button type="button" className="create-building-btn create-building-btn--secondary create-building-btn--danger" onClick={() => setOverviewImageUrl('')}>
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
            <p className="create-building-p">Draw <strong>sections</strong> on the overview image. Each section will get its own plan image in the next step. Add as many sections as you need.</p>
            <ParkingAreaTool
              imageUrl={overviewImageUrl}
              onComplete={handleAreasComplete}
              isEdit={isEdit}
              initialAreas={sectionAreas}
            />
            <div className="create-building-row">
              <button type="button" className="create-building-btn create-building-btn--secondary" onClick={() => setStep(2)}>
                Back
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <p className="create-building-p">Upload one <strong>plan image</strong> per section. This image is used for placing and managing the parking space circles.</p>
            {sectionNumbers.map((sn) => (
              <div key={sn} className="create-building-field" style={{ marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600 }}>Section {sn}</span>
                <label className="create-building-upload" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
                  <input type="file" accept="image/*" onChange={(e) => handleSectionPlanImage(sn, e)} />
                  <span>{sectionPlanImages[sn] ? 'Replace plan image' : 'Choose plan image'}</span>
                </label>
                {sectionPlanImages[sn] && (
                  <div className="create-building-preview" style={{ maxWidth: 280, marginTop: '0.5rem' }}>
                    <img src={sectionPlanImages[sn]} alt={`Section ${sn} plan`} />
                  </div>
                )}
              </div>
            ))}
            <div className="create-building-row">
              <button type="button" className="create-building-btn create-building-btn--secondary" onClick={() => setStep(3)}>
                Back
              </button>
              <button type="button" className="create-building-btn create-building-btn--primary" onClick={() => setStep(5)} disabled={!allHavePlanImages}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <p className="create-building-p">Set the <strong>number of parking spaces</strong> for each section.</p>
            {sectionNumbers.map((sn) => (
              <label key={sn} className="create-building-field create-building-field--inline">
                <span>Section {sn} – spaces</span>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={sectionSpaceCounts[sn] ?? 0}
                  onChange={(e) => setSectionSpaceCount(sn, Number(e.target.value) || 0)}
                />
              </label>
            ))}
            <p className="create-building-p">Total: {totalSpaces} space{totalSpaces !== 1 ? 's' : ''}.</p>
            <div className="create-building-row">
              <button type="button" className="create-building-btn create-building-btn--secondary" onClick={() => setStep(4)}>
                Back
              </button>
              <button type="button" className="create-building-btn create-building-btn--primary" onClick={() => setStep(6)} disabled={!allHaveSpaceCounts || totalSpaces === 0}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <p className="create-building-p">Review and save. You can adjust circle positions and statuses on each section&apos;s plan after saving.</p>
            <div className="create-building-row">
              <button type="button" className="create-building-btn create-building-btn--secondary" onClick={() => setStep(5)}>
                Back
              </button>
              <button type="button" className="create-building-btn create-building-btn--primary" onClick={buildAndSave} disabled={!canSave}>
                {isEdit ? 'Save changes' : 'Create parking'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
