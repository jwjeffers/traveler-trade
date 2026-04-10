

import * as React from 'react';

export interface Passenger {
  id: string;
  name: string;
  type: string;
  revenue: number;
  staterooms: number;
  lowBerths: number;
  cargo: number;
}

export interface Weapon {
  id: string;
  weapon: string;
  mount: string;
  tl: string;
  range: string;
  damage: string;
  ammo: string;
  traits: string;
}

export interface SoftwarePackage {
  id: string;
  name: string;
  bandwidth: string;
}

export interface FreightLot {
  id: string;
  type: string;
  tons: number;
  revenue: number;
  shipper?: string;
}

export interface MailContract {
  id: string;
  containers: number;
  totalTons: number;
  revenue: number;
}

export interface TradeGoodItem {
  id: string;
  d66: number | string;
  type: string;
  tons: number;
  purchasePrice: number;
}

export interface MiscCargoItem {
  id: string;
  description: string;
  tons: number;
}

export interface CharacterData {
  title: string;
  age: string;
  species: string;
  homeworld: string;
  traits: string;
  str: number;
  dex: number;
  end: number;
  int: number;
  edu: number;
  soc: number;
  skills: { id: string; name: string; level: number }[];
  equipment: string;
  weapons: string;
  armor: string;
  augments: string;
  trainingSkill: string;
  trainingWeeks: string;
  trainingPeriods: string;
  wounds: string;
  careers: string;
  history: string;
  allies: string;
  contacts: string;
  rivals: string;
  enemies: string;
  personalCredits: number;
}

export interface CrewMember {
  id: string;
  name: string;
  roles: string;
  type: 'Player' | 'NPC';
  salary: number;
  payrollShare: number;
  assignedShipId?: string;
  characterData?: CharacterData;
}

export interface LedgerEntry {
  id: string;
  timestamp: string; // ISO string
  type: 'Income' | 'Expense' | 'Manual';
  amount: number;
  description: string;
}

export interface ShipData {
  id: string; // added so we can find ships in the array
  shipName: string;
  shipClass: string;
  hullCurrent: number;
  hullMax: number;
  armor: number;

  software: SoftwarePackage[];
  systems: string;
  sensorsType: string;
  sensorsDM: number;
  
  powerPoints: number;
  powerRequired: number;
  
  manoeuvreThrust: number;
  reactionThrust: number;
  jumpDriveJump: number;
  
  finances: {
    fuelCost: number;
    mortgage: number;
    lifeSupport: number;
    salaries: number;
    maintenance: number;
  };
  
  criticalHits: {
    armor: number;
    bridge: number;
    cargo: number;
    crew: number;
    fuel: number;
    hull: number;
    jDrive: number;
    mDrive: number;
    powerPlant: number;
    sensors: number;
    weapons: number;
  };

  weapons: Weapon[];

  credits: number;
  maxStaterooms: number;
  availableStaterooms: number;
  maxLowBerths: number;
  availableLowBerths: number;
  maxCargoTons: number;
  availableCargoTons: number;
  passengers: Passenger[];
  freightLots: FreightLot[];
  mailContracts: MailContract[];
  tradeGoods?: TradeGoodItem[];
  miscCargo?: MiscCargoItem[];
  ledgers?: LedgerEntry[];
}

export interface CompanyData {
  companyName: string;
  passcode: string;
  crewRoster: CrewMember[];
  ships: ShipData[];
}

