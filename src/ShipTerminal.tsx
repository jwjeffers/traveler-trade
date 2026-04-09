import { useState, useEffect } from 'react';
import './index.css';
import { ShipStatus } from './ShipStatus';
import { useShipData } from './useShipData';
import { PassengerBroker } from './PassengerBroker';
import { FreightBroker } from './FreightBroker';
import { supabase } from './supabaseClient';

export function ShipTerminal({ shipId, onExit }: { shipId: string, onExit: () => void }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'passengers' | 'freight' | 'starmap' | 'sysman'>('dashboard');
  const [sysmanView, setSysmanView] = useState<'menu' | 'roster' | 'ship' | 'ledger'>('menu');
  const [modalConfig, setModalConfig] = useState<{ title: string, message: string, type: 'alert' | 'confirm' | 'prompt' | 'ledger-edit' | 'media', onConfirm?: () => void, promptDefault?: string, onPromptSubmit?: (val: string) => void, onLedgerEditSubmit?: (desc: string, amt: number) => void, iframeUrl?: string } | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [promptAmount, setPromptAmount] = useState('');
  const { shipData: companyData, updateShipData: updateCompanyData, isOnline } = useShipData(shipId);
  
  const [activeSubShipId, setActiveSubShipId] = useState<string>('');
  const activeShip = companyData?.ships?.find(s => s.id === activeSubShipId) || companyData?.ships?.[0];

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'default');
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

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

  return (
    <div className="crt crt-flicker">
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

          <button onClick={() => setActiveTab('dashboard')}>
            {activeTab === 'dashboard' ? '> Ship Status' : 'Ship Status'}
          </button>
          <button onClick={() => setActiveTab('passengers')}>
            {activeTab === 'passengers' ? '> Passengers' : 'Passengers'}
          </button>
          <button onClick={() => setActiveTab('freight')}>
            {activeTab === 'freight' ? '> Cargo Broker' : 'Cargo Broker'}
          </button>
          <button onClick={() => setActiveTab('starmap')}>
            {activeTab === 'starmap' ? '> Astrogation Map' : 'Astrogation Map'}
          </button>
          <button onClick={() => setActiveTab('sysman')}>
            {activeTab === 'sysman' ? '> System Manager' : 'System Manager'}
          </button>

          <div style={{ marginTop: '20px', padding: '10px', border: '1px solid var(--color-phosphor)', background: 'rgba(0,0,0,0.5)' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-phosphor-dim)' }}>{activeShip ? activeShip.shipName.toUpperCase() : 'UNKNOWN'} BALANCE</p>
            <p style={{ margin: 0, fontSize: '1.2rem' }}>Cr {activeShip ? activeShip.credits.toLocaleString() : 0}</p>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: 'var(--color-phosphor-dim)' }}>TERMINAL THEME</label>
            <select value={theme} onChange={e => setTheme(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
              <option value="default">Default (Green)</option>
              <option value="yellow">Neon Yellow</option>
              <option value="magenta">Magenta</option>
              <option value="cyan">Cyan</option>
              <option value="red">Red</option>
              <option value="blue">Blue</option>
              <option value="rainbow">Rainbow</option>
            </select>
          </div>


          
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
                              <button onClick={() => updateCompanyData({ crewRoster: (companyData.crewRoster || []).filter(c => c.id !== crew.id) })} style={{ color: '#ff5555', borderColor: '#ff5555', padding: '2px 5px', marginTop: '5px' }}>X</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button style={{ marginTop: '15px', width: '100%', padding: '10px' }} onClick={() => {
                       updateCompanyData({ 
                         crewRoster: [...(companyData?.crewRoster || []), { id: Math.random().toString(), name: 'New Crew', roles: 'Crew', type: 'NPC', salary: 0, payrollShare: 1 }] 
                       });
                    }}>+ ADD CREW ENTITY</button>
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
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-phosphor)' }}>
                          <th>Date / Time</th><th>Type</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th><th></th>
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
                                <td style={{ padding: '8px 0', color: 'var(--color-phosphor-dim)', fontSize: '0.8rem' }}>
                                  {date.toLocaleDateString()} {date.toLocaleTimeString()}
                                </td>
                                <td>{l.type}</td>
                                <td>{l.description}</td>
                                <td style={{ textAlign: 'right', color: l.type === 'Income' || l.amount > 0 ? '#00ff00' : '#ff5555' }}>
                                  {l.amount > 0 ? '+' : ''}{l.amount.toLocaleString()} Cr
                                </td>
                                <td style={{ textAlign: 'right' }}>
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
                                  }} style={{ padding: '2px 5px', fontSize: '0.7rem', marginRight: '5px' }}>EDIT</button>
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
                                  }} style={{ padding: '2px 5px', fontSize: '0.7rem', borderColor: '#ff5555', color: '#ff5555' }}>DEL</button>
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

          {activeTab === 'dashboard' && activeShip && (
            <>
              <div className="panel" data-title="[ SYSTEM DIAGNOSTICS ]">
                <p>Company Systems Online. Terminal bridged to: {activeShip.shipName}</p>
                <p>Select a module from the SYS.NAV menu to begin calculating commerce.</p>
              </div>
              <ShipStatus data={activeShip} updateData={updateActiveShip} />
            </>
          )}

          {activeTab === 'passengers' && activeShip && (
            <>
              <PassengerBroker shipData={activeShip} updateShipData={updateActiveShip} />
              <ShipStatus data={activeShip} updateData={updateActiveShip} />
            </>
          )}

          {activeTab === 'freight' && activeShip && (
            <>
              <FreightBroker shipData={activeShip} updateShipData={updateActiveShip} />
              <ShipStatus data={activeShip} updateData={updateActiveShip} />
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
        </div>
      </div>
    </div>
  );
}

