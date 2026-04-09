import { useState } from 'react';
import type { ShipData, FreightLot, MailContract } from './ShipStatus';

export function FreightBroker({ shipData, updateShipData }: { shipData: ShipData, updateShipData: (u: Partial<ShipData>) => void }) {
  const [lots, setLots] = useState<FreightLot[] | null>(null);
  const [mail, setMail] = useState<MailContract | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  const [modifiers, setModifiers] = useState({
    brokerEffect: 0,
    sourcePop: '2-5',
    destPop: '2-5',
    sourceStarport: 'C',
    destStarport: 'C',
    sourceTL: '7-8',
    destTL: '7-8',
    destZone: 'none',
    distance: 1,
    misc: 0,
    isArmed: false,
    navalRank: 0,
    socDM: 0
  });

  const handleChange = (key: string, value: any) => {
    setModifiers(prev => ({ ...prev, [key]: value }));
  };

  const calculateFreightTrafficDM = () => {
    let dm = modifiers.brokerEffect + modifiers.misc;
    
    const popDM = (pop: string) => {
      if (pop === '<=1') return -4;
      if (pop === '6-7') return 2;
      if (pop === '8+') return 4;
      return 0; // 2-5
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

    const tlDM = (tl: string) => {
      if (tl === '<=5' || tl === '6') return -1;
      if (tl === '9+') return 2;
      return 0;
    };
    dm += tlDM(modifiers.sourceTL);
    dm += tlDM(modifiers.destTL);

    if (modifiers.destZone === 'amber') dm -= 2;
    if (modifiers.destZone === 'red') dm -= 6;
    if (modifiers.distance > 1) dm -= (modifiers.distance - 1);
    
    return dm;
  };

  const getFreightLotsTable = (roll: number) => {
    if (roll <= 1) return 0;
    if (roll === 2 || roll === 3) return 1;
    if (roll === 4 || roll === 5) return 2;
    if (roll === 6 || roll === 7 || roll === 8) return 3;
    if (roll >= 9 && roll <= 11) return 4;
    if (roll >= 12 && roll <= 14) return 5;
    if (roll === 15 || roll === 16) return 6;
    if (roll === 17) return 7;
    if (roll === 18) return 8;
    if (roll === 19) return 9;
    return 10;
  };

  const rollDice = (count: number) => {
    let sum = 0;
    for(let i = 0; i < count; i++) sum += Math.floor(Math.random() * 6) + 1;
    return sum;
  };

  const getPayout = (distance: number) => {
    if (distance === 1) return 1000;
    if (distance === 2) return 1600;
    if (distance === 3) return 2600;
    if (distance === 4) return 4400;
    if (distance === 5) return 8500;
    return 32000;
  };

  const generateExchange = () => {
    const baseDM = calculateFreightTrafficDM();
    
    const getShipper = () => {
      const megacorps = [
        "Tukera Lines", "Ling-Standard Products", "SuSAG", "Makhidkarun", 
        "Sternmetal Horizons", "General Products", "Instellarms", 
        "Delgado Trading", "Naasirka", "Sharurshid"
      ];
      const locals = [
        "Independent Free Trader", "Local Mining Guild", "System Agricultural Coop",
        "Noble Estate Logistics", "Orbital Factory 4", "Planetary Government",
        "Smuggler Cartel", "Mercenary Outfitter"
      ];
      // 50% megacorp, 50% local
      if (Math.random() > 0.5) return megacorps[Math.floor(Math.random() * megacorps.length)];
      return locals[Math.floor(Math.random() * locals.length)];
    };

    const generateSpecificType = (modifier: number, lotSizeMul: number, typeName: string) => {
      const roll = rollDice(2) + baseDM + modifier;
      const diceLots = getFreightLotsTable(roll);
      const exactLotCount = diceLots > 0 ? rollDice(diceLots) : 0;
      
      const generated = [];
      for(let i = 0; i < exactLotCount; i++) {
         const tons = rollDice(1) * lotSizeMul;
         generated.push({
            id: typeName.charAt(0) + Math.random().toString(36).substr(2, 4).toUpperCase(),
            type: typeName,
            tons: tons,
            revenue: tons * getPayout(modifiers.distance),
            shipper: getShipper()
         });
      }
      return generated;
    };

    setLots([
      ...generateSpecificType(-4, 10, 'Major'),
      ...generateSpecificType(0, 5, 'Minor'),
      ...generateSpecificType(2, 1, 'Incidental')
    ]);

    // MAIL LOGIC
    let mailDMTracker = 0;
    if (baseDM <= -10) mailDMTracker = -2;
    else if (baseDM >= -9 && baseDM <= -5) mailDMTracker = -1;
    else if (baseDM >= 5 && baseDM <= 9) mailDMTracker = 1;
    else if (baseDM >= 10) mailDMTracker = 2;

    let mailTotalDM = mailDMTracker;
    if (modifiers.isArmed) mailTotalDM += 2;
    if (modifiers.sourceTL === '<=5') mailTotalDM -= 4;
    mailTotalDM += modifiers.navalRank;
    mailTotalDM += modifiers.socDM;

    const mailRoll = rollDice(2) + mailTotalDM;
    if (mailRoll >= 12) {
      const numContainers = rollDice(1);
      setMail({ 
        id: 'MAIL-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        containers: numContainers, 
        totalTons: numContainers * 5, 
        revenue: numContainers * 25000 
      });
    } else {
      setMail(null);
    }
    
    setHasScanned(true);
  };

  const loadFreight = (lot: FreightLot) => {
    if (!lots) return;
    if (shipData.availableCargoTons < lot.tons) {
      alert("Insufficient cargo capacity for this lot!");
      return;
    }
    setLots(lots.filter(l => l.id !== lot.id));
    updateShipData({
      credits: (shipData.credits || 0) + lot.revenue,
      availableCargoTons: shipData.availableCargoTons - lot.tons,
      freightLots: [...(shipData.freightLots || []), lot]
    });
  };

  const loadMail = () => {
    if (!mail) return;
    if (shipData.availableCargoTons < mail.totalTons) {
      alert("Insufficient cargo capacity for Mail delivery!");
      return;
    }
    setMail(null);
    updateShipData({
       credits: (shipData.credits || 0) + mail.revenue,
       availableCargoTons: shipData.availableCargoTons - mail.totalTons,
       mailContracts: [...(shipData.mailContracts || []), mail]
    });
  };

  return (
    <div className="panel" data-title="[ FREIGHT & MAIL BROKER ]">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid var(--color-phosphor-dim)' }}>TRAFFIC MODIFIERS</h4>
          <div className="stat-row">
            <span>Broker Check Effect</span>
            <input type="number" value={modifiers.brokerEffect} onChange={e => handleChange('brokerEffect', parseInt(e.target.value) || 0)} style={{ width: '60px' }} />
          </div>
          <div className="stat-row">
            <span>Distance (Parsecs)</span>
            <input type="number" value={modifiers.distance} onChange={e => handleChange('distance', parseInt(e.target.value) || 1)} style={{ width: '60px' }} />
          </div>
          <div className="stat-row">
            <span>Source Population</span>
            <select value={modifiers.sourcePop} onChange={e => handleChange('sourcePop', e.target.value)}>
              <option value="<=1">1 or less</option><option value="2-5">2-5</option><option value="6-7">6-7</option><option value="8+">8+</option>
            </select>
          </div>
          <div className="stat-row">
            <span>Dest Population</span>
            <select value={modifiers.destPop} onChange={e => handleChange('destPop', e.target.value)}>
              <option value="<=1">1 or less</option><option value="2-5">2-5</option><option value="6-7">6-7</option><option value="8+">8+</option>
            </select>
          </div>
          <div className="stat-row">
            <span>Source Starport</span>
            <select value={modifiers.sourceStarport} onChange={e => handleChange('sourceStarport', e.target.value)}>
              <option value="A">A</option><option value="B">B</option><option value="C">C/D</option><option value="E">E</option><option value="X">X</option>
            </select>
          </div>
          <div className="stat-row">
            <span>Dest Starport</span>
            <select value={modifiers.destStarport} onChange={e => handleChange('destStarport', e.target.value)}>
              <option value="A">A</option><option value="B">B</option><option value="C">C/D</option><option value="E">E</option><option value="X">X</option>
            </select>
          </div>
          <div className="stat-row">
            <span>Source TL</span>
            <select value={modifiers.sourceTL} onChange={e => handleChange('sourceTL', e.target.value)}>
              <option value="<=5">TL 5 or less</option><option value="6">TL 6</option><option value="7-8">TL 7-8</option><option value="9+">TL 9+</option>
            </select>
          </div>
          <div className="stat-row">
            <span>Dest TL</span>
            <select value={modifiers.destTL} onChange={e => handleChange('destTL', e.target.value)}>
               <option value="<=5">TL 5 or less</option><option value="6">TL 6</option><option value="7-8">TL 7-8</option><option value="9+">TL 9+</option>
            </select>
          </div>
          <div className="stat-row">
            <span>Dest Zone</span>
            <select value={modifiers.destZone} onChange={e => handleChange('destZone', e.target.value)}>
              <option value="none">None</option><option value="amber">Amber</option><option value="red">Red</option>
            </select>
          </div>
          <div className="stat-row">
            <span>Misc Modifiers</span>
            <input type="number" value={modifiers.misc} onChange={e => handleChange('misc', parseInt(e.target.value) || 0)} style={{ width: '60px' }} />
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid var(--color-phosphor-dim)' }}>MAIL MODIFIERS</h4>
          <div className="stat-row">
            <span>Ship is Armed?</span>
            <input type="checkbox" checked={modifiers.isArmed} onChange={e => handleChange('isArmed', e.target.checked)} style={{ transform: 'scale(1.5)' }} />
          </div>
          <div className="stat-row">
            <span>Highest Naval/Scout Rank</span>
            <input type="number" value={modifiers.navalRank} onChange={e => handleChange('navalRank', parseInt(e.target.value) || 0)} style={{ width: '60px' }} />
          </div>
          <div className="stat-row">
            <span>Highest SOC DM</span>
            <input type="number" value={modifiers.socDM} onChange={e => handleChange('socDM', parseInt(e.target.value) || 0)} style={{ width: '60px' }} />
          </div>

          <div style={{ marginTop: '30px', padding: '15px', border: '1px dashed var(--color-phosphor)' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>MAIL CONTRACTS</h3>
            {!hasScanned ? (
              <p style={{ color: 'var(--color-phosphor-dim)' }}>Scan port to check for mail.</p>
            ) : mail ? (
              <div>
                <p>1D Containers Available: <strong>{mail.containers}</strong> ({mail.totalTons} Tons)</p>
                <p>Payout: <strong>Cr {mail.revenue.toLocaleString()}</strong></p>
                <button onClick={loadMail} style={{ width: '100%', marginTop: '5px' }}>Accept All Mail</button>
              </div>
            ) : (
              <p style={{ color: '#ff6666' }}>No mail contracts available on this routing.</p>
            )}
          </div>
        </div>
      </div>
      
      <button onClick={generateExchange} style={{ width: '100%', marginBottom: '20px' }}>SCAN PORT FREIGHT & MAIL EXCHANGE</button>

      {hasScanned && lots && (
        <div style={{ marginTop: '10px' }}>
          <h3>Available Freight Lots</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-phosphor)' }}>
                  <th>Lot ID</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Tons</th>
                  <th>Revenue</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lots.length === 0 && (
                  <tr><td colSpan={5} style={{ paddingTop: '10px' }}>No freight available matching criteria.</td></tr>
                )}
                {lots.map(lot => (
                  <tr key={lot.id}>
                    <td>{lot.id}</td>
                    <td>{lot.shipper}</td>
                    <td>{lot.type}</td>
                    <td>{lot.tons}T</td>
                    <td>Cr {lot.revenue.toLocaleString()}</td>
                    <td><button onClick={() => loadFreight(lot)} style={{ padding: '2px 8px', fontSize: '1rem', marginTop: '4px' }}>Load</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