export const defaultCompanyData: CompanyData = {
  companyName: "Unregistered Organization",
  passcode: "0000",
  crewRoster: [],
  ships: [
    {
      id: "sh-default01",
      shipName: "Unregistered",
      shipClass: "Free Trader",
      hullCurrent: 40,
  hullMax: 40,
  armor: 0,

  software: [
    { id: '1', name: 'Intellect', bandwidth: '10' },
    { id: '2', name: 'Library', bandwidth: '0' },
    { id: '3', name: '', bandwidth: '' },
    { id: '4', name: '', bandwidth: '' },
    { id: '5', name: '', bandwidth: '' },
    { id: '6', name: '', bandwidth: '' },
    { id: '7', name: '', bandwidth: '' }
  ],
  systems: "Basic Ship Systems\nJump Drive\nManoeuvre Drive\nSensors\nWeapons",
  sensorsType: "Basic",
  sensorsDM: -2,

  powerPoints: 60,
  powerRequired: 20,

  manoeuvreThrust: 1,
  reactionThrust: 0,
  jumpDriveJump: 1,

  finances: {
    fuelCost: 1000,
    mortgage: 153000,
    lifeSupport: 2000,
    salaries: 18000,
    maintenance: 10000,
  },

  criticalHits: {
    armor: 0, bridge: 0, cargo: 0, crew: 0, fuel: 0, hull: 0, jDrive: 0, mDrive: 0, powerPlant: 0, sensors: 0, weapons: 0
  },
  weapons: [],

  credits: 100000,
  maxStaterooms: 10,
  availableStaterooms: 10,
  maxLowBerths: 5,
  availableLowBerths: 5,
  maxCargoTons: 60,
      availableCargoTons: 60,
      passengers: [],
      freightLots: [],
      mailContracts: [],
      ledgers: []
    }
  ]
};

const CriticalTrack = ({ name, value, onChange }: { name: string, value: number, onChange: (v: number) => void }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <span style={{ fontSize: '0.9rem', width: '90px' }}>{name}</span>
      <div className="crit-boxes">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div 
            key={i}
            className={`crit-box ${i <= value ? 'filled' : ''}`}
            onClick={() => onChange(value === i ? i - 1 : i)}
          />
        ))}
      </div>
    </div>
  )
};


