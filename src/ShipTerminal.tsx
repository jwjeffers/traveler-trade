import { useState, useEffect } from 'react';
import './index.css';
import { ShipStatus } from './ShipStatus';
import { useShipData } from './useShipData';
import { PassengerBroker } from './PassengerBroker';
import { FreightBroker } from './FreightBroker';
import { SpeculativeTrade } from './SpeculativeTrade';
import { InventoryManager } from './InventoryManager';
import { CharacterSheet } from './CharacterSheet';
import { CharacterGenerator } from './CharacterGenerator';
import { audioService } from './audioService';
import { supabase } from './supabaseClient';
import { WorldBuilder } from './WorldBuilder';
import { PatronGenerator } from './PatronGenerator';

export function ShipTerminal({ shipId, onExit }: { shipId: string, onExit: () => void }) {
  const [activeTab, setActiveTab] = useState<'characters' | 'dashboard' | 'passengers' | 'freight' | 'speculative' | 'inventory' | 'starmap' | 'sysman' | 'settings' | 'worldbuilder' | 'patrongen'>('dashboard');
  const [showCharGen, setShowCharGen] = useState(false);
  const [activeCharacterId, setActiveCharacterId] = useState<string>('');
  const [sysmanView, setSysmanView] = useState<'menu' | 'roster' | 'ship' | 'ledger'>('menu');
  const [modalConfig, setModalConfig] = useState<{ title: string, message: string, type: 'alert' | 'confirm' | 'prompt' | 'ledger-edit' | 'media', onConfirm?: () => void, promptDefault?: string, onPromptSubmit?: (val: string) => void, onLedgerEditSubmit?: (desc: string, amt: number) => void, iframeUrl?: string } | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [promptAmount, setPromptAmount] = useState('');
  const { shipData: companyData, updateShipData: updateCompanyData, isOnline } = useShipData(shipId);
  
  const [activeSubShipId, setActiveSubShipId] = useState<string>('');
  const activeShip = companyData?.ships?.find(s => s.id === activeSubShipId) || companyData?.ships?.[0];

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'default');
  const [refereeView, setRefereeView] = useState(() => localStorage.getItem('refereeView') === 'true');
  const [mapUrl, setMapUrl] = useState(() => localStorage.getItem('astrogationMapUrl') || 'https://travellermap.com/?forceui=1');

  const [ledgerShipId, setLedgerShipId] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<string>('');
  const [manualDesc, setManualDesc] = useState('');
  const viewingLedgerShipId = ledgerShipId || activeShip?.id;
  const viewingLedgerShip = companyData?.ships?.find(s => s.id === viewingLedgerShipId) || activeShip;

  const updateActiveShip = (updates: any) => {
    if (!activeShip) return;
    const updatedShips = companyData.ships.map(s => s.id === activeShip.id ? { ...s, ...updates } : s);
    updateCompanyData({ ships: updatedShips });
  };

  const handleTransferItem = (
    cat: 'Passenger' | 'Freight' | 'Trade' | 'Misc' | 'Mail',
    item: any,
    sourceShipId: string,
    targetShipId: string,
    isSale: boolean,
    price: number
  ) => {
    if (!companyData || !companyData.ships) return;
    const sourceShip = companyData.ships.find(s => s.id === sourceShipId);
    const targetShip = companyData.ships.find(s => s.id === targetShipId);
    if (!sourceShip || !targetShip) return;

    let sUpdates: any = {};
    let tUpdates: any = {};

    // Remove from source, add to target. And handle space metrics.
    if (cat === 'Passenger') {
      sUpdates.passengers = sourceShip.passengers.filter(p => p.id !== item.id);
      sUpdates.availableStaterooms = sourceShip.availableStaterooms + item.staterooms;
      sUpdates.availableLowBerths = sourceShip.availableLowBerths + item.lowBerths;
      sUpdates.availableCargoTons = sourceShip.availableCargoTons + item.cargo;

      tUpdates.passengers = [...(targetShip.passengers || []), { ...item, id: 'trx-' + Date.now() }];
      tUpdates.availableStaterooms = targetShip.availableStaterooms - item.staterooms;
      tUpdates.availableLowBerths = targetShip.availableLowBerths - item.lowBerths;
      tUpdates.availableCargoTons = targetShip.availableCargoTons - item.cargo;
    } else if (cat === 'Freight') {
      sUpdates.freightLots = sourceShip.freightLots.filter(f => f.id !== item.id);
      sUpdates.availableCargoTons = sourceShip.availableCargoTons + item.tons;

      tUpdates.freightLots = [...(targetShip.freightLots || []), { ...item, id: 'trx-' + Date.now() }];
      tUpdates.availableCargoTons = targetShip.availableCargoTons - item.tons;
    } else if (cat === 'Trade') {
      sUpdates.tradeGoods = (sourceShip.tradeGoods || []).filter(t => t.id !== item.id);
      sUpdates.availableCargoTons = sourceShip.availableCargoTons + item.tons;

      tUpdates.tradeGoods = [...(targetShip.tradeGoods || []), { ...item, id: 'trx-' + Date.now() }];
      tUpdates.availableCargoTons = targetShip.availableCargoTons - item.tons;
    } else if (cat === 'Misc') {
      sUpdates.miscCargo = (sourceShip.miscCargo || []).filter(m => m.id !== item.id);
      sUpdates.availableCargoTons = sourceShip.availableCargoTons + item.tons;

      tUpdates.miscCargo = [...(targetShip.miscCargo || []), { ...item, id: 'trx-' + Date.now() }];
      tUpdates.availableCargoTons = targetShip.availableCargoTons - item.tons;
    } else if (cat === 'Mail') {
      sUpdates.mailContracts = sourceShip.mailContracts.filter(m => m.id !== item.id);
      sUpdates.availableCargoTons = sourceShip.availableCargoTons + item.totalTons;

      tUpdates.mailContracts = [...(targetShip.mailContracts || []), { ...item, id: 'trx-' + Date.now() }];
      tUpdates.availableCargoTons = targetShip.availableCargoTons - item.totalTons;
    }

    if (isSale) {
      // Source sells, gets income. Target buys, gets expense.
      sUpdates.credits = sourceShip.credits + price;
      tUpdates.credits = targetShip.credits - price;

      const itemName = item.type || item.description || item.name || 'Unknown Item';
      const sLedger = { id: 'ledg-' + Date.now() + 'S', timestamp: new Date().toISOString(), type: 'Income', amount: price, description: `Internal Sale to ${targetShip.shipName} (${itemName})` };
      const tLedger = { id: 'ledg-' + Date.now() + 'T', timestamp: new Date().toISOString(), type: 'Expense', amount: price, description: `Internal Purchase from ${sourceShip.shipName} (${itemName})` };

      sUpdates.ledgers = [...(sourceShip.ledgers || []), sLedger];
      tUpdates.ledgers = [...(targetShip.ledgers || []), tLedger];
    }

    const updatedShips = companyData.ships.map(s => {
      if (s.id === sourceShipId) return { ...s, ...sUpdates };
      if (s.id === targetShipId) return { ...s, ...tUpdates };
      return s;
    });

    updateCompanyData({ ships: updatedShips });
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('refereeView', refereeView.toString());
  }, [refereeView]);

  useEffect(() => {
    try {
      // @ts-ignore
      const { ipcRenderer } = window.require('electron');
      const handleMapUrl = (_event: any, url: string) => {
        setMapUrl(url);
        localStorage.setItem('astrogationMapUrl', url);
      };
      
      ipcRenderer.on('save-map-url', handleMapUrl);
      return () => {
        ipcRenderer.removeListener('save-map-url', handleMapUrl);
      };
    } catch (e) {
      console.log('IPC not available (likely running outside electron)');
    }
  }, []);

  const [glitchClass, setGlitchClass] = useState('');
  
  const totalCrits = activeShip?.criticalHits ? Object.values(activeShip.criticalHits).reduce((sum, val) => sum + (val as number), 0) : 0;
  
  useEffect(() => {
    let triggeredClass = '';
    if (totalCrits >= 10) triggeredClass = 'glitch-critical';
    else if (totalCrits >= 5) triggeredClass = 'glitch-major';
    else if (totalCrits > 0) triggeredClass = 'glitch-minor';
    
    setGlitchClass(triggeredClass);
    
    if (triggeredClass) {
      const timer = setTimeout(() => {
        setGlitchClass('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [totalCrits]);

  return (
    <div className={`crt crt-flicker ${glitchClass}`}>
      <div className="app-container">
        {/* Sidebar Navigation */}
        <div className="sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2 style={{ margin: 0 }}>SYS.NAV <span style={{fontSize: '0.8rem', color: isOnline ? '#00ff00' : '#ff5555', verticalAlign: 'middle', marginLeft: '10px'}}>{isOnline ? '● SYNC' : '○ LOCAL'}</span></h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-phosphor-dim)', border: '1px solid var(--color-phosphor-dim)', padding: '2px 5px' }}>357-1105</span>
          </div>
          <button onClick={onExit} style={{color: '#ff5555', borderColor: '#ff5555', marginBottom: '10px'}}>[ POWER DOWN ]</button>
          
          {companyData?.ships?.length > 1 && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-phosphor-dim)' }}>ACTIVE VESSEL:</label>
              <select 
                value={activeShip?.id || ''} 
                onChange={(e) => setActiveSubShipId(e.target.value)}
                style={{ width: '100%', marginTop: '5px', padding: '5px', background: 'var(--color-bg)', color: 'var(--color-phosphor)', borderColor: 'var(--color-phosphor)' }}
              >
                {companyData.ships.map(s => <option key={s.id} value={s.id}>{s.shipName}</option>)}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid var(--color-phosphor)', background: 'rgba(0,0,0,0.5)' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-phosphor-dim)' }}>{activeShip ? activeShip.shipName.toUpperCase() : 'UNKNOWN'} BALANCE</p>
            <p style={{ margin: 0, fontSize: '1.2rem' }}>Cr {activeShip ? activeShip.credits.toLocaleString() : 0}</p>
          </div>

          <button onClick={() => { setActiveTab('characters'); audioService.playClick(); }}>
            {activeTab === 'characters' ? '> Character Sheets' : 'Character Sheets'}
          </button>
          <button onClick={() => { setActiveTab('dashboard'); audioService.playClick(); }}>
            {activeTab === 'dashboard' ? '> Ship Status' : 'Ship Status'}
          </button>
          <button onClick={() => { setActiveTab('passengers'); audioService.playClick(); }}>
            {activeTab === 'passengers' ? '> Passengers' : 'Passengers'}
          </button>
          <button onClick={() => { setActiveTab('freight'); audioService.playClick(); }}>
            {activeTab === 'freight' ? '> Cargo Broker' : 'Cargo Broker'}
          </button>
          <button onClick={() => { setActiveTab('speculative'); audioService.playClick(); }}>
            {activeTab === 'speculative' ? '> Speculative Trade' : 'Speculative Trade'}
          </button>
          <button onClick={() => { setActiveTab('inventory'); audioService.playClick(); }}>
            {activeTab === 'inventory' ? '> Inventory Manager' : 'Inventory Manager'}
          </button>
          <button onClick={() => { setActiveTab('starmap'); audioService.playClick(); }}>
            {activeTab === 'starmap' ? '> Astrogation Map' : 'Astrogation Map'}
          </button>
          <button onClick={() => { setActiveTab('sysman'); audioService.playClick(); }}>
            {activeTab === 'sysman' ? '> System Manager' : 'System Manager'}
          </button>
          <button onClick={() => { setActiveTab('settings'); audioService.playClick(); }}>
            {activeTab === 'settings' ? '> Settings' : 'Settings'}
          </button>
          
          {refereeView && (
            <>
              <button onClick={() => { setActiveTab('worldbuilder'); audioService.playClick(); }} style={{ color: '#ffaaaa', borderColor: '#ffaaaa', marginBottom: '5px' }}>
                {activeTab === 'worldbuilder' ? '> [ Ref ] World Builder' : '[ Ref ] World Builder'}
              </button>
              <button onClick={() => { setActiveTab('patrongen'); audioService.playClick(); }} style={{ color: '#ffaaaa', borderColor: '#ffaaaa' }}>
                {activeTab === 'patrongen' ? '> [ Ref ] Patron Gen' : '[ Ref ] Patron Gen'}
              </button>
            </>
          )}


          
          <div style={{ marginTop: 'auto', borderTop: '1px dashed var(--color-phosphor-dim)', paddingTop: '10px' }}>
            <p>v1.0.0_STABLE</p>
            <p>IMPERIUM_TERMINAL_TR</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          <h1>THIRD IMPERIUM // COMMERCE</h1>
          <hr style={{ borderColor: 'var(--color-phosphor-dim)', marginBottom: '20px' }} />
          
          {modalConfig && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
              <div className="panel" style={{ maxWidth: '500px', border: '1px solid #ff5555', boxShadow: '0 0 20px rgba(255,85,85,0.4)', background: '#050000' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#ff5555' }}>[ {modalConfig.title} ]</h3>
                <p style={{ lineHeight: '1.5', marginBottom: '25px', color: 'var(--color-phosphor)' }}>{modalConfig.message}</p>
                {modalConfig.type === 'prompt' && (
                  <input 
                    type="text" 
                    value={promptValue} 
                    onChange={e => setPromptValue(e.target.value)} 
                    style={{ width: '100%', marginBottom: '20px', padding: '10px', background: 'transparent', border: '1px solid var(--color-phosphor)', color: 'var(--color-phosphor)', fontSize: '1.1rem' }} 
                  />
                )}
                {modalConfig.type === 'ledger-edit' && (
                  <>
                    <input 
                      type="text" 
                      value={promptValue} 
                      onChange={e => setPromptValue(e.target.value)} 
                      placeholder="Description"
                      style={{ width: '100%', marginBottom: '10px', padding: '10px', background: 'transparent', border: '1px solid var(--color-phosphor)', color: 'var(--color-phosphor)', fontSize: '1.1rem' }} 
                    />
                    <input 
                      type="number" 
                      value={promptAmount} 
                      onChange={e => setPromptAmount(e.target.value)} 
                      placeholder="Amount (e.g. -500)"
                      style={{ width: '100%', marginBottom: '20px', padding: '10px', background: 'transparent', border: '1px solid var(--color-phosphor)', color: 'var(--color-phosphor)', fontSize: '1.1rem' }} 
                    />
                  </>
                )}
                {modalConfig.type === 'media' && modalConfig.iframeUrl && (
                  <div style={{ width: '100%', height: '315px', marginBottom: '20px' }}>
                     <iframe width="100%" height="100%" src={modalConfig.iframeUrl} allow="autoplay; encrypted-media" allowFullScreen style={{ border: 'none' }}></iframe>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                  <button style={{ padding: '10px 20px', borderColor: 'var(--color-phosphor-dim)', color: 'var(--color-phosphor)' }} onClick={() => setModalConfig(null)}>
                    {modalConfig.type === 'alert' ? 'ACKNOWLEDGE' : 'CANCEL'}
                  </button>
                  {modalConfig.type === 'confirm' && (
                    <button style={{ padding: '10px 20px', borderColor: '#ff5555', color: '#ff5555', background: 'rgba(255,0,0,0.1)' }} onClick={() => {
                      if (modalConfig.onConfirm) modalConfig.onConfirm();
                      setModalConfig(null);
                    }}>
                      PROCEED
                    </button>
                  )}
                  {modalConfig.type === 'prompt' && (
                    <button style={{ padding: '10px 20px', borderColor: '#00ff00', color: '#00ff00', background: 'rgba(0,255,0,0.1)' }} onClick={() => {
                      if (modalConfig.onPromptSubmit) modalConfig.onPromptSubmit(promptValue);
                      setModalConfig(null);
                    }}>
                      SUBMIT
                    </button>
                  )}
                  {modalConfig.type === 'ledger-edit' && (
                    <button style={{ padding: '10px 20px', borderColor: '#00ff00', color: '#00ff00', background: 'rgba(0,255,0,0.1)' }} onClick={() => {
                      if (modalConfig.onLedgerEditSubmit) modalConfig.onLedgerEditSubmit(promptValue, parseInt(promptAmount) || 0);
                      setModalConfig(null);
                    }}>
                      SAVE EDITS
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sysman' && (
            <div className="panel" data-title="[ SYSTEM MANAGER ]">
              {sysmanView === 'menu' && (
                <>
                  <p>Welcome to the System Management Console.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '20px' }}>
                    <button style={{ padding: '20px', fontSize: '1.2rem', borderColor: 'var(--color-phosphor-dim)' }} onClick={() => setSysmanView('roster')}>
                      SYSTEM ROSTER
                      <br/><span style={{fontSize: '0.8rem', color: 'var(--color-phosphor-dim)'}}>Manage personnel & payroll</span>
                    </button>
                    <button style={{ padding: '20px', fontSize: '1.2rem', borderColor: 'var(--color-phosphor-dim)' }} onClick={() => setSysmanView('ship')}>
                      FLEET ASSETS
                      <br/><span style={{fontSize: '0.8rem', color: 'var(--color-phosphor-dim)'}}>Configure fleet & accounts</span>
                    </button>
                    <button style={{ padding: '20px', fontSize: '1.2rem', borderColor: 'var(--color-phosphor-dim)' }} onClick={() => setSysmanView('ledger')}>
                      ACCOUNT LEDGERS
                      <br/><span style={{fontSize: '0.8rem', color: 'var(--color-phosphor-dim)'}}>Transaction history & journals</span>
                    </button>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <button 
                      onClick={() => setModalConfig({
                        title: 'CRITICAL WARNING',
                        message: 'This will permanently delete the ship manifest, crew data, and clear all cargo records. This action CANNOT be undone. Are you sure you wish to decommission this vessel?',
                        type: 'confirm',
                        onConfirm: async () => {
                          await supabase.from('ship_state').delete().eq('id', shipId);
                          onExit();
                        }
                      })} 
                      style={{ width: '100%', padding: '20px', fontSize: '1.2rem', borderColor: '#ff5555', color: '#ff5555' }}
                    >
                      ⚠️ [ DECOMMISSION SHIP / DELETE CREW ]
                    </button>
                    
                    <button style={{ marginTop: '15px', width: '100%', padding: '15px', borderColor: 'var(--color-phosphor-dim)', color: 'var(--color-phosphor)' }} onClick={() => {
                        const vids = ['HU7tKKxeGNA', '1IGaug2scFw', 'wQHs3dDhnGQ', 'GokgyN9qg08', 'avCPlBhOE9A', 'URXHnbOh_wo', 'IlT7IO3x06w', 'loJjoXdJH3U', '4h3Iz2Ox8Yo', 'YbxAcjE75xA', 'aV5LA10ewW0', 'Tku4xjK4ihM', 'YcJsSrxB3uE', 'nd3P6HydSAk', 'vShcougX1Uw'];
                        const selectedId = vids[Math.floor(Math.random() * vids.length)];
                        setModalConfig({
                          title: 'COMPANY APPROVED MEDIA',
                          message: 'Broadcasting selected archives from local databanks...',
                          type: 'media',
                          iframeUrl: `https://www.youtube.com/embed/${selectedId}?autoplay=1`
                        });
                      }}
                    >
                      COMPANY APPROVED MEDIA
                    </button>

                    <button style={{ marginTop: '15px', width: '100%', padding: '15px', borderColor: '#dca3ff', color: '#dca3ff' }} onClick={() => {
                        setModalConfig({
                          title: "CARYN FINP'S MANAGERIAL INSPIRATION",
                          message: 'Accessing encrypted inspirational records...',
                          type: 'media',
                          iframeUrl: `https://www.youtube.com/embed/HWwWPkWmUu8?autoplay=1`
                        });
                      }}
                    >
                      CARYN FINP'S MANAGERIAL INSPIRATION
                    </button>
                  </div>
                </>
              )}

              {sysmanView === 'roster' && (
                <>
                  <button onClick={() => setSysmanView('menu')} style={{ marginBottom: '20px', borderColor: 'var(--color-phosphor-dim)' }}>&lt; BACK TO MENU</button>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-phosphor)' }}>
                          <th>Name</th><th>Role</th><th>Ship Assignment</th><th>Type</th><th>Salary</th><th>Shares</th><th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(companyData?.crewRoster || []).map(crew => (
                          <tr key={crew.id} style={{ borderBottom: '1px dashed var(--color-phosphor-dim)' }}>
                            <td><input type="text" value={crew.name} onChange={e => {
                               const arr = (companyData.crewRoster || []).map(c => c.id === crew.id ? { ...c, name: e.target.value } : c);
                               updateCompanyData({ crewRoster: arr });
                            }} style={{ width: '100px' }} /></td>
                            <td><input type="text" value={crew.roles} onChange={e => {
                               const arr = (companyData.crewRoster || []).map(c => c.id === crew.id ? { ...c, roles: e.target.value } : c);
                               updateCompanyData({ crewRoster: arr });
                            }} style={{ width: '120px' }} /></td>
                            <td>
                              <select value={crew.assignedShipId || ''} onChange={e => {
                                const arr = (companyData.crewRoster || []).map(c => c.id === crew.id ? { ...c, assignedShipId: e.target.value } : c);
                                updateCompanyData({ crewRoster: arr });
                              }} style={{ width: '120px' }}>
                                <option value="">[ UNASSIGNED ]</option>
                                {(companyData?.ships || []).map(s => <option key={s.id} value={s.id}>{s.shipName}</option>)}
                              </select>
                            </td>
                            <td>
                              <select value={crew.type} onChange={e => {
                                const arr = (companyData.crewRoster || []).map(c => c.id === crew.id ? { ...c, type: e.target.value as 'Player'|'NPC' } : c);
                                updateCompanyData({ crewRoster: arr });
                              }}>
                                <option value="Player">Player</option><option value="NPC">NPC</option>
                              </select>
                            </td>
                            <td>Cr <input type="number" value={crew.salary} onChange={e => {
                               const arr = (companyData.crewRoster || []).map(c => c.id === crew.id ? { ...c, salary: parseInt(e.target.value)||0 } : c);
                               updateCompanyData({ crewRoster: arr });
                            }} style={{ width: '80px' }} /></td>
                            <td><input type="number" step="0.1" value={crew.payrollShare} onChange={e => {
                               const arr = (companyData.crewRoster || []).map(c => c.id === crew.id ? { ...c, payrollShare: parseFloat(e.target.value)||0 } : c);
                               updateCompanyData({ crewRoster: arr });
                            }} style={{ width: '60px' }} /></td>
                            <td>
                              <button onClick={() => {
                                 setModalConfig({
                                   title: 'CONFIRM ROSTER TERMINATION',
                                   message: `Are you sure you wish to terminate the contract for ${crew.name}?`,
                                   type: 'confirm',
                                   onConfirm: () => {
                                      updateCompanyData({ crewRoster: (companyData.crewRoster || []).filter(c => c.id !== crew.id) });
                                   }
                                 });
                              }} style={{ color: '#ff5555', borderColor: '#ff5555', padding: '2px 5px', marginTop: '5px' }}>X</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                      <button style={{ marginTop: '15px', flex: 1, padding: '10px' }} onClick={() => {
                         updateCompanyData({ 
                           crewRoster: [...(companyData?.crewRoster || []), { id: Math.random().toString(), name: 'New Crew', roles: 'Crew', type: 'NPC', salary: 0, payrollShare: 1 }] 
                         });
                      }}>+ ADD CREW ENTITY</button>
                      <button style={{ marginTop: '15px', flex: 1, padding: '10px', borderColor: '#dca3ff', color: '#dca3ff' }} onClick={() => setShowCharGen(true)}>
                         + GENERATE LIFEPATH CHARACTER
                      </button>
                      <button style={{ marginTop: '15px', flex: 1, padding: '10px', borderColor: '#00ff00', color: '#00ff00' }} onClick={() => {
                         setModalConfig({
                           title: 'PAYOUT CREW SHARES',
                           message: `Enter the total profit amount to distribute. This will be deducted from the active ship (${activeShip?.shipName || 'No active ship'}) and paid to Characters based on their designated Payroll Share.`,
                           type: 'prompt',
                           onPromptSubmit: (val) => {
                              const total = parseInt(val);
                              if (isNaN(total) || total <= 0) { alert("Invalid payout amount."); return; }
                              if (!activeShip) { alert("No active ship selected to pull funds from. Select an active vessel first."); return; }
                              
                              const totalShares = (companyData?.crewRoster || []).reduce((acc, c) => acc + (c.payrollShare || 0), 0);
                              if (totalShares <= 0) { alert("No valid shares assigned to crew roster."); return; }
                              
                              const payoutPerShare = total / totalShares;
                              let deductedAmount = 0;
                              
                              const updatedRoster = (companyData?.crewRoster || []).map(c => {
                                 if ((c.payrollShare || 0) > 0) {
                                   const payout = Math.floor(c.payrollShare * payoutPerShare);
                                   deductedAmount += payout;
                                   if (c.type === 'Player') {
                                     const existingData = c.characterData || {
                                        title: '', age: '', species: '', homeworld: '', traits: '',
                                        str: 7, dex: 7, end: 7, int: 7, edu: 7, soc: 7,
                                        skills: [],
                                        equipment: '', weapons: '', armor: '', augments: '', 
                                        trainingSkill: '', trainingWeeks: '', trainingPeriods: '',
                                        wounds: '', careers: '', history: '', allies: '', contacts: '', rivals: '', enemies: '', personalCredits: 0
                                     };
                                     return {
                                       ...c,
                                       characterData: {
                                         ...existingData,
                                         personalCredits: (existingData.personalCredits || 0) + payout
                                       }
                                     };
                                   }
                                 }
                                 return c;
                              });

                              const newLedger = { id: Math.random().toString(), timestamp: new Date().toISOString(), type: 'Expense' as const, amount: -deductedAmount, description: `Crew Share Distribution (Total Pool: ${total})` };
                              
                              const updatedShips = (companyData?.ships || []).map(s => {
                                 if (s.id === activeShip.id) {
                                   return { ...s, credits: s.credits - deductedAmount, ledgers: [...(s.ledgers || []), newLedger] };
                                 }
                                 return s;
                              });

                              updateCompanyData({ crewRoster: updatedRoster, ships: updatedShips });
                           }
                         });
                       }}>[ DISTRIBUTE SHARES ]</button>
                      <button style={{ marginTop: '15px', flex: 1, padding: '10px', borderColor: '#ff5555', color: '#ff5555' }} onClick={() => {
                         setModalConfig({
                           title: 'CRITICAL: PURGE ALL PERSONNEL',
                           message: `Are you absolutely certain you wish to wipe the entire crew roster? This action is irreversible and all Character Sheets and Company Assignments will be permanently deleted.`,
                           type: 'confirm',
                           onConfirm: () => {
                             updateCompanyData({ crewRoster: [] });
                           }
                         });
                      }}>[ PURGE ROSTER ]</button>
                    </div>
                  </div>
                </>
              )}

              {sysmanView === 'ship' && (
                <>
                  <button onClick={() => setSysmanView('menu')} style={{ marginBottom: '20px', borderColor: 'var(--color-phosphor-dim)' }}>&lt; BACK TO MENU</button>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>FLEET ASSETS</h3>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-phosphor-dim)' }}>COMPANY GRAND TOTAL</span><br/>
                      <span style={{ fontSize: '1.2rem', color: '#00ff00' }}>Cr {(companyData?.ships || []).reduce((acc, s) => acc + (s.credits || 0), 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-phosphor)' }}>
                          <th>Ship Name</th><th>Class</th><th>Assigned Crew</th><th>Liquid Credits</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(companyData?.ships || []).map(subShip => {
                          const assignedCount = (companyData?.crewRoster || []).filter(c => c.assignedShipId === subShip.id).length;
                          return (
                            <tr key={subShip.id} style={{ borderBottom: '1px dashed var(--color-phosphor-dim)' }}>
                              <td style={{ padding: '10px 0' }}>{subShip.shipName}</td>
                              <td>{subShip.shipClass}</td>
                              <td>{assignedCount} Personnel</td>
                              <td>Cr {subShip.credits.toLocaleString()}</td>
                              <td>
                                <button onClick={() => {
                                  if (subShip.id === activeShip?.id) {
                                      setActiveSubShipId(subShip.id);
                                      setSysmanView('menu');
                                      setActiveTab('dashboard');
                                  } else {
                                      setActiveSubShipId(subShip.id);
                                  }
                                }} style={{ borderColor: subShip.id === activeSubShipId ? '#00ff00' : 'var(--color-phosphor-dim)', color: subShip.id === activeSubShipId ? '#00ff00' : 'var(--color-phosphor)', padding: '5px 10px' }}>
                                  {subShip.id === activeSubShipId ? '● ACTIVE' : 'SWITCH'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    <button style={{ marginTop: '15px', width: '100%', padding: '10px' }} onClick={() => {
                       const newShip = { 
                         ...activeShip, 
                         id: Math.random().toString(), 
                         shipName: 'New Vessel', 
                         credits: 0,
                         passengers: [],
                         freightLots: [],
                         mailContracts: []
                       };
                       updateCompanyData({ ships: [...(companyData?.ships || []), newShip] });
                    }}>+ COMMISSION NEW SHIP</button>
                  </div>
                </>
              )}

              {sysmanView === 'ledger' && viewingLedgerShip && (
                <>
                  <button onClick={() => setSysmanView('menu')} style={{ marginBottom: '20px', borderColor: 'var(--color-phosphor-dim)' }}>&lt; BACK TO MENU</button>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>ACCOUNT LEDGER</h3>
                    <div>
                      <select 
                        value={viewingLedgerShipId} 
                        onChange={e => setLedgerShipId(e.target.value)}
                        style={{ padding: '5px', background: 'var(--color-bg)', color: 'var(--color-phosphor)', borderColor: 'var(--color-phosphor)' }}
                      >
                        {(companyData?.ships || []).map(s => <option key={s.id} value={s.id}>{s.shipName}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ padding: '10px', border: '1px solid var(--color-phosphor)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.2rem' }}>Liquid Balance:</span>
                    <span style={{ fontSize: '1.5rem', color: '#00ff00' }}>Cr {viewingLedgerShip.credits.toLocaleString()}</span>
                  </div>

                  <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--color-phosphor-dim)', padding: '5px' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '1.2rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-phosphor)' }}>
                          <th style={{ padding: '10px 0' }}>Date / Time</th><th style={{ padding: '10px 0' }}>Type</th><th style={{ padding: '10px 0' }}>Description</th><th style={{ textAlign: 'right', padding: '10px 0' }}>Amount</th><th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!viewingLedgerShip.ledgers || viewingLedgerShip.ledgers.length === 0) ? (
                          <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--color-phosphor-dim)' }}>No transactions found for this account.</td></tr>
                        ) : (
                          viewingLedgerShip.ledgers.slice().reverse().map(l => {
                            const date = new Date(l.timestamp);
                            return (
                              <tr key={l.id} style={{ borderBottom: '1px dashed var(--color-phosphor-dim)' }}>
                                <td style={{ padding: '12px 0', color: 'var(--color-phosphor-dim)', fontSize: '1rem' }}>
                                  {date.toLocaleDateString()} {date.toLocaleTimeString()}
                                </td>
                                <td style={{ padding: '12px 0' }}>{l.type}</td>
                                <td style={{ padding: '12px 0' }}>{l.description}</td>
                                <td style={{ textAlign: 'right', padding: '12px 0', color: l.type === 'Income' || l.amount > 0 ? '#00ff00' : '#ff5555' }}>
                                  {l.amount > 0 ? '+' : ''}{l.amount.toLocaleString()} Cr
                                </td>
                                <td style={{ textAlign: 'right', padding: '12px 0' }}>
                                  <button onClick={() => {
                                     setPromptValue(l.description);
                                     setPromptAmount(l.amount.toString());
                                     setModalConfig({
                                       title: 'EDIT JOURNAL ENTRY',
                                       message: 'Modify the transaction details. Credit will be automatically adjusted.',
                                       type: 'ledger-edit',
                                       onLedgerEditSubmit: (newDesc, newAmount) => {
                                          const amountDiff = newAmount - l.amount;
                                          const updatedType: 'Income' | 'Expense' = newAmount >= 0 ? 'Income' : 'Expense';
                                          const updatedShips = companyData.ships.map(s => {
                                             if (s.id === viewingLedgerShip.id) {
                                                const newLedgers = s.ledgers?.map(entry => entry.id === l.id ? { ...entry, description: newDesc, amount: newAmount, type: updatedType } : entry);
                                                return { ...s, credits: s.credits + amountDiff, ledgers: newLedgers };
                                             }
                                             return s;
                                          });
                                          updateCompanyData({ ships: updatedShips });
                                       }
                                     })
                                  }} style={{ padding: '4px 10px', fontSize: '0.9rem', marginRight: '5px' }}>EDIT</button>
                                  <button onClick={() => {
                                     setModalConfig({
                                       title: 'DELETE TRANSACTION',
                                       message: 'Are you sure you want to delete this Ledger entry? If you do this, the system will reverse the transaction and refund/deduct the value automatically.',
                                       type: 'confirm',
                                       onConfirm: () => {
                                          const updatedShips = companyData.ships.map(s => {
                                             if (s.id === viewingLedgerShip.id) {
                                                return { ...s, credits: s.credits - l.amount, ledgers: s.ledgers?.filter(entry => entry.id !== l.id) };
                                             }
                                             return s;
                                          });
                                          updateCompanyData({ ships: updatedShips });
                                       }
                                     })
                                  }} style={{ padding: '4px 10px', fontSize: '0.9rem', borderColor: '#ff5555', color: '#ff5555' }}>DEL</button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '20px', padding: '15px', border: '1px solid var(--color-phosphor-dim)', background: 'rgba(0,0,0,0.3)' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>Submit Journal Entry</h4>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        placeholder="Amount (e.g. -500 or 1200)" 
                        value={manualAmount}
                        onChange={e => setManualAmount(e.target.value)}
                        style={{ width: '150px' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Transaction Description..." 
                        value={manualDesc}
                        onChange={e => setManualDesc(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button 
                        onClick={() => {
                          const amt = parseInt(manualAmount);
                          if (isNaN(amt) || !manualDesc) { alert('Invalid entry.'); return; }
                          const type: 'Income' | 'Expense' = amt >= 0 ? 'Income' : 'Expense';
                          const newLedger = { id: Math.random().toString(), timestamp: new Date().toISOString(), type, amount: amt, description: manualDesc };
                          
                          const updatedShips = companyData.ships.map(s => {
                            if (s.id === viewingLedgerShip.id) {
                              return { ...s, credits: s.credits + amt, ledgers: [...(s.ledgers || []), newLedger] };
                            }
                            return s;
                          });
                          updateCompanyData({ ships: updatedShips });
                          setManualAmount('');
                          setManualDesc('');
                        }}
                      >LOG ENTRY</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="panel" data-title="[ TERMINAL SETTINGS ]">
              <div style={{ maxWidth: '400px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: 'var(--color-phosphor-dim)' }}>TERMINAL THEME</label>
                <select value={theme} onChange={e => setTheme(e.target.value)} style={{ width: '100%', cursor: 'pointer', padding: '10px', background: 'var(--color-bg)', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor)' }}>
                  <option value="default">Default (Green)</option>
                  <option value="yellow">Neon Yellow</option>
                  <option value="magenta">Magenta</option>
                  <option value="cyan">Cyan</option>
                  <option value="red">Red</option>
                  <option value="blue">Blue</option>
                  <option value="rainbow">Rainbow</option>
                </select>

                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', marginTop: '20px', color: 'var(--color-phosphor-dim)' }}>REFEREE OPTIONS</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="referee-toggle"
                    checked={refereeView} 
                    onChange={e => setRefereeView(e.target.checked)} 
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-phosphor)' }}
                  />
                  <label htmlFor="referee-toggle" style={{ cursor: 'pointer', color: 'var(--color-phosphor)' }}>Enable Referee View</label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'characters' && (
             <>
               <div className="panel" data-title="[ COMPANY PERSONNEL: PLAYER DATA ASSETS ]" style={{ marginBottom: '20px' }}>
                 {(companyData?.crewRoster || []).filter(c => c.type === 'Player').length === 0 ? (
                    <p style={{ color: 'var(--color-phosphor-dim)' }}>No Player characters found in company roster. Use System Manager to initialize personnel records.</p>
                 ) : (
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <label style={{ color: 'var(--color-phosphor-dim)' }}>Select Active Data File:</label>
                      <select 
                        value={activeCharacterId} 
                        onChange={e => setActiveCharacterId(e.target.value)}
                        style={{ padding: '5px', background: 'var(--color-bg)', color: 'var(--color-phosphor)', borderColor: 'var(--color-phosphor)' }}
                      >
                        <option value="">-- Select Character --</option>
                        {(companyData?.crewRoster || []).filter(c => c.type === 'Player').map(c => (
                           <option key={c.id} value={c.id}>{c.name} {c.roles ? `(${c.roles})` : ''}</option>
                        ))}
                      </select>
                    </div>
                 )}
               </div>

               {activeCharacterId && (companyData?.crewRoster || []).find(c => c.id === activeCharacterId) && (
                 <CharacterSheet 
                   crew={(companyData?.crewRoster || []).find(c => c.id === activeCharacterId)!}
                   updateCrew={(updates) => {
                      const updatedRoster = (companyData?.crewRoster || []).map(crew => 
                         crew.id === activeCharacterId ? { ...crew, ...updates } : crew
                      );
                      updateCompanyData({ crewRoster: updatedRoster });
                   }}
                 />
               )}
             </>
          )}

          {activeTab === 'dashboard' && activeShip && (
            <>
              <div className="panel" data-title="[ SYSTEM DIAGNOSTICS ]">
                <p>Company Systems Online. Terminal bridged to: {activeShip.shipName}</p>
                <p>Select a module from the SYS.NAV menu to begin calculating commerce.</p>
              </div>
              <ShipStatus data={activeShip} updateData={updateActiveShip} allShips={companyData?.ships} onTransfer={handleTransferItem} companyRoster={companyData?.crewRoster} />
            </>
          )}

          {activeTab === 'passengers' && activeShip && (
            <>
              <PassengerBroker shipData={activeShip} updateShipData={updateActiveShip} />
              <ShipStatus data={activeShip} updateData={updateActiveShip} allShips={companyData?.ships} onTransfer={handleTransferItem} companyRoster={companyData?.crewRoster} />
            </>
          )}

          {activeTab === 'freight' && activeShip && (
            <>
              <FreightBroker shipData={activeShip} updateShipData={updateActiveShip} />
              <ShipStatus data={activeShip} updateData={updateActiveShip} allShips={companyData?.ships} onTransfer={handleTransferItem} companyRoster={companyData?.crewRoster} />
            </>
          )}

          {activeTab === 'speculative' && activeShip && (
            <>
              <SpeculativeTrade shipData={activeShip} updateShipData={updateActiveShip} />
              <ShipStatus data={activeShip} updateData={updateActiveShip} allShips={companyData?.ships} onTransfer={handleTransferItem} companyRoster={companyData?.crewRoster} />
            </>
          )}

          {activeTab === 'inventory' && activeShip && (
            <>
              <InventoryManager shipData={activeShip} updateShipData={updateActiveShip} />
              <ShipStatus data={activeShip} updateData={updateActiveShip} allShips={companyData?.ships} onTransfer={handleTransferItem} companyRoster={companyData?.crewRoster} />
            </>
          )}

          <div style={{ display: activeTab === 'starmap' ? 'block' : 'none' }}>
            <div className="panel" data-title="[ ASTROGATION DATA LINK ]" style={{ height: 'calc(100vh - 120px)', padding: '5px' }}>
              <iframe 
                src={mapUrl} 
                style={{ width: '100%', height: '100%', border: 'none' }} 
                title="Traveller Astrogation Map"
              />
            </div>
          </div>
          
          {activeTab === 'worldbuilder' && (
            <WorldBuilder />
          )}
          
          {activeTab === 'patrongen' && (
            <PatronGenerator />
          )}

        </div>
      </div>
      {showCharGen && (
        <CharacterGenerator 
          onComplete={(newCrew) => {
            updateCompanyData({ crewRoster: [...(companyData?.crewRoster || []), newCrew] });
            setShowCharGen(false);
          }}
          onCancel={() => setShowCharGen(false)}
        />
      )}
    </div>
  );
}

