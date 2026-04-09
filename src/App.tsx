import { useState, useEffect } from 'react';
import './index.css';
import { ShipStatus } from './ShipStatus';
import { useShipData } from './useShipData';
import { PassengerBroker } from './PassengerBroker';
import { FreightBroker } from './FreightBroker';

const getLanIp = () => {
  try {
    // @ts-ignore
    const os = window.require('os');
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          return alias.address;
        }
      }
    }
  } catch(e) {
    if (window.location.hostname !== 'localhost') return window.location.hostname;
  }
  return '192.168.1.67'; // Fallback approximation if environment strictly restricts network query
}

function App() {
  const [showInvite, setShowInvite] = useState(false);
  const lanIp = getLanIp();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'passengers' | 'freight' | 'starmap'>('dashboard');
  const { shipData, updateShipData, isOnline } = useShipData();
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
      const handleMapUrl = (event: any, url: string) => {
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
          <h2>SYS.NAV <span style={{fontSize: '0.8rem', color: isOnline ? '#00ff00' : '#ff5555', verticalAlign: 'middle', marginLeft: '10px'}}>{isOnline ? '● SYNC' : '○ LOCAL'}</span></h2>
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

          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => setShowInvite(!showInvite)} 
              style={{
                width: '100%', 
                borderColor: 'var(--color-phosphor)', 
                background: showInvite ? 'var(--color-phosphor)' : 'transparent', 
                color: showInvite ? '#000' : 'var(--color-phosphor)'
              }}
            >
              [ SHARE SESSION ]
            </button>
            {showInvite && (
              <div style={{marginTop: '10px', textAlign: 'center', background: 'rgba(0,0,0,0.5)', padding: '10px', border: '1px solid var(--color-phosphor)'}}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=http://${lanIp}:5173`} alt="QR Code" style={{width: '120px', height: '120px', display: 'block', margin: '0 auto', background: 'white', padding: '5px'}} />
                <p style={{marginTop: '10px', fontSize: '0.8rem', wordBreak: 'break-all', userSelect: 'all'}}>http://{lanIp}:5173</p>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: 'auto', borderTop: '1px dashed var(--color-phosphor-dim)', paddingTop: '10px' }}>
            <p>v1.0.0_STABLE</p>
            <p>UFP_TERMINAL_01</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          <h1>TRAVELER // COMMERCE</h1>
          <hr style={{ borderColor: 'var(--color-phosphor-dim)', marginBottom: '20px' }} />
          
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

          {activeTab === 'starmap' && (
            <div className="panel" data-title="[ ASTROGATION DATA LINK ]" style={{ height: 'calc(100vh - 120px)', padding: '5px' }}>
              <iframe 
                src={mapUrl} 
                style={{ width: '100%', height: '100%', border: 'none' }} 
                title="Traveller Astrogation Map"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
