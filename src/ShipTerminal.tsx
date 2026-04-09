import { useState, useEffect } from 'react';
import './index.css';
import { ShipStatus } from './ShipStatus';
import { useShipData } from './useShipData';
import { PassengerBroker } from './PassengerBroker';
import { FreightBroker } from './FreightBroker';
import { supabase } from './supabaseClient';

export function ShipTerminal({ shipId, onExit }: { shipId: string, onExit: () => void }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'passengers' | 'freight' | 'starmap' | 'sysman'>('dashboard');
  const [sysmanView, setSysmanView] = useState<'menu' | 'roster' | 'ship'>('menu');
  const { shipData, updateShipData, isOnline } = useShipData(shipId);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'default');
  const [mapUrl, setMapUrl] = useState(() => localStorage.getItem('astrogationMapUrl') || 'https://travellermap.com/?forceui=1');

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
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-phosphor-dim)' }}>ACCOUNT BALANCE</p>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
              <span style={{ fontSize: '1.4rem', marginRight: '5px' }}>Cr</span>
              <input 
                type="number" 
                value={shipData.credits} 
                onChange={e => updateShipData({ credits: parseInt(e.target.value) || 0 })}
                style={{ fontSize: '1.4rem', width: '100%', background: 'transparent', border: 'none', color: 'var(--color-phosphor)', borderBottom: '1px dashed var(--color-phosphor-dim)', padding: 0 }} 
              />
            </div>
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
          
          {activeTab === 'sysman' && (
            <div className="panel" data-title="[ SYSTEM MANAGER ]">
              {sysmanView === 'menu' && (
                <>
                  <p>Welcome to the System Management Console.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                    <button style={{ padding: '20px', fontSize: '1.2rem', borderColor: 'var(--color-phosphor-dim)' }} onClick={() => setSysmanView('roster')}>
                      SYSTEM ROSTER
                      <br/><span style={{fontSize: '0.8rem', color: 'var(--color-phosphor-dim)'}}>Manage personnel & payroll</span>
                    </button>
                    <button style={{ padding: '20px', fontSize: '1.2rem', borderColor: 'var(--color-phosphor-dim)' }} onClick={() => alert('Ship Manager Module: Under Construction')}>
                      SHIP MANAGER
                      <br/><span style={{fontSize: '0.8rem', color: 'var(--color-phosphor-dim)'}}>Configure ship specs</span>
                    </button>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <button 
                      onClick={async () => {
                        if (window.confirm("CRITICAL WARNING: This will permanently delete the ship manifest, crew data, and clear all cargo records. This action CANNOT be undone. Are you sure you wish to decommission this vessel?")) {
                          await supabase.from('ship_state').delete().eq('id', shipId);
                          onExit();
                        }
                      }} 
                      style={{ width: '100%', padding: '20px', fontSize: '1.2rem', borderColor: '#ff5555', color: '#ff5555' }}
                    >
                      ⚠️ [ DECOMMISSION SHIP / DELETE CREW ]
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
                          <th>Name</th><th>Role</th><th>Type</th><th>Salary</th><th>Shares</th><th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(shipData.crewRoster || []).map(crew => (
                          <tr key={crew.id} style={{ borderBottom: '1px dashed var(--color-phosphor-dim)' }}>
                            <td><input type="text" value={crew.name} onChange={e => {
                               const arr = (shipData.crewRoster || []).map(c => c.id === crew.id ? { ...c, name: e.target.value } : c);
                               updateShipData({ crewRoster: arr });
                            }} style={{ width: '100px' }} /></td>
                            <td><input type="text" value={crew.roles} onChange={e => {
                               const arr = (shipData.crewRoster || []).map(c => c.id === crew.id ? { ...c, roles: e.target.value } : c);
                               updateShipData({ crewRoster: arr });
                            }} style={{ width: '120px' }} /></td>
                            <td>
                              <select value={crew.type} onChange={e => {
                                const arr = (shipData.crewRoster || []).map(c => c.id === crew.id ? { ...c, type: e.target.value as 'Player'|'NPC' } : c);
                                updateShipData({ crewRoster: arr });
                              }}>
                                <option value="Player">Player</option><option value="NPC">NPC</option>
                              </select>
                            </td>
                            <td>Cr <input type="number" value={crew.salary} onChange={e => {
                               const arr = (shipData.crewRoster || []).map(c => c.id === crew.id ? { ...c, salary: parseInt(e.target.value)||0 } : c);
                               updateShipData({ crewRoster: arr });
                            }} style={{ width: '80px' }} /></td>
                            <td><input type="number" step="0.1" value={crew.payrollShare} onChange={e => {
                               const arr = (shipData.crewRoster || []).map(c => c.id === crew.id ? { ...c, payrollShare: parseFloat(e.target.value)||0 } : c);
                               updateShipData({ crewRoster: arr });
                            }} style={{ width: '60px' }} /></td>
                            <td>
                              <button onClick={() => updateShipData({ crewRoster: (shipData.crewRoster || []).filter(c => c.id !== crew.id) })} style={{ color: '#ff5555', borderColor: '#ff5555', padding: '2px 5px', marginTop: '5px' }}>X</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button style={{ marginTop: '15px', width: '100%', padding: '10px' }} onClick={() => {
                       updateShipData({ 
                         crewRoster: [...(shipData.crewRoster || []), { id: Math.random().toString(), name: 'New Crew', roles: 'Crew', type: 'NPC', salary: 0, payrollShare: 1 }] 
                       });
                    }}>+ ADD CREW ENTITY</button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              <div className="panel" data-title="[ SYSTEM DIAGNOSTICS ]">
                <p>Welcome to the Traveler Trade Terminal.</p>
                <p>Select a module from the SYS.NAV menu to begin calculating commerce.</p>
              </div>
              <ShipStatus data={shipData} updateData={updateShipData} />
            </>
          )}

          {activeTab === 'passengers' && (
            <>
              <PassengerBroker shipData={shipData} updateShipData={updateShipData} />
              <ShipStatus data={shipData} updateData={updateShipData} />
            </>
          )}

          {activeTab === 'freight' && (
            <>
              <FreightBroker shipData={shipData} updateShipData={updateShipData} />
              <ShipStatus data={shipData} updateData={updateShipData} />
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

