import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { caseApi, pilotApi } from '../services/api';
import { getPetProfile, getRecommendedRadius, PET_PROFILES } from '../services/petBehavior';
import { SEARCH_CHECKLIST } from '../services/searchChecklist';
import { THERMAL_GUIDE, getThermalInfo } from '../services/thermalGuide';
import { generateSearchGrid, getRecommendedPattern, getAvailablePatterns } from '../services/searchGrid';
import { FiTarget, FiThermometer, FiCheckSquare, FiMap, FiChevronDown, FiChevronUp, FiX, FiNavigation, FiClock, FiAlertTriangle, FiInfo, FiLayers } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const TABS = [
  { id: 'grid', label: 'Search Grid', icon: <FiTarget size={16} /> },
  { id: 'behavior', label: 'Pet Behavior', icon: <FiNavigation size={16} /> },
  { id: 'checklist', label: 'Checklist', icon: <FiCheckSquare size={16} /> },
  { id: 'thermal', label: 'Thermal ID', icon: <FiThermometer size={16} /> },
];

export default function PilotToolsPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('grid');
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(!!caseId);
  const [gridVisible, setGridVisible] = useState(true);
  const [selectedPattern, setSelectedPattern] = useState('lawnmower');
  const [gridResult, setGridResult] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [expandedSections, setExpandedSections] = useState({ preflight: true, inflight: false, postflight: false });
  const [expandedThermal, setExpandedThermal] = useState(null);

  useEffect(() => {
    if (caseId) {
      loadCase();
    } else {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (caseData && gridVisible) {
      const hoursMissing = caseData.last_seen_date ? (Date.now() - new Date(caseData.last_seen_date).getTime()) / 3600000 : 24;
      const radius = getRecommendedRadius(caseData.pet_type, hoursMissing, caseData.temperament);
      const recommendation = getRecommendedPattern(caseData.pet_type, hoursMissing);
      setSelectedPattern(recommendation.pattern);
      const grid = generateSearchGrid(
        parseFloat(caseData.last_seen_lat) || 42.45,
        parseFloat(caseData.last_seen_lng) || -75.06,
        radius,
        recommendation.pattern
      );
      setGridResult(grid);
    }
  }, [caseData, gridVisible]);

  const loadCase = async () => {
    try {
      const res = await caseApi.getById(caseId);
      setCaseData(res.data.case);
    } catch (err) {
      console.error('Failed to load case:', err);
    } finally {
      setLoading(false);
    }
  };

  const petProfile = useMemo(() => caseData ? getPetProfile(caseData.pet_type) : null, [caseData]);
  const thermalInfo = useMemo(() => caseData ? getThermalInfo(caseData.pet_type) : null, [caseData]);

  const handlePatternChange = (pattern) => {
    setSelectedPattern(pattern);
    if (caseData && gridVisible) {
      const hoursMissing = caseData.last_seen_date ? (Date.now() - new Date(caseData.last_seen_date).getTime()) / 3600000 : 24;
      const radius = getRecommendedRadius(caseData.pet_type, hoursMissing, caseData.temperament);
      const grid = generateSearchGrid(
        parseFloat(caseData.last_seen_lat) || 42.45,
        parseFloat(caseData.last_seen_lng) || -75.06,
        radius,
        pattern
      );
      setGridResult(grid);
    }
  };

  const toggleChecked = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) return <LoadingSpinner text="Loading pilot tools..." />;

  return (
    <div style={{ paddingBottom: '1rem' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>PILOT TOOLS</h2>
            {caseData && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {petProfile?.icon} {caseData.pet_name} — {petProfile?.label || caseData.pet_type}
              </div>
            )}
          </div>
          {caseId && (
            <button onClick={() => navigate(`/cases/${caseId}`)} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FiX size={14} /> Close
            </button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '0.7rem 0.3rem', border: 'none', background: 'none',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
              fontSize: '0.65rem', fontWeight: activeTab === tab.id ? 700 : 400,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '1rem' }}>
        {activeTab === 'grid' && <SearchGridTab caseData={caseData} gridResult={gridResult} gridVisible={gridVisible} setGridVisible={setGridVisible} selectedPattern={selectedPattern} setSelectedPattern={handlePatternChange} />}
        {activeTab === 'behavior' && <PetBehaviorTab caseData={caseData} petProfile={petProfile} />}
        {activeTab === 'checklist' && <ChecklistTab checkedItems={checkedItems} toggleChecked={toggleChecked} expandedSections={expandedSections} toggleSection={toggleSection} />}
        {activeTab === 'thermal' && <ThermalTab caseData={caseData} thermalInfo={thermalInfo} expandedThermal={expandedThermal} setExpandedThermal={setExpandedThermal} />}
      </div>
    </div>
  );
}

