import { useState, useEffect } from 'react';
import { audioService } from './audioService';
import { generateMissionProfile, type MissionProfile } from './data/patronData';
import type { SavedMap } from './WorldBuilder';

export function PatronGenerator() {
  const [patrons, setPatrons] = useState<MissionProfile[]>(() => {
      try {
          const stored = localStorage.getItem('traveler_saved_patrons');
          return stored ? JSON.parse(stored) : [];
      } catch { return []; }
  });

  useEffect(() => {
      localStorage.setItem('traveler_saved_patrons', JSON.stringify(patrons));
  }, [patrons]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningPatronId, setAssigningPatronId] = useState<string | null>(null);
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string>('');
  const [selectedHex, setSelectedHex] = useState<string>('');

  const generatePatron = () => {
    audioService.playClick();
    const newPatron = generateMissionProfile();
    setPatrons(prev => [newPatron, ...prev]);
  };

  const openAssignModal = (patronId: string) => {
      try {
          const stored = localStorage.getItem('traveler_saved_maps');
          const maps = stored ? JSON.parse(stored) : [];
          setSavedMaps(maps);
      } catch { setSavedMaps([]); }
      
      setAssigningPatronId(patronId);
      setAssignModalOpen(true);
      setSelectedMapId('');
      setSelectedHex('');
  };

  const confirmAssign = () => {
       if (!selectedMapId || !selectedHex || !assigningPatronId) return;
       
       const maps = [...savedMaps];
       const mapIndex = maps.findIndex(m => m.id === selectedMapId);
       if (mapIndex === -1) return;
       
       const targetMap = maps[mapIndex];
       const patronToAssign = patrons.find(p => p.id === assigningPatronId);
       if (!patronToAssign) return;

       // update world in worlds array
       const worldIndex = targetMap.worlds.findIndex(w => w.hex === selectedHex);
       if (worldIndex !== -1) {
           const world = targetMap.worlds[worldIndex];
           world.patrons = [...(world.patrons || []), patronToAssign];
           
           // update world in hexGrid if exists
           if (targetMap.hexGrid) {
                targetMap.hexGrid = targetMap.hexGrid.map(w => {
                    if (w && w.hex === selectedHex) {
                        return { ...w, patrons: [...(w.patrons || []), patronToAssign] };
                    }
                    return w;
                });
           }
           
           localStorage.setItem('traveler_saved_maps', JSON.stringify(maps));
           
           setPatrons(prev => prev.map(p => {
               if (p.id === assigningPatronId) return { ...p, assignedLocation: `Assigned to map [${targetMap.name}] on hex [${selectedHex}]` };
               return p;
           }));
       }
       
       setAssignModalOpen(false);
  };

  return (
    <div className="panel" data-title="[ REFEREE: PATRON & MISSION GENERATOR ]">
      <p style={{ color: 'var(--color-phosphor-dim)' }}>
        Initialize new patron encounters and mission profiles using standard generation protocols. Multiple generated instances will be logged below.
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={generatePatron} style={{ padding: '10px 20px', fontSize: '1.1rem' }}>
          &gt; GENERATE NEW PATRON
        </button>
        {patrons.length > 0 && (
          <button onClick={() => { setPatrons([]); audioService.playClick(); }} style={{ padding: '10px 20px', fontSize: '1.1rem', borderColor: '#ff5555', color: '#ff5555' }}>
            [ CLEAR ARCHIVE ]
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {patrons.map((patronData) => (
          <div key={patronData.id} style={{ padding: '15px', border: '1px solid var(--color-phosphor)', background: 'rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#00ff00' }}>[ MISSION PROFILE : {patronData.id.slice(-6)} ]</h3>
            
            <div style={{ marginBottom: '10px' }}>
              <strong style={{ color: 'var(--color-phosphor-dim)' }}>PATRON IDENTITY: </strong>
              <span>{patronData.patron}</span> <span style={{ fontSize: '0.8rem', color: 'var(--color-phosphor-dim)', marginLeft: '10px' }}>[roll: {patronData.patronRoll}]</span>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <strong style={{ color: 'var(--color-phosphor-dim)' }}>MISSION TYPE: </strong>
              <span>{patronData.mission}</span> <span style={{ fontSize: '0.8rem', color: 'var(--color-phosphor-dim)', marginLeft: '10px' }}>[roll: {patronData.missionRoll}]</span>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <strong style={{ color: 'var(--color-phosphor-dim)' }}>TARGET: </strong>
              <span>{patronData.target}</span> <span style={{ fontSize: '0.8rem', color: 'var(--color-phosphor-dim)', marginLeft: '10px' }}>[roll: {patronData.targetRoll}]</span>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <strong style={{ color: 'var(--color-phosphor-dim)' }}>OPPOSITION: </strong>
              <span>{patronData.opposition}</span> <span style={{ fontSize: '0.8rem', color: 'var(--color-phosphor-dim)', marginLeft: '10px' }}>[roll: {patronData.oppositionRoll}]</span>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <strong style={{ color: 'var(--color-phosphor-dim)' }}>BASE REWARD: </strong>
              <span style={{ color: '#00ff00' }}>Cr {patronData.rewardBase.toLocaleString()}</span>
            </div>

            <div style={{ marginTop: '20px', padding: '10px', borderLeft: '3px solid #ff5555', background: 'rgba(255,85,85,0.1)' }}>
              <strong style={{ color: '#ff5555' }}>COMPLICATION [roll {patronData.complicationRoll}]: </strong><br/>
              <span>{patronData.complication}</span>
            </div>

            {patronData.assignedLocation && (
               <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(0,255,170,0.1)', border: '1px solid #00ffaa', color: '#00ffaa' }}>
                  <strong style={{ display: 'block', marginBottom: '5px' }}>✓ ACTIVE MISSION HOOK</strong>
                  {patronData.assignedLocation}
               </div>
            )}
            
            <div style={{ display: 'flex', gap: '15px', marginTop: '15px', borderTop: '1px solid var(--color-phosphor-dim)', paddingTop: '15px' }}>
                {!patronData.assignedLocation && (
                    <button 
                       onClick={() => openAssignModal(patronData.id)}
                       style={{ padding: '8px 20px', borderColor: 'var(--color-phosphor)', background: 'transparent', color: 'var(--color-phosphor)' }}
                    >
                       &gt; ASSIGN TO MAP
                    </button>
                )}
                <button 
                   onClick={() => setPatrons(prev => prev.filter(p => p.id !== patronData.id))}
                   style={{ padding: '8px 20px', borderColor: '#ff5555', background: 'transparent', color: '#ff5555' }}
                >
                   [ DELETE ]
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* ASSIGN MODAL */}
      {assignModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="panel" style={{ maxWidth: '500px', width: '100%', border: '1px solid var(--color-phosphor)', background: '#050000', padding: '25px', boxShadow: '0 0 20px rgba(0,255,0,0.2)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#00ffaa', borderBottom: '1px solid var(--color-phosphor)', paddingBottom: '10px' }}>[ ASSIGN MISSION HOOK TO MAP ]</h3>
            
            {savedMaps.length === 0 ? (
                <p style={{ color: 'var(--color-phosphor-dim)', lineHeight: '1.5' }}>No saved maps found in the databanks. Generate and save a map in the World Builder first.</p>
            ) : (
                <>
                    <label style={{ display: 'block', color: 'var(--color-phosphor)', marginBottom: '5px', marginTop: '10px' }}>Select Target Astrogation Map:</label>
                    <select 
                        value={selectedMapId} 
                        onChange={e => { setSelectedMapId(e.target.value); setSelectedHex(''); }}
                        style={{ width: '100%', padding: '10px', background: '#000', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor)', marginBottom: '15px', fontSize: '1.1rem' }}
                    >
                        <option value="">-- Choose Map --</option>
                        {savedMaps.map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.type.toUpperCase()})</option>
                        ))}
                    </select>

                    {selectedMapId && (
                        <>
                            <label style={{ display: 'block', color: 'var(--color-phosphor)', marginBottom: '5px' }}>Select Planetary System (Hex):</label>
                            <select 
                                value={selectedHex} 
                                onChange={e => setSelectedHex(e.target.value)}
                                style={{ width: '100%', padding: '10px', background: '#000', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor)', marginBottom: '20px', fontSize: '1.1rem' }}
                            >
                                <option value="">-- Choose Hex --</option>
                                {(savedMaps.find(m => m.id === selectedMapId)?.worlds || []).filter(w => w.hex !== '0000').map(w => (
                                    <option key={w.hex} value={w.hex}>Hex {w.hex} : {w.name}</option>
                                ))}
                            </select>
                        </>
                    )}
                </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px' }}>
               <button onClick={() => setAssignModalOpen(false)} style={{ padding: '8px 20px', borderColor: 'var(--color-phosphor-dim)', color: 'var(--color-phosphor-dim)', background: 'transparent' }}>CANCEL</button>
               <button 
                  onClick={confirmAssign} 
                  disabled={!selectedMapId || !selectedHex}
                  style={{ padding: '8px 20px', fontWeight: 'bold', border: '1px solid #00ffaa', color: (!selectedMapId || !selectedHex) ? 'var(--color-phosphor-dim)' : '#000', background: (!selectedMapId || !selectedHex) ? 'transparent' : '#00ffaa', cursor: (!selectedMapId || !selectedHex) ? 'not-allowed' : 'pointer' }}
               >CONFIRM INJECTION</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
