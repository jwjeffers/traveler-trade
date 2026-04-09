import { useState } from 'react';
import type { ShipData, Passenger } from './ShipStatus';

interface PassengerManifest {
  high: number;
  middle: number;
  basic: number;
  low: number;
}

export function PassengerBroker({ shipData, updateShipData }: { shipData: ShipData, updateShipData: (u: Partial<ShipData>) => void }) {
  const [manifest, setManifest] = useState<PassengerManifest | null>(null);
  const [modifiers, setModifiers] = useState({
    stewardSkill: 0,
    checkEffect: 0,
    sourcePop: '2-5',
    destPop: '2-5',
    sourceStarport: 'C',
    destStarport: 'C',
    destZone: 'none',
    distance: 1,
    misc: 0
  });

  const calculateTotalDM = (type: 'high' | 'middle' | 'basic' | 'low') => {
    let dm = modifiers.checkEffect + modifiers.stewardSkill + modifiers.misc;
    
    if (type === 'high') dm -= 4;
    if (type === 'low') dm += 1;

    const popDM = (pop: string) => {
      if (pop === '<2') return -4;
      if (pop === '6-7') return 1;
      if (pop === '8+') return 3;
      return 0;
    };
    dm += popDM(modifiers.sourcePop);
    dm += popDM(modifiers.destPop);

    const portDM = (port: string) => {
      if (port === 'A') return 2;
      if (port === 'B') return 1;
      if (port === 'E') return -1;
      if (port === 'X') return -3;
      return 0;
    };
    dm += portDM(modifiers.sourceStarport);
    dm += portDM(modifiers.destStarport);

    if (modifiers.destZone === 'amber') dm += 1;
    if (modifiers.destZone === 'red') dm -= 4;

    if (modifiers.distance > 1) {
      dm -= (modifiers.distance - 1);
    }

    return dm;
  };

  const scanForPassengers = () => {
    const d6d6 = () => Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2;
    // Applying the total DM directly to determine the effective yield.
    const getYield = (dm: number, offset: number) => Math.max(0, d6d6() + dm + offset);

    setManifest({
      high: getYield(calculateTotalDM('high'), -4),
      middle: getYield(calculateTotalDM('middle'), -2),
      basic: getYield(calculateTotalDM('basic'), 2),
      low: getYield(calculateTotalDM('low'), 0)
    });
  };

  const processTicket = (type: keyof PassengerManifest, revenue: number, staterooms: number, lowBerths: number, cargo: number) => {
    if (!manifest || manifest[type] <= 0) return;
    if (shipData.availableStaterooms < staterooms || shipData.availableLowBerths < lowBerths || shipData.availableCargoTons < cargo) {
      alert("Insufficient capacity for this passenger class!");
      return;
    }

    const newPassenger: Passenger = {
      id: crypto.randomUUID(),
      name: '',
      type: type.charAt(0).toUpperCase() + type.slice(1) + ' Passage',
      revenue: revenue,
      staterooms,
      lowBerths,
      cargo
    };

    const newLedger: any = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), type: 'Income', amount: revenue, description: `Sold ${newPassenger.type} Ticket` };

    setManifest({ ...manifest, [type]: manifest[type] - 1 });
    updateShipData({
      credits: shipData.credits + revenue,
      availableStaterooms: shipData.availableStaterooms - staterooms,
      availableLowBerths: shipData.availableLowBerths - lowBerths,
      availableCargoTons: shipData.availableCargoTons - cargo,
      passengers: [...(shipData.passengers || []), newPassenger],
      ledgers: [...(shipData.ledgers || []), newLedger]
    });
  };

  return (
    <div className="panel" data-title="[ PASSENGER BROKER ]">
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid var(--color-phosphor-dim)', background: 'rgba(0,0,0,0.3)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Roll Modifiers (DM) Settings</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', fontSize: '1rem' }}>
          <div>
            <label style={{ display: 'block' }}>Broker/Carouse Effect:</label>
            <input type="number" value={modifiers.checkEffect} onChange={e => setModifiers({...modifiers, checkEffect: parseInt(e.target.value) || 0})} style={{width: '100%'}} />
          </div>
          <div>
            <label style={{ display: 'block' }}>Chief Steward Skill:</label>
            <input type="number" value={modifiers.stewardSkill} onChange={e => setModifiers({...modifiers, stewardSkill: parseInt(e.target.value) || 0})} style={{width: '100%'}} />
          </div>
          
          <div>
            <label style={{ display: 'block' }}>Source Pop:</label>
            <select value={modifiers.sourcePop} onChange={e => setModifiers({...modifiers, sourcePop: e.target.value})} style={{width: '100%'}}>
              <option value="<2">1 or less (DM-4)</option>
              <option value="2-5">2 to 5 (DM 0)</option>
              <option value="6-7">6 to 7 (DM+1)</option>
              <option value="8+">8 or more (DM+3)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block' }}>Dest Pop:</label>
            <select value={modifiers.destPop} onChange={e => setModifiers({...modifiers, destPop: e.target.value})} style={{width: '100%'}}>
              <option value="<2">1 or less (DM-4)</option>
              <option value="2-5">2 to 5 (DM 0)</option>
              <option value="6-7">6 to 7 (DM+1)</option>
              <option value="8+">8 or more (DM+3)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block' }}>Source Starport:</label>
            <select value={modifiers.sourceStarport} onChange={e => setModifiers({...modifiers, sourceStarport: e.target.value})} style={{width: '100%'}}>
              <option value="A">A (DM+2)</option>
              <option value="B">B (DM+1)</option>
              <option value="C">C/D (DM 0)</option>
              <option value="E">E (DM-1)</option>
              <option value="X">X (DM-3)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block' }}>Dest Starport:</label>
            <select value={modifiers.destStarport} onChange={e => setModifiers({...modifiers, destStarport: e.target.value})} style={{width: '100%'}}>
              <option value="A">A (DM+2)</option>
              <option value="B">B (DM+1)</option>
              <option value="C">C/D (DM 0)</option>
              <option value="E">E (DM-1)</option>
              <option value="X">X (DM-3)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block' }}>Dest Zone:</label>
            <select value={modifiers.destZone} onChange={e => setModifiers({...modifiers, destZone: e.target.value})} style={{width: '100%'}}>
              <option value="none">Standard (DM 0)</option>
              <option value="amber">Amber (DM+1)</option>
              <option value="red">Red (DM-4)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block' }}>Distance (Parsecs):</label>
            <input type="number" value={modifiers.distance} min="1" onChange={e => setModifiers({...modifiers, distance: parseInt(e.target.value) || 1})} style={{width: '100%'}} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block' }}>Misc DM Section:</label>
            <input type="number" value={modifiers.misc} onChange={e => setModifiers({...modifiers, misc: parseInt(e.target.value) || 0})} style={{width: '100%'}} />
          </div>
        </div>
        
        <button style={{ marginTop: '20px', width: '100%', padding: '15px' }} onClick={scanForPassengers}>
          {manifest ? 'Reroll Manifest (Jump)' : 'Scan Local Starport'}
        </button>
      </div>

      {!manifest ? (
        <p>No active passenger manifest. Adjust your DMs and scan the starport.</p>
      ) : (
        <div>
          <h3>Available Passengers</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-phosphor)' }}>
                <th>Class</th>
                <th>Available</th>
                <th>Reqs</th>
                <th>Revenue</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>High Passage</td>
                <td>{manifest.high}</td>
                <td>1 Sr, 1T Cargo</td>
                <td>Cr 9,000</td>
                <td><button onClick={() => processTicket('high', 9000, 1, 0, 1)} disabled={manifest.high === 0}>Board</button></td>
              </tr>
              <tr>
                <td>Middle Passage</td>
                <td>{manifest.middle}</td>
                <td>1 Sr, 100kg Cargo</td>
                <td>Cr 3,000</td>
                <td><button onClick={() => processTicket('middle', 3000, 1, 0, 0.1)} disabled={manifest.middle === 0}>Board</button></td>
              </tr>
              <tr>
                <td>Basic Passage</td>
                <td>{manifest.basic}</td>
                <td>Shared Sr / 2T</td>
                <td>Cr 1,000</td>
                <td><button onClick={() => processTicket('basic', 1000, 0.5, 0, 0)} disabled={manifest.basic === 0}>Board</button></td>
              </tr>
              <tr>
                <td>Low Passage</td>
                <td>{manifest.low}</td>
                <td>1 Low Berth</td>
                <td>Cr 1,000</td>
                <td><button onClick={() => processTicket('low', 1000, 0, 1, 0)} disabled={manifest.low === 0}>Board</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
