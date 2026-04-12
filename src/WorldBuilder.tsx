import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { generateWorld, toPseudoHex, generateRandomName, generateUWPString, calculateTradeCodes } from './data/worldData';
import type { WorldData } from './data/worldData';

export interface SavedMap {
  id: string;
  name: string;
  timestamp: number;
  type: 'subsector' | 'single' | 'sector';
  worlds: WorldData[];
  hexGrid?: (WorldData | null)[];
}

export const WorldBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'library' | 'combiner'>('generator');
  const [worlds, setWorlds] = useState<WorldData[]>([]);
  const [hexGrid, setHexGrid] = useState<(WorldData | null)[]>(new Array(80).fill(null));
  const [savedLibrary, setSavedLibrary] = useState<SavedMap[]>(() => {
    try {
      const stored = localStorage.getItem('traveler_saved_maps');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('traveler_saved_maps', JSON.stringify(savedLibrary));
  }, [savedLibrary]);

  const [savingName, setSavingName] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [showMapLegend, setShowMapLegend] = useState(false);
  const [hoveredHex, setHoveredHex] = useState<{ sys: WorldData; x: number; y: number } | null>(null);
  const [editSys, setEditSys] = useState<WorldData | null>(null);
  const [searchHex, setSearchHex] = useState('');
  const [exportBW, setExportBW] = useState(true);
  const [density, setDensity] = useState(0.5);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [jumpLines, setJumpLines] = useState<{id: string, x1: number, y1: number, x2: number, y2: number}[]>([]);
  
  const [combinerSlots, setCombinerSlots] = useState<(SavedMap | null)[]>([null, null, null, null]);
  const [combineName, setCombineName] = useState("");
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  
  const handleExportPDFBW = () => {
    if (!mapContainerRef.current) return;
    setExportBW(true);
    setTimeout(async () => {
        try {
            const dataUrl = await toPng(mapContainerRef.current!, {
                backgroundColor: '#ffffff',
                pixelRatio: 2
            });
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
                const pdf = new jsPDF({
                    orientation: img.width > img.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [img.width, img.height]
                });
                pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
                pdf.save(`Traveler_Sector_BW_${Date.now()}.pdf`);
            };
        } catch (err) {
            console.error("PDF B&W generation failed", err);
        }
    }, 100);
  };

  // Calculate jump routes
  useEffect(() => {
    const calcLines = () => {
        if (!mapContainerRef.current) return;
        const containerRect = mapContainerRef.current.getBoundingClientRect();
        
        const isSector = hexGrid.length > 80;
        const gridCols = isSector ? 16 : 8;

        // Helper to get hex offset to axial
        const offsetToAxial = (cIdx: number, rIdx: number) => {
             const q = cIdx;
             const r = rIdx - Math.floor(cIdx / 2);
             return { q, r, s: -q - r };
        };
        const hexDist = (a: any, b: any) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s));

        const newLines: any[] = [];
        
        for (let i = 0; i < hexGrid.length; i++) {
            const sysA = hexGrid[i];
            if (!sysA) continue;
            // Imperial routes primarily spider out from A and B class starports
            if (sysA.starport !== 'A' && sysA.starport !== 'B') continue;

            const cA = i % gridCols;
            const rA = Math.floor(i / gridCols);
            const axA = offsetToAxial(cA, rA);

            for (let j = i + 1; j < hexGrid.length; j++) {
                const sysB = hexGrid[j];
                if (!sysB) continue;
                // Only connect to A, B, or C class
                if (!['A', 'B', 'C'].includes(sysB.starport)) continue;

                const cB = j % gridCols;
                const rB = Math.floor(j / gridCols);
                const axB = offsetToAxial(cB, rB);

                if (hexDist(axA, axB) === 1) {
                    // Valid route! Get DOM centers
                    const elA = document.getElementById(`hex-dom-${i}`);
                    const elB = document.getElementById(`hex-dom-${j}`);
                    if (elA && elB) {
                        const rectA = elA.getBoundingClientRect();
                        const rectB = elB.getBoundingClientRect();
                        newLines.push({
                            id: `${i}-${j}`,
                            x1: rectA.left + rectA.width/2 - containerRect.left,
                            y1: rectA.top + rectA.height/2 - containerRect.top,
                            x2: rectB.left + rectB.width/2 - containerRect.left,
                            y2: rectB.top + rectB.height/2 - containerRect.top
                        });
                    }
                }
            }
        }
        setJumpLines(newLines);
    };

    const timeoutId = setTimeout(calcLines, 50); // slight delay to allow dom render
    
    window.addEventListener('resize', calcLines);
    return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', calcLines);
    };
  }, [hexGrid]);

  const handleCombineSector = () => {
      // Must have all 4 slots
      if (combinerSlots.some(slot => slot === null)) return;
      if (!combineName.trim()) return;

      const newSectorGrid = new Array(320).fill(null);
      const newSectorWorlds: WorldData[] = [];

      combinerSlots.forEach((slotMap, slotIndex) => {
          if (!slotMap || !slotMap.hexGrid || slotMap.type !== 'subsector') return;
          
          const colOffset = (slotIndex % 2 === 1) ? 8 : 0;
          const rowOffset = (slotIndex >= 2) ? 10 : 0;
          
          slotMap.hexGrid.forEach((sys, i) => {
              if (sys) {
                  const origCol = (i % 8) + 1; 
                  const origRow = Math.floor(i / 8) + 1; 
                  
                  const newCol = origCol + colOffset;
                  const newRow = origRow + rowOffset;
                  
                  const newHexStr = `${newCol.toString().padStart(2, '0')}${newRow.toString().padStart(2, '0')}`;
                  const updatedSys = { ...sys, hex: newHexStr };
                  
                  const newIndex = (newRow - 1) * 16 + (newCol - 1);
                  newSectorGrid[newIndex] = updatedSys;
                  newSectorWorlds.push(updatedSys);
              }
          });
      });

      const newSave: SavedMap = {
          id: Date.now().toString(),
          name: combineName,
          timestamp: Date.now(),
          type: 'sector',
          worlds: newSectorWorlds,
          hexGrid: newSectorGrid
      };

      setSavedLibrary(prev => [newSave, ...prev]);
      setActiveTab('library');
      setCombinerSlots([null, null, null, null]);
      setCombineName("");
  };

  const confirmSaveMap = () => {
    if (worlds.length === 0 || !savingName) return;
    
    const isSubsector = hexGrid.some(v => v !== null);
    const newSave: SavedMap = {
      id: Math.random().toString(36).substr(2, 9),
      name: savingName,
      timestamp: Date.now(),
      type: isSubsector ? 'subsector' : 'single',
      worlds: [...worlds],
      hexGrid: isSubsector ? [...hexGrid] : undefined
    };
    setSavedLibrary(prev => [newSave, ...prev]);
    setSavingName(null);
  };
  
  const handleGenerateSingle = () => {
    const newWorld = generateWorld(generateRandomName());
    setWorlds(prev => [newWorld, ...prev]);
  };

  const updateWorldName = (worldId: string, newName: string) => {
    setWorlds(prev => prev.map(w => w.id === worldId ? { ...w, name: newName } : w));
    setHexGrid(prev => prev.map(w => w?.id === worldId ? { ...w, name: newName } : w));
  };

  const handleStatChange = (stat: keyof WorldData, value: any) => {
      setEditSys(prev => {
          if (!prev) return prev;
          let updated = { ...prev, [stat]: value };
          
          // Rule cascading
          if (updated.size === 0) {
              updated.atmosphere = 0;
              updated.hydrographics = 0;
          }
          if (updated.atmosphere <= 1 && updated.size > 0) {
              updated.hydrographics = 0;
          }
          if (updated.population === 0) {
              updated.government = 0;
              updated.lawLevel = 0;
              updated.techLevel = 0;
              updated.starport = 'X';
          }
          
          updated.uwp = generateUWPString(updated);
          updated.tradeCodes = calculateTradeCodes(updated);
          return updated;
      });
  };

  const saveEditedSystem = () => {
      if (!editSys) return;
      setHexGrid(prev => prev.map(w => w?.id === editSys.id ? editSys : w));
      setWorlds(prev => prev.map(w => w.id === editSys.id ? editSys : w));
      setEditSys(null);
  };

  const handleGenerateSubsector = () => {
    const newGrid: (WorldData | null)[] = new Array(80).fill(null);
    const generatedWorlds: WorldData[] = [];
    
    for (let c = 1; c <= 8; c++) {
      for (let r = 1; r <= 10; r++) {
        // Density chance of system existing
        if (Math.random() < density) {
          const colStr = c.toString().padStart(2, '0');
          const rowStr = r.toString().padStart(2, '0');
          const hex = `${colStr}${rowStr}`;
          
          const world = generateWorld(generateRandomName(), hex);
          const index = (r - 1) * 8 + (c - 1);
          newGrid[index] = world;
          generatedWorlds.push(world);
        }
      }
    }
    
    setHexGrid(newGrid);
    setWorlds(generatedWorlds);
  };

  const handleGenerateSector = () => {
    const newGrid: (WorldData | null)[] = new Array(320).fill(null);
    const generatedWorlds: WorldData[] = [];
    
    for (let c = 1; c <= 16; c++) {
      for (let r = 1; r <= 20; r++) {
        if (Math.random() < density) {
          const colStr = c.toString().padStart(2, '0');
          const rowStr = r.toString().padStart(2, '0');
          const hex = `${colStr}${rowStr}`;
          
          const world = generateWorld(generateRandomName(), hex);
          const index = (r - 1) * 16 + (c - 1);
          newGrid[index] = world;
          generatedWorlds.push(world);
        }
      }
    }
    
    setHexGrid(newGrid);
    setWorlds(generatedWorlds);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ borderBottom: '1px solid var(--color-phosphor)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span>REFEREE: WORLD BUILDER</span>
            <button onClick={() => setActiveTab('generator')} className="toolbar-btn" style={{ background: 'none', border: '1px solid', borderColor: activeTab === 'generator' ? 'var(--color-phosphor)' : 'transparent', color: activeTab === 'generator' ? 'var(--color-phosphor)' : 'var(--color-phosphor-dim)', cursor: 'pointer' }}>MAP<br/>GENERATOR</button>
            <button onClick={() => setActiveTab('library')} className="toolbar-btn" style={{ background: 'none', border: '1px solid', borderColor: activeTab === 'library' ? 'var(--color-phosphor)' : 'transparent', color: activeTab === 'library' ? 'var(--color-phosphor)' : 'var(--color-phosphor-dim)', cursor: 'pointer' }}>SAVED<br/>LIBRARY ({savedLibrary.length})</button>
            <button onClick={() => setActiveTab('combiner')} className="toolbar-btn" style={{ background: 'none', border: '1px solid', borderColor: activeTab === 'combiner' ? 'var(--color-phosphor)' : 'transparent', color: activeTab === 'combiner' ? 'var(--color-phosphor)' : 'var(--color-phosphor-dim)', cursor: 'pointer' }}>SECTOR<br/>COMBINER</button>
        </div>
        
        {activeTab === 'generator' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {savingName !== null ? (
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input 
                            type="text" 
                            value={savingName} 
                            onChange={(e) => setSavingName(e.target.value)} 
                            placeholder="Map Name..."
                            autoFocus
                            className="toolbar-select"
                            style={{ background: '#000', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor)', outline: 'none' }}
                        />
                        <button onClick={confirmSaveMap} className="toolbar-btn" style={{ background: '#00aaff', border: '1px solid #00aaff', color: '#000', cursor: 'pointer', fontWeight: 'bold' }}>
                        CONFIRM
                        </button>
                        <button onClick={() => setSavingName(null)} className="toolbar-btn" style={{ background: 'transparent', border: '1px solid var(--color-phosphor-dim)', color: 'var(--color-phosphor-dim)', cursor: 'pointer' }}>
                        CANCEL
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setSavingName(hexGrid.length > 80 ? "New Sector" : "New Subsector")} disabled={worlds.length === 0} className="toolbar-btn" style={{ background: 'transparent', border: '1px solid #00aaff', color: '#00aaff', cursor: 'pointer', opacity: worlds.length === 0 ? 0.3 : 1 }}>
                    SAVE SEC
                    </button>
                )}
                <button onClick={handleGenerateSingle} className="toolbar-btn" style={{ background: 'transparent', border: '1px solid var(--color-phosphor)', color: 'var(--color-phosphor)', cursor: 'pointer' }}>
                GENERATE SINGLE<br/>WORLD
                </button>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <select 
                       value={density} 
                       onChange={(e) => setDensity(Number(e.target.value))}
                       className="toolbar-select"
                       style={{ background: '#050000', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor)', borderRight: 'none', cursor: 'pointer', outline: 'none' }}
                    >
                       <option value={0.16}>Rift (16%)</option>
                       <option value={0.33}>Sparse (33%)</option>
                       <option value={0.50}>Standard (50%)</option>
                       <option value={0.66}>Dense (66%)</option>
                       <option value={0.83}>Cluster (83%)</option>
                       <option value={1.00}>Core (100%)</option>
                    </select>
                    <button onClick={handleGenerateSubsector} className="toolbar-btn" style={{ background: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor)', color: '#000', cursor: 'pointer' }}>
                    GENERATE<br/>SUBSECTOR
                    </button>
                    <button onClick={handleGenerateSector} className="toolbar-btn" style={{ background: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor)', borderLeft: '1px solid #000', color: '#000', cursor: 'pointer' }}>
                    GENERATE<br/>SECTOR
                    </button>
                </div>
                <button onClick={() => { setHexGrid(new Array(80).fill(null)); setWorlds([]); }} className="toolbar-btn" style={{ background: 'transparent', border: '1px solid #ff5555', color: '#ff5555', cursor: 'pointer' }}>
                CLEAR<br/>MAP
                </button>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={handleExportPDFBW} className="toolbar-btn" style={{ background: '#fff', border: '1px solid #fff', color: '#000', cursor: 'pointer', fontWeight: 'bold' }}>
                    EXPORT B&W<br/>MAP
                    </button>
                </div>
            </div>
        )}
      </h2>

      {activeTab === 'library' && (
        <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <button onClick={() => {
                   const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedLibrary, null, 2));
                   const dlAnchorElem = document.getElementById('downloadAnchorElem');
                   if (dlAnchorElem) {
                       dlAnchorElem.setAttribute("href", dataStr);
                       dlAnchorElem.setAttribute("download", "traveler_saved_maps.json");
                       dlAnchorElem.click();
                   }
                }} className="toolbar-btn" style={{ background: 'transparent', border: '1px solid var(--color-phosphor)', color: 'var(--color-phosphor)', cursor: 'pointer', fontWeight: 'bold' }}>EXPORT MAPS<br/>(.json)</button>
                
                <input type="file" id="importFile" style={{ display: 'none' }} accept=".json" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                           const json = JSON.parse(e.target?.result as string);
                           if (Array.isArray(json)) {
                               setSavedLibrary(json);
                               localStorage.setItem('traveler_saved_maps', JSON.stringify(json));
                               alert("Maps successfully imported!");
                           } else {
                               alert("Invalid file structure. Must be an array of maps.");
                           }
                        } catch (err) {
                           alert("Error parsing JSON file.");
                        }
                    };
                    reader.readAsText(file);
                }} />
                <button onClick={() => document.getElementById('importFile')?.click()} className="toolbar-btn" style={{ background: 'transparent', border: '1px solid var(--color-phosphor-dim)', color: 'var(--color-phosphor-dim)', cursor: 'pointer' }}>IMPORT<br/>MAPS</button>
                <a id="downloadAnchorElem" style={{display: 'none'}}></a>
            </div>

            {savedLibrary.length === 0 ? (
                <p style={{ color: 'var(--color-phosphor-dim)', fontStyle: 'italic' }}>No saved maps or worlds found in local storage.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   {savedLibrary.map(save => (
                       <div key={save.id} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid var(--color-phosphor)', padding: '15px' }}>
                           <div>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', letterSpacing: '1px' }}>{save.name}</h3>
                                <span style={{ color: 'var(--color-phosphor-dim)', fontSize: '1.1rem' }}>Type: {save.type.toUpperCase()} | Worlds: {save.worlds.length} | Saved: {new Date(save.timestamp).toLocaleString()}</span>
                           </div>
                           <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <button onClick={() => {
                                    setWorlds(save.worlds);
                                    if (save.type === 'subsector' && save.hexGrid) {
                                        setHexGrid(save.hexGrid);
                                    } else if (save.type === 'sector' && save.hexGrid) {
                                        setHexGrid(save.hexGrid);
                                    } else {
                                        setHexGrid(new Array(80).fill(null));
                                    }
                                    setActiveTab('generator');
                                }} style={{ padding: '8px 20px', background: 'var(--color-phosphor)', color: '#000', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>LOAD TO GENERATOR</button>
                                {confirmDeleteId === save.id ? (
                                    <>
                                        <button onClick={() => setSavedLibrary(prev => prev.filter(s => s.id !== save.id))} style={{ padding: '8px 20px', background: '#ff5555', color: '#000', border: '1px solid #ff5555', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>CONFIRM</button>
                                        <button onClick={() => setConfirmDeleteId(null)} style={{ padding: '8px 20px', background: 'transparent', color: 'var(--color-phosphor-dim)', border: '1px solid var(--color-phosphor-dim)', cursor: 'pointer', fontSize: '1.1rem' }}>CANCEL</button>
                                    </>
                                ) : (
                                    <button onClick={() => setConfirmDeleteId(save.id)} style={{ padding: '8px 20px', background: 'transparent', color: '#ff5555', border: '1px solid #ff5555', cursor: 'pointer', fontSize: '1.1rem' }}>DELETE</button>
                                )}
                           </div>
                       </div>
                   ))}
                </div>
            )}
        </div>
      )}

      {activeTab === 'combiner' && (
        <div style={{ marginTop: '20px', display: 'flex', gap: '30px' }}>
            <div style={{ flex: '1', minWidth: '300px', borderRight: '1px dashed var(--color-phosphor)', paddingRight: '20px' }}>
                <h3 style={{ borderBottom: '1px solid var(--color-phosphor)', paddingBottom: '10px' }}>Subsector Maps</h3>
                <p style={{ color: 'var(--color-phosphor-dim)', fontStyle: 'italic', fontSize: '0.9rem' }}>Drag a subsector map below into the sector slots, or click to select and then click a slot.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                    {savedLibrary.filter(s => s.type === 'subsector').map(save => (
                        <div 
                            key={save.id}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('mapId', save.id);
                                setSelectedMapId(save.id);
                            }}
                            onClick={() => setSelectedMapId(save.id)}
                            style={{ 
                                padding: '10px', 
                                border: `1px solid ${selectedMapId === save.id ? '#00ffaa' : 'var(--color-phosphor)'}`, 
                                background: selectedMapId === save.id ? 'rgba(0, 255, 170, 0.2)' : 'rgba(0, 255, 0, 0.05)', 
                                cursor: 'pointer' 
                            }}
                        >
                            <strong style={{ color: selectedMapId === save.id ? '#00ffaa' : 'inherit' }}>{save.name}</strong> <span style={{fontSize: '0.8rem', color: 'var(--color-phosphor-dim)'}}>({save.worlds.length} worlds)</span>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ flex: '2' }}>
                <h3 style={{ borderBottom: '1px solid var(--color-phosphor)', paddingBottom: '10px' }}>Sector Assembly Matrix</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '200px 200px', gap: '15px', marginTop: '20px' }}>
                    {['Alpha (Top-Left)', 'Beta (Top-Right)', 'Gamma (Bottom-Left)', 'Delta (Bottom-Right)'].map((label, idx) => (
                        <div 
                            key={idx}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => {
                                if (selectedMapId) {
                                    const mapData = savedLibrary.find(s => s.id === selectedMapId);
                                    if (mapData) {
                                        setCombinerSlots(prev => {
                                            const next = [...prev];
                                            next[idx] = mapData;
                                            return next;
                                        });
                                        setSelectedMapId(null);
                                    }
                                }
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const mapId = e.dataTransfer.getData('mapId');
                                const mapData = savedLibrary.find(s => s.id === mapId);
                                if (mapData) {
                                    setCombinerSlots(prev => {
                                        const next = [...prev];
                                        next[idx] = mapData;
                                        return next;
                                    });
                                }
                            }}
                            style={{ border: '2px dashed ' + (combinerSlots[idx] ? '#00ffaa' : 'var(--color-phosphor-dim)'), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: combinerSlots[idx] ? 'rgba(0, 255, 170, 0.1)' : 'transparent' }}
                        >
                            <span style={{ color: 'var(--color-phosphor-dim)', marginBottom: '10px' }}>{label}</span>
                            {combinerSlots[idx] ? (
                                <strong style={{ fontSize: '1.5rem', color: '#00ffaa' }}>{combinerSlots[idx]!.name}</strong>
                            ) : (
                                <span style={{ color: 'var(--color-phosphor-dim)' }}>Empty Slot</span>
                            )}
                            {combinerSlots[idx] && (
                                <button onClick={() => setCombinerSlots(prev => { const n=[...prev]; n[idx]=null; return n;})} style={{ marginTop: '10px', background: 'transparent', border: 'none', color: '#ff5555', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
                            )}
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <input 
                        type="text" 
                        placeholder="New Sector Name..." 
                        value={combineName}
                        onChange={(e) => setCombineName(e.target.value)}
                        style={{ padding: '8px 15px', background: '#000', border: '1px solid var(--color-phosphor)', color: 'var(--color-phosphor)', width: '300px', fontSize: '1.2rem', outline: 'none' }}
                    />
                    <button 
                        onClick={handleCombineSector}
                        disabled={combinerSlots.some(s => s === null) || !combineName.trim()}
                        style={{ padding: '8px 25px', fontSize: '1.2rem', fontWeight: 'bold', background: (combinerSlots.some(s => s === null) || !combineName.trim()) ? 'var(--color-phosphor-dim)' : 'var(--color-phosphor)', color: '#000', border: 'none', cursor: (combinerSlots.some(s => s === null) || !combineName.trim()) ? 'not-allowed' : 'pointer' }}
                    >
                        COMBINE AND SAVE
                    </button>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'generator' && (
        <div ref={printRef} style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
        
        
        {/* Left Col: Hex Grid Visualization */}
        <div style={{ flex: hexGrid.length > 80 ? '2' : '1', minWidth: hexGrid.length > 80 ? '700px' : '400px' }}>
            <h3 style={{ borderBottom: '1px dashed var(--color-phosphor)', marginBottom: '20px' }}>{hexGrid.length > 80 ? 'Sector Map' : 'Subsector Map'}</h3>
            <div ref={mapContainerRef} style={{ display: 'flex', width: '100%', paddingBottom: '10%', position: 'relative' }}>
              
              {/* SVG LAYER FOR TRADE ROUTES */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
                  {jumpLines.map((line) => (
                      <line 
                         key={line.id} 
                         x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} 
                         stroke={exportBW ? "#000000" : "rgba(0, 255, 0, 0.4)"} 
                         strokeWidth={exportBW ? "2" : "3"} 
                         strokeDasharray="5,5" 
                      />
                  ))}
              </svg>

              {(() => {
                 const isSector = hexGrid.length > 80;
                 const gridCols = isSector ? 16 : 8;
                 const gridRows = isSector ? 20 : 10;
                 
                 const colW = 100 / (gridCols * 0.75 + 0.25);
                 const colWidthStr = `${colW}%`;
                 const marginLeftStr = `${-(colW / 4)}%`;
                 const marginTopStr = `${colW * 0.433}%`;

                 return [...Array(gridCols)].map((_, cIdx) => {
                     const colNum = cIdx + 1;
                     const isEvenCol = colNum % 2 === 0;
                     return (
                       <div key={`col-${cIdx}`} style={{ 
                         display: 'flex', flexDirection: 'column', width: colWidthStr, 
                         marginLeft: cIdx === 0 ? '0' : marginLeftStr, 
                         marginTop: isEvenCol ? marginTopStr : '0' 
                       }}>
                          {[...Array(gridRows)].map((_, rIdx) => {
                           const rowNum = rIdx + 1;
                           const sysIdx = (rowNum - 1) * gridCols + cIdx;
                           const sys = hexGrid[sysIdx];
                           const hexFormat = sys ? sys.hex : `${colNum.toString().padStart(2, '0')}${rowNum.toString().padStart(2, '0')}`;
                           let hexBg = exportBW ? '#ffffff' : '#050000';
                       if (sys) {
                           if (sys.starport === 'X' || sys.lawLevel >= 13) {
                               hexBg = exportBW ? '#ffcccc' : 'rgba(120, 0, 0, 0.6)'; // Red Zone
                           } else if (sys.lawLevel >= 9 || sys.atmosphere >= 10) {
                               hexBg = exportBW ? '#ffffcc' : 'rgba(120, 120, 0, 0.5)'; // Amber Zone
                           }
                       }
                       
                       return (
                         <div key={`hex-${sysIdx}`} id={`hex-dom-${sysIdx}`} style={{
                           width: '100%', aspectRatio: '1.1547',
                           clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                           background: exportBW ? '#000000' : 'var(--color-phosphor-dim)',
                           position: 'relative',
                           cursor: sys ? 'pointer' : 'default',
                           marginBottom: '-1px'
                         }} 
                         onClick={() => { if (sys) setEditSys({...sys}); }}
                         onMouseMove={(e) => { if (sys) setHoveredHex({ sys, x: e.clientX, y: e.clientY }); }}
                         onMouseLeave={() => setHoveredHex(null)}
                         >
                            <div style={{
                             position: 'absolute', top: '1px', left: '1px', right: '1px', bottom: '1px',
                             clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                             background: hexBg,
                             display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                           }}>
                             <span style={{ fontSize: '1.0rem', position: 'absolute', top: '5%', color: exportBW ? '#000' : 'var(--color-phosphor)', fontWeight: 'bold' }}>
                               {hexFormat}
                             </span>
                             {sys?.hasGasGiant && (
                                <span style={{ position: 'absolute', top: '12%', right: '18%', fontSize: '1.2rem', color: exportBW ? '#008800' : 'var(--color-phosphor)', textShadow: exportBW ? 'none' : '0 0 5px var(--color-phosphor)' }}>●</span>
                             )}
                             {sys?.bases?.includes('Naval') && (
                                <span style={{ position: 'absolute', top: '35%', right: '10%', fontSize: '1.2rem', color: exportBW ? '#cc0000' : '#ffd700' }}>★</span>
                             )}
                             {sys?.bases?.includes('Scout') && (
                                <span style={{ position: 'absolute', top: '35%', left: '10%', fontSize: '1rem', color: exportBW ? '#0000cc' : '#ffd700' }}>▲</span>
                             )}
                             {sys && (
                               <>
                                 <div style={{ width: '10px', height: '10px', background: exportBW ? '#000' : 'var(--color-phosphor)', borderRadius: '50%', marginTop: '10px' }}></div>
                                 <span style={{ fontSize: '1.6rem', color: exportBW ? '#000' : 'var(--color-phosphor)', marginTop: '2px', fontWeight: 'bold' }}>{sys.starport}</span>
                                 <span style={{ fontSize: '0.95rem', marginTop: '2px', color: exportBW ? '#000' : 'var(--color-phosphor)', textAlign: 'center', wordBreak: 'break-word', padding: '0 2px', lineHeight: '1.1', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>{sys.name}</span>
                               </>
                             )}
                           </div>
                         </div>
                       );
                      })}
                   </div>
                 );
               })})()}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <p style={{ fontSize: '1rem', color: 'var(--color-phosphor-dim)', margin: 0 }}>Map generated at {Math.round(density * 100)}% Sector Density.</p>
                <button 
                    onClick={() => setShowMapLegend(true)}
                    style={{ padding: '8px 15px', borderColor: 'var(--color-phosphor)', color: 'var(--color-phosphor)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}
                >[ MAP LEGEND ]</button>
            </div>
         </div>

        {/* Right Col: World List */}
        <div style={{ flex: hexGrid.length > 80 ? '1' : '2', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', paddingRight: '10px' }}>
            <h3 style={{ borderBottom: '1px dashed var(--color-phosphor)', display: 'flex', justifyContent: 'space-between', paddingBottom: '10px' }}>
                <span>Generated Systems Data ({worlds.length})</span>
                <input 
                    type="text" 
                    placeholder="Search Base Hex... (e.g. 0101)" 
                    value={searchHex}
                    onChange={(e) => setSearchHex(e.target.value)}
                    style={{ background: '#000', border: '1px solid var(--color-phosphor)', color: 'var(--color-phosphor)', padding: '2px 8px', width: '200px' }}
                />
            </h3>
            {worlds.length === 0 ? (
                <p style={{ color: 'var(--color-phosphor-dim)', fontStyle: 'italic' }}>No systems generated yet.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '15px' }}>
                    {worlds.filter(w => w.hex.includes(searchHex)).map(w => (
                        <div key={w.id} style={{ border: '1px solid var(--color-phosphor)', padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0, 50, 0, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--color-phosphor-dim)', paddingBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input 
                                        value={w.name}
                                        onChange={(e) => updateWorldName(w.id, e.target.value)}
                                        style={{ 
                                            background: 'transparent', border: 'none', borderBottom: '1px solid transparent', 
                                            color: 'var(--color-phosphor)', fontWeight: 'bold', fontSize: '1.8rem', letterSpacing: '1px', 
                                            width: '180px', outline: 'none' 
                                        }}
                                        onFocus={(e) => e.target.style.borderBottom = '1px solid var(--color-phosphor)'}
                                        onBlur={(e) => e.target.style.borderBottom = '1px solid transparent'}
                                    />
                                    {w.hex !== '0000' && <span style={{ fontWeight: 'bold', fontSize: '1.8rem', letterSpacing: '1px' }}>[Hex {w.hex}]</span>}
                                </div>
                                <span style={{ fontSize: '1.8rem', color: '#fff', background: '#333', padding: '2px 10px', letterSpacing: '2px' }}>{w.uwp}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '1.4rem', marginTop: '10px' }}>
                                <div><span style={{ color: 'var(--color-phosphor-dim)' }}>Starport:</span> {w.starport}</div>
                                <div><span style={{ color: 'var(--color-phosphor-dim)' }}>Size:</span> {w.size} ({toPseudoHex(w.size)})</div>
                                <div><span style={{ color: 'var(--color-phosphor-dim)' }}>Atmos:</span> {w.atmosphere} ({toPseudoHex(w.atmosphere)})</div>
                                <div><span style={{ color: 'var(--color-phosphor-dim)' }}>Hydro:</span> {w.hydrographics} ({toPseudoHex(w.hydrographics)})</div>
                                <div><span style={{ color: 'var(--color-phosphor-dim)' }}>Pop:</span> {w.population} ({toPseudoHex(w.population)})</div>
                                <div><span style={{ color: 'var(--color-phosphor-dim)' }}>Gov:</span> {w.government} ({toPseudoHex(w.government)})</div>
                                <div><span style={{ color: 'var(--color-phosphor-dim)' }}>Law:</span> {w.lawLevel} ({toPseudoHex(w.lawLevel)})</div>
                                <div><span style={{ color: 'var(--color-phosphor-dim)' }}>Tech:</span> {w.techLevel} ({toPseudoHex(w.techLevel)})</div>
                            </div>
                            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: 'var(--color-phosphor-dim)', fontSize: '1.3rem' }}>Trade Codes: </span>
                                <button 
                                    onClick={() => setShowLegend(true)}
                                    style={{ padding: '0 6px', fontSize: '1rem', borderColor: 'var(--color-phosphor-dim)', color: 'var(--color-phosphor-dim)', background: 'transparent', cursor: 'pointer' }}
                                >[?]</button>
                                <span style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '1.6rem', letterSpacing: '1px', marginLeft: '5px' }}>
                                    {w.tradeCodes.length > 0 ? w.tradeCodes.join(' ') : 'None'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
      )}

      {/* LEGEND MODAL */}
      {showLegend && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="panel" style={{ maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid var(--color-phosphor)', background: '#050000', padding: '35px', boxShadow: '0 0 20px rgba(0,255,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid var(--color-phosphor)', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, color: 'var(--color-phosphor)', fontSize: '2.2rem', letterSpacing: '2px' }}>TRADE CODE GLOSSARY</h2>
              <button 
                onClick={() => setShowLegend(false)} 
                style={{ padding: '8px 20px', borderColor: 'var(--color-phosphor)', background: 'transparent', color: 'var(--color-phosphor)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}>
                CLOSE
              </button>
            </div>
            
            <div style={{ fontSize: '1.4rem', color: 'var(--color-phosphor-dim)', lineHeight: '1.8' }}>
              <h3 style={{ color: '#00ff00', marginTop: '15px', marginBottom: '12px', fontSize: '1.6rem', letterSpacing: '1px' }}>Planetary Economies</h3>
              <p><b>Ag (Agricultural):</b> Bountiful environments. Specialize in farming and mass food production.</p>
              <p><b>In (Industrial):</b> Densely populated worlds focused on heavy manufacturing and machinery.</p>
              <p><b>Na (Non-Agricultural):</b> Worlds where farming on a large scale is impossible; must import food.</p>
              <p><b>Ni (Non-Industrial):</b> Developing or sparsely populated worlds lacking heavy industry.</p>
              <p><b>Ri (Rich):</b> Prosperous worlds with high living standards. Great for luxury goods.</p>
              <p><b>Po (Poor):</b> Disadvantaged worlds struggling to survive; only afford cheap essentials.</p>

              <h3 style={{ color: '#00ff00', marginTop: '35px', marginBottom: '12px', fontSize: '1.6rem', letterSpacing: '1px' }}>Demographics & Technology</h3>
              <p><b>Hi (High Population):</b> Billions of residents. Huge consumers of raw materials.</p>
              <p><b>Lo (Low Population):</b> Outposts or colonies with less than ten thousand inhabitants.</p>
              <p><b>Ht (High Tech):</b> TL 12+. Required for state-of-the-art cybernetics and weaponry.</p>
              <p><b>Lt (Low Tech):</b> TL 5-. Primitive worlds where basic modern tech is incredibly valuable.</p>
              <p><b>Ba (Barren):</b> Dead worlds with zero population, government, and law.</p>

              <h3 style={{ color: '#00ff00', marginTop: '35px', marginBottom: '12px', fontSize: '1.6rem', letterSpacing: '1px' }}>Biospheres & Geography</h3>
              <p><b>As (Asteroid):</b> Zero-G mining belts. Excellent for ore/gem extraction, require survival imports.</p>
              <p><b>De (Desert):</b> Worlds completely lacking surface water. Water and wood command massive premiums.</p>
              <p><b>Fl (Fluid Oceans):</b> Worlds with exotic, non-water oceans (e.g., methane). Good for petrochemicals.</p>
              <p><b>Ga (Garden):</b> Near-perfect Earth-like worlds, highly valued for biological exports.</p>
              <p><b>Ic (Ice-Capped):</b> Frozen planets locked in eternal winter with frozen oceans.</p>
              <p><b>Wa (Water World):</b> Planets composed almost entirely of deep oceans with no landmasses.</p>
              <p><b>Va (Vacuum):</b> Worlds completely devoid of any atmosphere. Requires domes/bunkers.</p>

              <h3 style={{ color: '#ff5555', marginTop: '35px', marginBottom: '12px', fontSize: '1.6rem', letterSpacing: '1px' }}>Travel Advisories (TAS Zones)</h3>
              <p><b>Amber (Amber Zone):</b> Dangerous worlds (weather, war, or laws). Trade is risky but lucrative.</p>
              <p><b>Red (Red Zone):</b> Interdicted worlds. Travel is illegal; trade here is high-risk smuggling.</p>
            </div>
          </div>
        </div>
      )}

      {/* MAP LEGEND MODAL */}
      {showMapLegend && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="panel" style={{ maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid var(--color-phosphor)', background: '#050000', padding: '35px', boxShadow: '0 0 20px rgba(0,255,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid var(--color-phosphor)', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, color: 'var(--color-phosphor)', fontSize: '2.2rem', letterSpacing: '2px' }}>MAP LEGEND</h2>
              <button 
                onClick={() => setShowMapLegend(false)} 
                style={{ padding: '8px 20px', borderColor: 'var(--color-phosphor)', background: 'transparent', color: 'var(--color-phosphor)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}>
                CLOSE
              </button>
            </div>
            
            <div style={{ fontSize: '1.4rem', color: 'var(--color-phosphor-dim)', lineHeight: '1.8' }}>
              <h3 style={{ color: '#00ff00', marginTop: '15px', marginBottom: '12px', fontSize: '1.6rem', letterSpacing: '1px' }}>Starport Class (Center Letter)</h3>
              <p><b style={{ color: '#fff' }}>A – Excellent:</b> Highest quality facility. Refined fuel, annual maintenance overhauls, shipyard capable of constructing jump-capable starships.</p>
              <p><b style={{ color: '#fff' }}>B – Good:</b> High-quality facilities. Refined fuel, annual maintenance overhauls. Shipyard can only construct non-starships.</p>
              <p><b style={{ color: '#fff' }}>C – Routine:</b> Average facilities. Unrefined fuel only, shipyard capable of minor repairs.</p>
              <p><b style={{ color: '#fff' }}>D – Poor:</b> Very basic facilities. Unrefined fuel only, no repair facilities.</p>
              <p><b style={{ color: '#fff' }}>E – Frontier:</b> Bare-bones installation. Essentially just a cleared spot of bedrock. No fuel, no facilities, no repairs.</p>
              <p><b style={{ color: '#fff' }}>X – None:</b> No starport exists here. These are often completely unsettled systems or dangerous interdicted zones.</p>

              <h3 style={{ color: '#00ff00', marginTop: '35px', marginBottom: '12px', fontSize: '1.6rem', letterSpacing: '1px' }}>Hex Background Colors</h3>
              <p><b style={{ color: '#ff5555' }}>Red Zone:</b> Hexes tinted strongly red indicate a Red Travel Zone. Travel here is interdicted by the Imperium or highly dangerous.</p>
              <p><b style={{ color: '#dca3ff' }}>Amber Zone:</b> Hexes tinted a murky yellow/amber indicate an Amber Travel Zone. Travel is permitted but extreme caution is advised due to war, weather, or harsh laws.</p>
              <p><b style={{ color: 'var(--color-phosphor)' }}>Standard (Dim Green):</b> Unrestricted systems safe for standard travel operations.</p>
            </div>
          </div>
        </div>
      )}

      {/* HEX HOVER TOOLTIP */}
      {hoveredHex && !editSys && (
        <div style={{
          position: 'fixed',
          top: hoveredHex.y + 15,
          left: hoveredHex.x + 15,
          background: 'rgba(0, 20, 0, 0.95)',
          border: '1px solid var(--color-phosphor)',
          padding: '15px',
          zIndex: 10000,
          pointerEvents: 'none',
          boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
          maxWidth: '300px'
        }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: 'var(--color-phosphor)' }}>{hoveredHex.sys.name} <span style={{ color: '#fff' }}>[{hoveredHex.sys.hex}]</span></h4>
          <div style={{ fontSize: '1.2rem', letterSpacing: '1px', background: '#333', color: '#fff', display: 'inline-block', padding: '2px 8px', marginBottom: '10px' }}>{hoveredHex.sys.uwp}</div>
          
          <div style={{ fontSize: '0.95rem', color: 'var(--color-phosphor-dim)', lineHeight: '1.4' }}>
             Starport: <b style={{ color: 'var(--color-phosphor)' }}>Class {hoveredHex.sys.starport}</b><br/>
             Trade: <b style={{ color: '#00ff00' }}>{hoveredHex.sys.tradeCodes.length > 0 ? hoveredHex.sys.tradeCodes.join(' ') : 'None'}</b><br/>
             Bases: <b style={{ color: '#ffd700' }}>{hoveredHex.sys.bases && hoveredHex.sys.bases.length > 0 ? hoveredHex.sys.bases.join(', ') : 'None'}</b><br/>
             Gas Giant: <b style={{ color: 'var(--color-phosphor)' }}>{hoveredHex.sys.hasGasGiant ? 'Present' : 'None'}</b>
             {hoveredHex.sys.lore && (
                 <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#aaaaaa', fontStyle: 'italic', lineHeight: '1.2', borderTop: '1px dashed var(--color-phosphor-dim)', paddingTop: '10px', whiteSpace: 'pre-wrap' }}>
                     {hoveredHex.sys.lore}
                 </div>
             )}
          </div>
        </div>
      )}

      {/* SYSTEM EDITOR MODAL */}
      {editSys && (
         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#050000', border: '1px solid var(--color-phosphor)', width: '600px', maxWidth: '90%', padding: '20px', color: 'var(--color-phosphor)' }}>
               <h3 style={{ borderBottom: '1px solid var(--color-phosphor)', paddingBottom: '10px', marginTop: 0 }}>EDIT SYSTEM: {editSys.hex}</h3>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Name</label>
                      <input type="text" value={editSys.name} onChange={(e) => handleStatChange('name', e.target.value)} style={{ width: '100%', background: '#000', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor)', padding: '5px' }} />
                  </div>
                  <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Starport</label>
                      <select value={editSys.starport} onChange={(e) => handleStatChange('starport', e.target.value)} style={{ width: '100%', background: '#000', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor)', padding: '5px' }}>
                          {['A','B','C','D','E','X'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: '15px' }}>
                   {['size', 'atmosphere', 'hydrographics', 'population', 'government', 'lawLevel', 'techLevel'].map((stat) => (
                      <div key={stat}>
                          <label style={{ display: 'block', fontSize: '0.8rem', textTransform: 'capitalize' }}>{stat}</label>
                          <input type="number" min="0" value={(editSys as any)[stat]} onChange={(e) => handleStatChange(stat as keyof WorldData, Number(e.target.value))} style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid var(--color-phosphor-dim)', padding: '5px' }} />
                      </div>
                   ))}
               </div>

               <div style={{ marginTop: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', gap: '5px', alignItems: 'center', cursor: 'pointer' }}>
                        <input type="checkbox" checked={editSys.hasGasGiant || false} onChange={(e) => handleStatChange('hasGasGiant', e.target.checked)} />
                        Gas Giant
                    </label>
                    <label style={{ display: 'flex', gap: '5px', alignItems: 'center', cursor: 'pointer' }}>
                        <input type="checkbox" checked={editSys.bases?.includes('Naval') || false} onChange={(e) => {
                             const bases = new Set(editSys.bases || []);
                             e.target.checked ? bases.add('Naval') : bases.delete('Naval');
                             handleStatChange('bases', Array.from(bases));
                        }} />
                        Naval Base
                    </label>
                    <label style={{ display: 'flex', gap: '5px', alignItems: 'center', cursor: 'pointer' }}>
                        <input type="checkbox" checked={editSys.bases?.includes('Scout') || false} onChange={(e) => {
                             const bases = new Set(editSys.bases || []);
                             e.target.checked ? bases.add('Scout') : bases.delete('Scout');
                             handleStatChange('bases', Array.from(bases));
                        }} />
                        Scout Base
                    </label>
               </div>

               <div style={{ marginTop: '15px' }}>
                   <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>System Lore</label>
                   <textarea 
                      value={editSys.lore || ''} 
                      onChange={(e) => handleStatChange('lore', e.target.value)}
                      style={{ width: '100%', height: '200px', background: '#000', color: 'var(--color-phosphor-dim)', border: '1px solid var(--color-phosphor)', padding: '5px', fontStyle: 'italic', fontFamily: 'inherit', resize: 'vertical' }}
                   />
               </div>

               <div style={{ marginTop: '20px', background: '#333', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                       <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>{editSys.uwp}</span>
                       <div style={{ fontSize: '0.9rem', color: '#00ff00', marginTop: '5px' }}>{editSys.tradeCodes.join(' ')}</div>
                   </div>
               </div>

               <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                   <button onClick={() => setEditSys(null)} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--color-phosphor-dim)', color: 'var(--color-phosphor-dim)', cursor: 'pointer' }}>CANCEL</button>
                   <button onClick={saveEditedSystem} style={{ padding: '8px 20px', background: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor)', color: '#000', cursor: 'pointer', fontWeight: 'bold' }}>APPLY OVERRIDES</button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};