export function ShipStatus({ data, updateData, allShips, onTransfer, companyRoster }: { data: ShipData, updateData: (d: Partial<ShipData>) => void, allShips?: ShipData[], onTransfer?: (itemObj: any, itemType: 'Passenger' | 'Freight' | 'Mail' | 'Misc' | 'TradeGood', destShipId: string, isSale: boolean, salePrice: number) => void, companyRoster?: CrewMember[] }) {
  
  const [transferPopup, setTransferPopup] = React.useState<{ isOpen: boolean, itemObj: any, itemType: 'Passenger' | 'Freight' | 'Trade' | 'Misc' | 'Mail' } | null>(null);
  const [targetShipId, setTargetShipId] = React.useState<string>('');
  const [isSale, setIsSale] = React.useState<boolean>(false);
  const [salePrice, setSalePrice] = React.useState<string>('');

  const handleChange = (key: keyof ShipData, value: any) => {
    updateData({ [key]: value });
  };

  return (
    <div className="panel" data-title="[ SHIP STATUS ]" style={{ padding: '20px 10px' }}>
      <div className="ship-grid-container">
        
        {/* LEFT PANE: Digital Character Sheet */}
        <div className="ship-left-pane">
           <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="ship-field-row">
                 <div className="ship-field-inline" style={{flex: 1, minWidth: '150px'}}>
                    SHIP'S NAME: <input type="text" value={data.shipName} onChange={e => handleChange('shipName', e.target.value)} style={{flex: 1, minWidth: '50px'}} />
                 </div>
                 <div className="ship-field-inline" style={{flexWrap: 'wrap'}}>
                    HULL: <input type="number" style={{width: '60px'}} value={data.hullCurrent} onChange={e => handleChange('hullCurrent', parseInt(e.target.value) || 0)} /> / <input type="number" style={{width: '60px'}} value={data.hullMax} onChange={e => handleChange('hullMax', parseInt(e.target.value) || 0)} />
                    ARMOUR: <input type="number" style={{width: '40px'}} value={data.armor} onChange={e => handleChange('armor', parseInt(e.target.value) || 0)} />
                 </div>
              </div>
              <div className="ship-field-row">
                 <div className="ship-field-inline" style={{flex: 1, minWidth: '150px'}}>
                    CLASS: <input type="text" value={data.shipClass} onChange={e => handleChange('shipClass', e.target.value)} style={{flex: 1, minWidth: '50px'}} />
                 </div>
                 <div className="ship-field-inline" style={{flexWrap: 'wrap'}}>
                    POWER PTS: <input type="number" style={{width: '60px'}} value={data.powerPoints} onChange={e => handleChange('powerPoints', parseInt(e.target.value) || 0)} />
                    REQ: <input type="number" style={{width: '60px'}} value={data.powerRequired} onChange={e => handleChange('powerRequired', parseInt(e.target.value) || 0)} />
                 </div>
              </div>
           </div>
           
           <hr style={{borderColor: 'var(--color-phosphor-dim)'}} />

           <div className="ship-details-grid">
              <div>
                 <div style={{border: '1px solid var(--color-phosphor-dim)', padding: '10px'}}>
                    <h4>SHIP'S COMPUTER</h4>
                    <div className="ship-field-row" style={{borderBottom: '1px solid var(--color-phosphor-dim)', paddingBottom: '2px', marginBottom: '5px', fontSize: '0.9rem'}}>
                      <span style={{flex: 1}}>SOFTWARE PACKAGES:</span>
                      <span style={{width: '60px', textAlign: 'center'}}>BANDWIDTH:</span>
                    </div>
                    {data.software.map(sw => (
                      <div key={sw.id} className="ship-field-row">
                        <input type="text" value={sw.name} onChange={e => { const arr = [...data.software]; arr.find(x => x.id === sw.id)!.name = e.target.value; handleChange('software', arr); }} style={{flex: 1, border: 'none', background: 'transparent', borderBottom: '1px dotted var(--color-phosphor-dim)', fontSize: '0.9rem'}} />
                        <input type="text" value={sw.bandwidth} onChange={e => { const arr = [...data.software]; arr.find(x => x.id === sw.id)!.bandwidth = e.target.value; handleChange('software', arr); }} style={{width: '60px', textAlign: 'center', border: 'none', background: 'transparent', borderBottom: '1px dotted var(--color-phosphor-dim)', fontSize: '0.9rem', marginLeft: '5px'}} />
                      </div>
                    ))}
                 </div>
                 <div style={{border: '1px solid var(--color-phosphor-dim)', padding: '10px', marginTop: '15px'}}>
                    <h4>DRIVES (THRUST/JUMP)</h4>
                    <div className="ship-field-row">M-DRIVE: <input type="number" style={{width:'80px'}} value={data.manoeuvreThrust} onChange={e => handleChange('manoeuvreThrust', parseInt(e.target.value)||0)} /></div>
                    <div className="ship-field-row">R-DRIVE: <input type="number" style={{width:'80px'}} value={data.reactionThrust} onChange={e => handleChange('reactionThrust', parseInt(e.target.value)||0)} /></div>
                    <div className="ship-field-row">J-DRIVE: <input type="number" style={{width:'80px'}} value={data.jumpDriveJump} onChange={e => handleChange('jumpDriveJump', parseInt(e.target.value)||0)} /></div>
                 </div>
              </div>

              <div>
                 <div style={{border: '1px solid var(--color-phosphor-dim)', padding: '10px'}}>
                    <h4>SYSTEMS</h4>
                    <textarea value={data.systems} onChange={e => handleChange('systems', e.target.value)} style={{width: '100%', height: '141px', background: 'transparent', color: 'var(--color-phosphor)', border: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '1rem'}} />
                 </div>
                 <div style={{border: '1px solid var(--color-phosphor-dim)', padding: '10px', marginTop: '15px'}}>
                    <h4>FINANCES (Cr)</h4>
                    {['fuelCost', 'mortgage', 'lifeSupport', 'salaries', 'maintenance'].map((key) => {
                       const label = { fuelCost: 'Fuel', mortgage: 'Mortgage', lifeSupport: 'Life Support', salaries: 'Salaries', maintenance: 'Maintenance' }[key as keyof typeof data.finances];
                       const isSalaries = key === 'salaries';
                       const val = isSalaries && companyRoster ? companyRoster.filter(c => c.assignedShipId === data.id).reduce((acc, c) => acc + (c.salary || 0), 0) : ((data.finances as any)[key] || 0);
                       return (
                         <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'nowrap' }}>
                           <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '5px' }}>{label}:</span> 
                           {isSalaries ? (
                             <span style={{ width: '60px', flexShrink: 0, textAlign: 'right', display: 'inline-block', padding: '2px', borderBottom: '1px dotted var(--color-phosphor-dim)' }}>{val}</span>
                           ) : (
                             <input type="number" style={{ width: '60px', flexShrink: 0 }} value={val} 
                               onChange={e => handleChange('finances', {...data.finances, [key]: parseInt(e.target.value)||0})} />
                           )}
                           <button 
                             onClick={() => {
                               const cost = val;
                               const newLedger: LedgerEntry = { id: Math.random().toString(), timestamp: new Date().toISOString(), type: 'Expense', amount: -cost, description: `Paid ${label} Cost` };
                               updateData({ 
                                 credits: data.credits - cost,
                                 ledgers: [...(data.ledgers || []), newLedger]
                               })
                             }} 
                             style={{ padding: '2px 4px', marginLeft: '5px', fontSize: '0.75rem', color: '#ff5555', borderColor: '#ff5555', flexShrink: 0 }}
                             disabled={val <= 0}
                           >
                             PAY
                           </button>
                         </div>
                       )
                    })}
                 </div>
              </div>

              <div>
                 <div style={{border: '1px solid #882222', padding: '10px', background: 'rgba(255,0,0,0.05)'}}>
                    <h4 style={{color: '#ff6666'}}>CRITICAL HITS</h4>
                    {Object.keys(data.criticalHits).map(k => (
                       <CriticalTrack 
                         key={k} 
                         name={k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1')} 
                         value={(data.criticalHits as any)[k]} 
                         onChange={(v) => handleChange('criticalHits', { ...data.criticalHits, [k]: v })}
                       />
                    ))}
                    <div className="ship-field-row" style={{marginTop: '15px', paddingTop: '10px', color: '#ff6666', borderTop: '1px dashed #ff6666'}}>
                      <div className="ship-field-inline">Sensors: <input type="text" value={data.sensorsType} onChange={e => handleChange('sensorsType', e.target.value)} style={{width:'100%', borderColor: '#ff6666'}} /></div>
                    </div>
                    <div className="ship-field-row" style={{color: '#ff6666'}}>
                      <div className="ship-field-inline">DM: <input type="number" value={data.sensorsDM} onChange={e => handleChange('sensorsDM', parseInt(e.target.value)||0)} style={{width:'100%', borderColor: '#ff6666'}} /></div>
                    </div>
                 </div>
              </div>
           </div>

           <div style={{border: '1px solid var(--color-phosphor-dim)', padding: '10px', marginTop: '10px'}}>
              <h4>WEAPONS</h4>
              <div style={{overflowX: 'auto'}}>
                {data.weapons.length === 0 ? <p style={{color: 'var(--color-phosphor-dim)'}}>No weapons mounted. Hardpoints available.</p> : (
                  <table style={{width: '100%', fontSize: '1rem', textAlign: 'left', minWidth: '600px'}}>
                    <thead><tr style={{borderBottom: '1px solid var(--color-phosphor)'}}><th>Weapon</th><th>Mount</th><th>TL</th><th>Range</th><th>Damage</th><th>Ammo</th><th>Traits</th><th></th></tr></thead>
                    <tbody>
                      {data.weapons.map(w => (
                        <tr key={w.id}>
                          <td><input type="text" value={w.weapon} onChange={e => { const wps = [...data.weapons]; wps.find(x => x.id === w.id)!.weapon = e.target.value; handleChange('weapons', wps); }} style={{width:'100%', border:'none', background:'transparent', borderBottom:'1px dotted var(--color-phosphor-dim)'}}/></td>
                          <td><input type="text" value={w.mount} onChange={e => { const wps = [...data.weapons]; wps.find(x => x.id === w.id)!.mount = e.target.value; handleChange('weapons', wps); }} style={{width:'100%', border:'none', background:'transparent', borderBottom:'1px dotted var(--color-phosphor-dim)'}}/></td>
                          <td><input type="text" value={w.tl} onChange={e => { const wps = [...data.weapons]; wps.find(x => x.id === w.id)!.tl = e.target.value; handleChange('weapons', wps); }} style={{width:'40px', border:'none', background:'transparent', borderBottom:'1px dotted var(--color-phosphor-dim)'}}/></td>
                          <td><input type="text" value={w.range} onChange={e => { const wps = [...data.weapons]; wps.find(x => x.id === w.id)!.range = e.target.value; handleChange('weapons', wps); }} style={{width:'100%', border:'none', background:'transparent', borderBottom:'1px dotted var(--color-phosphor-dim)'}}/></td>
                          <td><input type="text" value={w.damage} onChange={e => { const wps = [...data.weapons]; wps.find(x => x.id === w.id)!.damage = e.target.value; handleChange('weapons', wps); }} style={{width:'100%', border:'none', background:'transparent', borderBottom:'1px dotted var(--color-phosphor-dim)'}}/></td>
                          <td><input type="text" value={w.ammo} onChange={e => { const wps = [...data.weapons]; wps.find(x => x.id === w.id)!.ammo = e.target.value; handleChange('weapons', wps); }} style={{width:'50px', border:'none', background:'transparent', borderBottom:'1px dotted var(--color-phosphor-dim)'}}/></td>
                          <td><input type="text" value={w.traits} onChange={e => { const wps = [...data.weapons]; wps.find(x => x.id === w.id)!.traits = e.target.value; handleChange('weapons', wps); }} style={{width:'100%', border:'none', background:'transparent', borderBottom:'1px dotted var(--color-phosphor-dim)'}}/></td>
                          <td><button onClick={() => handleChange('weapons', data.weapons.filter(x => x.id !== w.id))}>X</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <button style={{marginTop: '15px'}} onClick={() => handleChange('weapons', [...data.weapons, {id: crypto.randomUUID(), weapon: '', mount: '', tl: '', range: '', damage: '', ammo: '', traits: ''}])}>+ Mount Weapon</button>
           </div>
        </div>

        {/* RIGHT PANE: Capacities & Finances Overview */}
        <div className="ship-right-pane">
            <h3 style={{marginTop: 0, color: 'var(--color-phosphor-dim)', borderBottom: '1px dotted var(--color-phosphor-dim)', paddingBottom: '10px'}}>SHIP CAPACITY LOG</h3>
            
            <div className="ship-field-row" style={{ marginTop: '10px' }}>
              <span style={{ minWidth: '100px' }}>Credits:</span>
              <div className="ship-field-inline" style={{flex: 1}}>
                Cr <span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{data.credits.toLocaleString()}</span>
              </div>
            </div>

            <div className="ship-field-row">
              <span style={{ minWidth: '100px' }}>Staterooms:</span>
              <div className="ship-field-inline">
                 <input type="number" value={data.availableStaterooms} onChange={e => handleChange('availableStaterooms', parseInt(e.target.value) || 0)} style={{ width: '60px' }} />
                 <span>/</span>
                 <input type="number" value={data.maxStaterooms} onChange={e => handleChange('maxStaterooms', parseInt(e.target.value) || 0)} style={{ width: '60px' }} />
              </div>
            </div>

            <div className="ship-field-row">
              <span style={{ minWidth: '100px' }}>Low Berths:</span>
              <div className="ship-field-inline">
                 <input type="number" value={data.availableLowBerths} onChange={e => handleChange('availableLowBerths', parseInt(e.target.value) || 0)} style={{ width: '60px' }} />
                 <span>/</span>
                 <input type="number" value={data.maxLowBerths} onChange={e => handleChange('maxLowBerths', parseInt(e.target.value) || 0)} style={{ width: '60px' }} />
              </div>
            </div>

            <div className="ship-field-row">
              <span style={{ minWidth: '100px' }}>Cargo (T):</span>
              <div className="ship-field-inline">
                 <input type="number" value={data.availableCargoTons} onChange={e => handleChange('availableCargoTons', parseInt(e.target.value) || 0)} style={{ width: '60px' }} />
                 <span>/</span>
                 <input type="number" value={data.maxCargoTons} onChange={e => handleChange('maxCargoTons', parseInt(e.target.value) || 0)} style={{ width: '60px' }} />
              </div>
            </div>

            <div style={{ marginTop: '30px', borderTop: '2px dashed var(--color-phosphor-dim)', paddingTop: '20px', flex: 1 }}>
              <h3 style={{marginTop: 0}}>Current Passengers Onboard</h3>
              {(!data.passengers || data.passengers.length === 0) ? (
                <p style={{ color: 'var(--color-phosphor-dim)' }}>No passengers currently onboard.</p>
              ) : (
                <div style={{overflowY: 'auto', maxHeight: '400px'}}>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-phosphor)' }}>
                        <th>Name</th><th>Class</th><th>Revenue</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.passengers.map(p => (
                        <tr key={p.id}>
                          <td>
                            <input 
                              type="text" 
                              value={p.name} 
                              placeholder="Name..."
                              onChange={(e) => {
                                const updated = data.passengers.map(pass => pass.id === p.id ? { ...pass, name: e.target.value } : pass);
                                updateData({ passengers: updated });
                              }}
                              style={{ width: '100%', border: 'none', borderBottom: '1px dotted var(--color-phosphor-dim)' }}
                            />
                          </td>
                          <td>{p.type}</td>
                          <td>Cr {p.revenue.toLocaleString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button 
                                onClick={() => {
                                  const remaining = data.passengers.filter(pass => pass.id !== p.id);
                                  updateData({ 
                                    passengers: remaining,
                                    availableStaterooms: data.availableStaterooms + p.staterooms,
                                    availableLowBerths: data.availableLowBerths + p.lowBerths,
                                    availableCargoTons: data.availableCargoTons + p.cargo
                                  });
                                }}
                                style={{ padding: '2px 5px', fontSize: '0.8rem', marginTop: '5px' }}>
                                Deliver
                              </button>
                                <button 
                                  onClick={() => {
                                    const remaining = data.passengers.filter(pass => pass.id !== p.id);
                                    const newLedger: LedgerEntry = { id: Math.random().toString(), timestamp: new Date().toISOString(), type: 'Expense', amount: -p.revenue, description: `Refunded ${p.type} Passenger Ticket (${p.name || 'Unknown'})` };
                                    updateData({ 
                                      passengers: remaining,
                                      availableStaterooms: data.availableStaterooms + p.staterooms,
                                      availableLowBerths: data.availableLowBerths + p.lowBerths,
                                      availableCargoTons: data.availableCargoTons + p.cargo,
                                      credits: data.credits - p.revenue,
                                      ledgers: [...(data.ledgers || []), newLedger]
                                    });
                                  }}
                                  style={{ padding: '2px 5px', fontSize: '0.8rem', marginTop: '5px', borderColor: '#ff6666', color: '#ff6666' }}>
                                  Refund
                                </button>
                                <button
                                  onClick={() => setTransferPopup({ isOpen: true, itemObj: p, itemType: 'Passenger' })}
                                  style={{ padding: '2px 5px', fontSize: '0.8rem', marginTop: '5px', borderColor: '#ffff00', color: '#ffff00' }}>
                                  Transfer
                                </button>
                              </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h3 style={{marginTop: '30px'}}>Current Freight & Mail Lots</h3>
              {((!data.freightLots || data.freightLots.length === 0) && (!data.mailContracts || data.mailContracts.length === 0)) ? (
                <p style={{ color: 'var(--color-phosphor-dim)' }}>No cargo currently loaded in hold.</p>
              ) : (
                <div style={{overflowY: 'auto', maxHeight: '400px'}}>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-phosphor)' }}>
                        <th>ID / Manifest</th><th>Type</th><th>Tons</th><th>Value</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.freightLots?.map(f => (
                        <tr key={f.id}>
                          <td>{f.shipper ? `${f.shipper} [${f.id}]` : f.id}</td>
                          <td>{f.type} Freight</td>
                          <td>{f.tons}T</td>
                          <td>Cr {f.revenue.toLocaleString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button 
                                onClick={() => {
                                  const remaining = data.freightLots.filter(lot => lot.id !== f.id);
                                  updateData({ 
                                    freightLots: remaining,
                                    availableCargoTons: data.availableCargoTons + f.tons
                                  });
                                }}
                                style={{ padding: '2px 5px', fontSize: '0.8rem', marginTop: '5px' }}>
                                Deliver
                              </button>
                              <button 
                                onClick={() => {
                                  const remaining = data.freightLots.filter(lot => lot.id !== f.id);
                                  const newLedger: LedgerEntry = { id: Math.random().toString(), timestamp: new Date().toISOString(), type: 'Expense', amount: -f.revenue, description: `Refunded ${f.type} Freight Lot [${f.id}]` };
                                  updateData({ 
                                    freightLots: remaining,
                                    availableCargoTons: data.availableCargoTons + f.tons,
                                    credits: data.credits - f.revenue,
                                    ledgers: [...(data.ledgers || []), newLedger]
                                  });
                                }}
                                style={{ padding: '2px 5px', fontSize: '0.8rem', marginTop: '5px', borderColor: '#ff6666', color: '#ff6666' }}>
                                Refund
                              </button>
                                <button
                                  onClick={() => setTransferPopup({ isOpen: true, itemObj: f, itemType: 'Freight' })}
                                  style={{ padding: '2px 5px', fontSize: '0.8rem', marginTop: '5px', borderColor: '#ffff00', color: '#ffff00' }}>
                                  Transfer
                                </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {data.mailContracts?.map(m => (
                        <tr key={m.id}>
                          <td>{m.id}</td>
                          <td>Priority Mail</td>
                          <td>{m.totalTons}T</td>
                          <td>Cr {m.revenue.toLocaleString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button 
                                onClick={() => {
                                  const remaining = data.mailContracts.filter(mail => mail.id !== m.id);
                                  updateData({ 
                                    mailContracts: remaining,
                                    availableCargoTons: data.availableCargoTons + m.totalTons
                                  });
                                }}
                                style={{ padding: '2px 5px', fontSize: '0.8rem', marginTop: '5px' }}>
                                Deliver
                              </button>
                              <button 
                                onClick={() => {
                                  const remaining = data.mailContracts.filter(mail => mail.id !== m.id);
                                  updateData({ 
                                    mailContracts: remaining,
                                    availableCargoTons: data.availableCargoTons + m.totalTons,
                                    credits: data.credits - m.revenue
                                  });
                                }}
                                style={{ padding: '2px 5px', fontSize: '0.8rem', marginTop: '5px', borderColor: '#ff6666', color: '#ff6666' }}>
                                Refund
                              </button>
                                <button
                                  onClick={() => setTransferPopup({ isOpen: true, itemObj: m, itemType: 'Mail' })}
                                  style={{ padding: '2px 5px', fontSize: '0.8rem', marginTop: '5px', borderColor: '#ffff00', color: '#ffff00' }}>
                                  Transfer
                                </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h3 style={{marginTop: '30px'}}>Current Trade Items</h3>
              {(!data.tradeGoods || data.tradeGoods.length === 0) ? (
                <p style={{ color: 'var(--color-phosphor-dim)' }}>No speculative cargo currently loaded.</p>
              ) : (
                <div style={{overflowY: 'auto', maxHeight: '300px'}}>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-phosphor)' }}>
                        <th>Goods</th><th>Tons</th><th>Base Cost</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tradeGoods.map(tg => (
                        <tr key={tg.id}>
                          <td>[{tg.d66}] {tg.type}</td>
                          <td>{tg.tons}T</td>
                          <td>Cr {tg.purchasePrice.toLocaleString()}</td>
                          <td>
                            <button 
                              onClick={() => {
                                const remaining = data.tradeGoods!.filter(t => t.id !== tg.id);
                                updateData({ 
                                  tradeGoods: remaining,
                                  availableCargoTons: data.availableCargoTons + tg.tons
                                });
                              }}
                              style={{ padding: '2px 5px', fontSize: '0.8rem', borderColor: '#ff6666', color: '#ff6666' }}>
                              Dump Cargo
                            </button>
                            <button
                               onClick={() => setTransferPopup({ isOpen: true, itemObj: tg, itemType: 'Trade' })}
                               style={{ padding: '2px 5px', fontSize: '0.8rem', borderColor: '#ffff00', color: '#ffff00', marginLeft: '5px' }}>
                               Transfer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h3 style={{marginTop: '30px'}}>Miscellaneous Cargo</h3>
              {(!data.miscCargo || data.miscCargo.length === 0) ? (
                <p style={{ color: 'var(--color-phosphor-dim)' }}>No miscellaneous cargo stored.</p>
              ) : (
                <div style={{overflowY: 'auto', maxHeight: '300px'}}>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-phosphor)' }}>
                        <th>Description</th><th>Tons</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.miscCargo.map(mc => (
                        <tr key={mc.id}>
                          <td>{mc.description}</td>
                          <td>{mc.tons}T</td>
                          <td>
                            <button 
                              onClick={() => {
                                const remaining = data.miscCargo!.filter(c => c.id !== mc.id);
                                updateData({ 
                                  miscCargo: remaining,
                                  availableCargoTons: data.availableCargoTons + mc.tons
                                });
                              }}
                              style={{ padding: '2px 5px', fontSize: '0.8rem', borderColor: '#ff6666', color: '#ff6666' }}>
                              Dump Cargo
                            </button>
                            <button
                               onClick={() => setTransferPopup({ isOpen: true, itemObj: mc, itemType: 'Misc' })}
                               style={{ padding: '2px 5px', fontSize: '0.8rem', borderColor: '#ffff00', color: '#ffff00', marginLeft: '5px' }}>
                               Transfer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

      {transferPopup && transferPopup.isOpen && allShips && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setTransferPopup(null)}>
          <div className="panel" onClick={e => e.stopPropagation()} style={{ background: '#050000', padding: '30px', maxWidth: '500px' }}>
            <h2 style={{ color: 'var(--color-phosphor)', marginTop: 0 }}>TRANSFER ASSET</h2>
            <p>Moving {transferPopup.itemType} from {data.shipName}</p>
            
            <div className="ship-field-row" style={{ marginBottom: '15px' }}>
              <span>Destination Vessel:</span>
              <select value={targetShipId} onChange={e => setTargetShipId(e.target.value)} style={{ flex: 1 }}>
                <option value="">-- Select Vessel --</option>
                {allShips.filter(s => s.id !== data.id).map(s => (
                  <option key={s.id} value={s.id}>{s.shipName}</option>
                ))}
              </select>
            </div>

            <div className="ship-field-row" style={{ marginBottom: '15px' }}>
              <span>Transfer Type:</span>
              <select value={isSale ? 'sale' : 'simple'} onChange={e => setIsSale(e.target.value === 'sale')} style={{ flex: 1 }}>
                <option value="simple">Manifest Swap (Free)</option>
                <option value="sale">Internal Sale (Credits)</option>
              </select>
            </div>

            {isSale && (
              <div className="ship-field-row" style={{ marginBottom: '15px' }}>
                <span>Sale Price (Cr):</span>
                <input type="number" min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)} style={{ flex: 1 }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button 
                onClick={() => {
                  if (!targetShipId) {
                    alert('Select a destination vessel.');
                    return;
                  }
                  if (onTransfer) {
                    onTransfer(transferPopup.itemType, transferPopup.itemObj, data.id, targetShipId, isSale, parseInt(salePrice) || 0);
                  }
                  setTransferPopup(null);
                  setTargetShipId('');
                  setIsSale(false);
                  setSalePrice('');
                }}
                style={{ flex: 1, padding: '10px', fontWeight: 'bold' }}
              >
                EXECUTE TRANSFER
              </button>
              <button 
                onClick={() => {
                  setTransferPopup(null);
                  setTargetShipId('');
                  setIsSale(false);
                  setSalePrice('');
                }} 
                style={{ padding: '10px', borderColor: '#ff6666', color: '#ff6666' }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      </div>
  );
}