/* =================== SEARCH GRID TAB =================== */
function SearchGridTab({ caseData, gridResult, gridVisible, setGridVisible, selectedPattern, setSelectedPattern }) {
  const patterns = getAvailablePatterns();
  const hoursMissing = caseData?.last_seen_date ? Math.round((Date.now() - new Date(caseData.last_seen_date).getTime()) / 3600000) : null;
  const recommendedRadius = caseData ? getRecommendedRadius(caseData.pet_type, hoursMissing || 24, caseData.temperament) : null;

  if (!caseData) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="icon">🎯</div>
          <h3>No Case Selected</h3>
          <p>Open a case first to generate a search grid based on the pet's last known location.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Grid Toggle */}
      <div className="card" style={{ marginBottom: '0.75rem' }}>
        <div style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiLayers size={16} style={{ color: gridVisible ? 'var(--primary)' : 'var(--text-muted)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Search Grid Overlay</span>
          </div>
          <button
            onClick={() => setGridVisible(!gridVisible)}
            style={{
              padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid',
              borderColor: gridVisible ? 'var(--primary)' : 'var(--border-default)',
              background: gridVisible ? 'var(--primary-bg)' : 'var(--bg-secondary)',
              color: gridVisible ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {gridVisible ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Recommended Info */}
      {gridResult && (
        <div className="card" style={{ marginBottom: '0.75rem', borderLeft: '3px solid var(--primary)' }}>
          <div style={{ padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <FiInfo size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Search Parameters</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Pattern</div>
                <div style={{ fontWeight: 600 }}>{gridResult.name}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Radius</div>
                <div style={{ fontWeight: 600 }}>{recommendedRadius} mi</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Est. Flight Time</div>
                <div style={{ fontWeight: 600 }}>~{gridResult.estimatedFlightTime} min</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Waypoints</div>
                <div style={{ fontWeight: 600 }}>{gridResult.points.length}</div>
              </div>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {gridResult.description}
            </div>
          </div>
        </div>
      )}

      {/* Pattern Selector */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontWeight: 600 }}>
          Search Pattern
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {patterns.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPattern(p.id)}
              style={{
                padding: '0.6rem', borderRadius: '8px', border: '1px solid',
                borderColor: selectedPattern === p.id ? 'var(--primary)' : 'var(--border-default)',
                background: selectedPattern === p.id ? 'var(--primary-bg)' : 'var(--bg-card)',
                color: selectedPattern === p.id ? 'var(--primary)' : 'var(--text-primary)',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)',
              }}
            >
              <div style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>{p.icon}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Coordinates */}
      {gridResult && gridVisible && (
        <div className="card">
          <div style={{ padding: '0.85rem 1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Waypoint Coordinates</div>
            <div style={{ maxHeight: '200px', overflow: 'auto', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {gridResult.points.map((p, i) => (
                <div key={i} style={{ padding: '0.2rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  WP{i + 1}: {p.lat.toFixed(6)}, {p.lng.toFixed(6)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hours missing alert */}
      {hoursMissing !== null && hoursMissing > 48 && (
        <div className="card" style={{ marginTop: '0.75rem', borderLeft: '3px solid var(--danger)' }}>
          <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <FiAlertTriangle size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.85rem' }}>Extended Search ({hoursMissing}h missing)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Expand your search radius. Check water sources and sheltered areas. Night thermal flights are critical.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =================== PET BEHAVIOR TAB =================== */
function PetBehaviorTab({ caseData, petProfile }) {
  const [selectedType, setSelectedType] = useState(caseData?.pet_type || 'dog');
  const profile = petProfile || PET_PROFILES[selectedType];
  const temperament = caseData?.temperament || 'unknown';

  if (!caseData) {
    return (
      <div>
        {/* Pet type selector for no-case mode */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {Object.entries(PET_PROFILES).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              style={{
                padding: '0.4rem 0.7rem', borderRadius: '6px', border: '1px solid',
                borderColor: selectedType === key ? 'var(--primary)' : 'var(--border-default)',
                background: selectedType === key ? 'var(--primary-bg)' : 'var(--bg-card)',
                color: selectedType === key ? 'var(--primary)' : 'var(--text-primary)',
                fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600,
              }}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
        <PetBehaviorContent profile={PET_PROFILES[selectedType]} temperament="unknown" />
      </div>
    );
  }

  return <PetBehaviorContent profile={profile} temperament={temperament} />;
}

function PetBehaviorContent({ profile, temperament }) {
  return (
    <div>
      {/* Typical Range */}
      <div className="card" style={{ marginBottom: '0.5rem' }}>
        <div style={{ padding: '0.85rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <FiNavigation size={14} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Typical Range</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.3rem' }}>
            {profile.icon} {profile.typicalRange[temperament] || profile.typicalRange.unknown}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {profile.travelPattern}
          </div>
        </div>
      </div>

      {/* Hiding Spots */}
      <div className="card" style={{ marginBottom: '0.5rem' }}>
        <div style={{ padding: '0.85rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <FiTarget size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Where to Look</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {profile.hidingSpots.map((spot, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--accent)', fontSize: '0.7rem' }}>▸</span>
                {spot}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time-based Strategy */}
      <div className="card" style={{ marginBottom: '0.5rem' }}>
        <div style={{ padding: '0.85rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <FiClock size={14} style={{ color: 'var(--success)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Search Strategy by Day</span>
          </div>
          {Object.entries(profile.searchStrategy).map(([day, strategy]) => (
            <div key={day} style={{ marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: day === 'day1' ? 'var(--danger)' : day === 'day2' ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                {day === 'day1' ? 'Day 1 (First 24h)' : day === 'day2' ? 'Day 2 (24-48h)' : 'Day 3+'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{strategy}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Behavior */}
      <div className="card" style={{ borderLeft: '3px solid var(--primary)' }}>
        <div style={{ padding: '0.85rem 1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            ⏰ When to Fly
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {profile.timeBehavior}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =================== CHECKLIST TAB =================== */
function ChecklistTab({ checkedItems, toggleChecked, expandedSections, toggleSection }) {
  const totalItems = SEARCH_CHECKLIST.preflight.items.length + SEARCH_CHECKLIST.inflight.items.length + SEARCH_CHECKLIST.postflight.items.length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div>
      {/* Progress */}
      <div className="card" style={{ marginBottom: '0.75rem' }}>
        <div style={{ padding: '0.85rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Progress</span>
            <span style={{ fontSize: '0.8rem', color: checkedCount === totalItems ? 'var(--success)' : 'var(--text-muted)' }}>
              {checkedCount}/{totalItems} complete
            </span>
          </div>
          <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(checkedCount / totalItems) * 100}%`, background: checkedCount === totalItems ? 'var(--success)' : 'var(--primary)', borderRadius: '3px', transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      {/* Sections */}
      {Object.entries(SEARCH_CHECKLIST).map(([key, section]) => {
        const sectionChecked = section.items.filter(i => checkedItems[i.id]).length;
        return (
          <div key={key} className="card" style={{ marginBottom: '0.5rem' }}>
            <button
              onClick={() => toggleSection(key)}
              style={{
                width: '100%', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', background: 'none', border: 'none', color: 'var(--text-primary)',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>{section.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{section.title}</span>
                <span style={{ fontSize: '0.7rem', color: sectionChecked === section.items.length ? 'var(--success)' : 'var(--text-muted)' }}>
                  {sectionChecked}/{section.items.length}
                </span>
              </div>
              {expandedSections[key] ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>
            {expandedSections[key] && (
              <div style={{ padding: '0 1rem 0.75rem' }}>
                {section.items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecked(item.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                      padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer', opacity: checkedItems[item.id] ? 0.6 : 1,
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                      border: `2px solid ${checkedItems[item.id] ? 'var(--success)' : item.critical ? 'var(--danger)' : 'var(--border-default)'}`,
                      background: checkedItems[item.id] ? 'var(--success)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', color: '#fff', marginTop: '0.1rem',
                    }}>
                      {checkedItems[item.id] && '✓'}
                    </div>
                    <div style={{ fontSize: '0.8rem', lineHeight: 1.4, textDecoration: checkedItems[item.id] ? 'line-through' : 'none', color: checkedItems[item.id] ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {item.label}
                      {item.critical && !checkedItems[item.id] && (
                        <span style={{ marginLeft: '0.3rem', fontSize: '0.6rem', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', padding: '0.1rem 0.3rem', borderRadius: '3px', fontWeight: 700 }}>REQUIRED</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* =================== THERMAL TAB =================== */
function ThermalTab({ caseData, thermalInfo, expandedThermal, setExpandedThermal }) {
  return (
    <div>
      {/* Target Signature */}
      {thermalInfo && (
        <div className="card" style={{ marginBottom: '0.5rem', borderLeft: '3px solid var(--accent)' }}>
          <div style={{ padding: '0.85rem 1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--accent)' }}>
              {thermalInfo.icon} YOUR TARGET: {thermalInfo.category}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Body Temp</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{thermalInfo.tempRange}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Best Palette</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{thermalInfo.bestPalette}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>{thermalInfo.appearance}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Confused with: {thermalInfo.confusion}</div>
          </div>
        </div>
      )}

      {/* Best Time */}
      {thermalInfo && (
        <div className="card" style={{ marginBottom: '0.5rem', borderLeft: '3px solid var(--primary)' }}>
          <div style={{ padding: '0.85rem 1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.3rem' }}>
              🌙 BEST TIME TO FLY
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{thermalInfo.tips || THERMAL_GUIDE.tips.nightVsDay.content}</div>
          </div>
        </div>
      )}

      {/* All Signatures */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
        All Pet Signatures
      </div>
      {THERMAL_GUIDE.signatures.map((sig, i) => (
        <div key={i} className="card" style={{ marginBottom: '0.5rem' }}>
          <button
            onClick={() => setExpandedThermal(expandedThermal === i ? null : i)}
            style={{
              width: '100%', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', background: 'none', border: 'none', color: 'var(--text-primary)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>{sig.icon}</span>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{sig.category}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sig.tempRange}</span>
            </div>
            {expandedThermal === i ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </button>
          {expandedThermal === i && (
            <div style={{ padding: '0 1rem 0.75rem', fontSize: '0.8rem', lineHeight: 1.5 }}>
              <div style={{ color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{sig.appearance}</div>
              <div style={{ color: 'var(--accent)', fontSize: '0.7rem' }}>Best palette: {sig.bestPalette}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.2rem' }}>Look-alikes: {sig.confusion}</div>
            </div>
          )}
        </div>
      ))}

      {/* False Positives */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, margin: '0.75rem 0 0.4rem', letterSpacing: '0.05em' }}>
        Common False Positives
      </div>
      {THERMAL_GUIDE.falsePositives.map((fp, i) => (
        <div key={i} className="card" style={{ marginBottom: '0.4rem' }}>
          <button
            onClick={() => setExpandedThermal(expandedThermal === `fp${i}` ? null : `fp${i}`)}
            style={{
              width: '100%', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', background: 'none', border: 'none', color: 'var(--text-primary)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{fp.source} <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{fp.tempRange}</span></span>
            {expandedThermal === `fp${i}` ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </button>
          {expandedThermal === `fp${i}` && (
            <div style={{ padding: '0 1rem 0.6rem', fontSize: '0.75rem', lineHeight: 1.5 }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{fp.appearance}</div>
              <div style={{ color: 'var(--success)', fontWeight: 600 }}>How to tell: {fp.howToDistinguish}</div>
            </div>
          )}
        </div>
      ))}

      {/* Pro Tips */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, margin: '0.75rem 0 0.4rem', letterSpacing: '0.05em' }}>
        Pro Tips
      </div>
      {Object.entries(THERMAL_GUIDE.tips).map(([key, tip]) => (
        <div key={key} className="card" style={{ marginBottom: '0.4rem' }}>
          <button
            onClick={() => setExpandedThermal(expandedThermal === `tip${key}` ? null : `tip${key}`)}
            style={{
              width: '100%', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', background: 'none', border: 'none', color: 'var(--text-primary)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{tip.title}</span>
            {expandedThermal === `tip${key}` ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </button>
          {expandedThermal === `tip${key}` && (
            <div style={{ padding: '0 1rem 0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {tip.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
