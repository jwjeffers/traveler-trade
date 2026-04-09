import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { defaultShipData, type ShipData } from './ShipStatus';

interface CrewEntry {
  id: string;
  name: string;
}

export function Lobby({ onJoin }: { onJoin: (id: string) => void }) {
  const [crews, setCrews] = useState<CrewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Registration State
  const [showRegister, setShowRegister] = useState(false);
  const [newCrewName, setNewCrewName] = useState('');
  const [newPasscode, setNewPasscode] = useState('');

  // Joining State
  const [joinTarget, setJoinTarget] = useState<string | null>(null);
  const [joinPasscode, setJoinPasscode] = useState('');
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    fetchCrews();
  }, []);

  const fetchCrews = async () => {
    setLoading(true);
    const { data } = await supabase.from('ship_state').select('id, data');
    if (data) {
      const parsed = data.map(row => ({
        id: row.id,
        name: (row.data as ShipData).shipName || row.id
      }));
      setCrews(parsed);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!newCrewName || !newPasscode) return;
    
    // Generate simple ID slug
    const shipId = newCrewName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
    
    const startingData: ShipData = {
      ...defaultShipData,
      shipName: newCrewName,
      passcode: newPasscode
    };

    const { error } = await supabase.from('ship_state').insert({ id: shipId, data: startingData });
    if (!error) {
      onJoin(shipId);
    } else {
      alert("Registration Error: " + error.message);
    }
  };

  const handleTryJoin = async () => {
    if (!joinTarget) return;
    setJoinError('');

    const { data: row } = await supabase.from('ship_state').select('data').eq('id', joinTarget).single();
    if (row && row.data) {
      const shipPass = (row.data as ShipData).passcode;
      // If there is no passcode or it matches
      if (!shipPass || shipPass === joinPasscode) {
        onJoin(joinTarget);
      } else {
        setJoinError('INVALID PASSCODE.');
      }
    } else {
      setJoinError('SERVER NOT FOUND.');
    }
  };

  return (
    <div className="crt crt-flicker" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', padding: '20px' }}>
      
      <h1 style={{ fontSize: '3rem', margin: 0, textShadow: '0 0 10px var(--color-phosphor)', textAlign: 'center' }}>
        UFP GLOBAL COMMERCE NETWORK
      </h1>
      <p style={{ color: 'var(--color-phosphor-dim)', marginBottom: '40px' }}>SECURE CREW LINK ESTABLISHED</p>

      {showRegister ? (
        <div className="panel" style={{ width: '400px' }}>
          <h2 style={{ borderBottom: '1px solid var(--color-phosphor)', paddingBottom: '10px' }}>REGISTER NEW CREW</h2>
          
          <label style={{ display: 'block', marginTop: '15px' }}>Ship Name</label>
          <input 
            type="text" 
            value={newCrewName}
            onChange={e => setNewCrewName(e.target.value)}
            style={{ width: '100%', background: 'black', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor)', padding: '5px' }} 
          />

          <label style={{ display: 'block', marginTop: '15px' }}>Terminal Passcode</label>
          <input 
            type="password" 
            value={newPasscode}
            onChange={e => setNewPasscode(e.target.value)}
            style={{ width: '100%', background: 'black', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor)', padding: '5px' }} 
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={handleRegister} style={{ flex: 1 }}>INITIALIZE</button>
            <button onClick={() => setShowRegister(false)} style={{ flex: 1, borderColor: '#ff5555', color: '#ff5555' }}>CANCEL</button>
          </div>
        </div>
      ) : joinTarget ? (
        <div className="panel" style={{ width: '400px', textAlign: 'center' }}>
           <h3>CONNECTING TO:</h3>
           <p style={{ fontSize: '1.5rem', marginBottom: '20px' }}>{crews.find(c => c.id === joinTarget)?.name}</p>
           
           <input 
            type="password" 
            placeholder="ENTER PASSCODE"
            value={joinPasscode}
            onChange={e => setJoinPasscode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTryJoin()}
            style={{ width: '100%', background: 'black', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor)', padding: '10px', textAlign: 'center', fontSize: '1.2rem' }} 
          />
          {joinError && <p style={{ color: '#ff5555', marginTop: '10px' }}>{joinError}</p>}
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={handleTryJoin} style={{ flex: 1 }}>AUTHORIZE</button>
            <button onClick={() => { setJoinTarget(null); setJoinError(''); setJoinPasscode(''); }} style={{ flex: 1, borderColor: '#ff5555', color: '#ff5555' }}>ABORT</button>
          </div>
        </div>
      ) : (
        <div className="panel" style={{ width: '600px', maxHeight: '50vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-phosphor)', paddingBottom: '10px', marginBottom: '10px' }}>
            <h2 style={{ margin: 0 }}>ACTIVE TERMINALS</h2>
            <button onClick={() => setShowRegister(true)} style={{ padding: '5px 15px' }}>+ REGISTER CREW</button>
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
            {loading ? <p>SCANNING NETWORK...</p> : crews.length === 0 ? <p>NO ACTIVE TERMINALS FOUND.</p> : (
              crews.map(crew => (
                <div key={crew.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px dashed var(--color-phosphor-dim)' }}>
                  <span style={{ fontSize: '1.2rem' }}>{crew.name}</span>
                  <button onClick={() => setJoinTarget(crew.id)} style={{ padding: '5px 15px' }}>CONNECT</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
