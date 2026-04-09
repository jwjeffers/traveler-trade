

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

export interface CrewMember {
  id: string;
  name: string;
  roles: string;
  type: 'Player' | 'NPC';
  salary: number;
  payrollShare: number;
  assignedShipId?: string;
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
      mailContracts: []
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


export function ShipStatus({ data, updateData }: { data: ShipData, updateData: (u: Partial<ShipData>) => void }) {
  
  const handleChange = (key: keyof ShipData, value: any) => {
    updateData({ [key]: value });
  };

  return (
    <div className="panel" data-title="[ SHIP STATUS ]" style={{ padding: '20px 10px' }}>
      <div className="ship-grid-container">
        
        {/* LEFT PANE: Digital Character Sheet */}
        <div className="ship-left-pane">
           <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '15px' }}>
              <div className="ship-field-row" style={{ gridColumn: 'span 2' }}>
                 <div className="ship-field-inline" style={{flex: 1}}>
                    SHIP'S NAME: <input type="text" value={data.shipName} onChange={e => handleChange('shipName', e.target.value)} style={{flex: 1, minWidth: '50px'}} />
                 </div>
                 <div className="ship-field-inline">
                    HULL: <input type="number" style={{width: '60px'}} value={data.hullCurrent} onChange={e => handleChange('hullCurrent', parseInt(e.target.value) || 0)} /> / <input type="number" style={{width: '60px'}} value={data.hullMax} onChange={e => handleChange('hullMax', parseInt(e.target.value) || 0)} />
                    ARMOUR: <input type="number" style={{width: '40px'}} value={data.armor} onChange={e => handleChange('armor', parseInt(e.target.value) || 0)} />
                 </div>
              </div>
              <div className="ship-field-row" style={{ gridColumn: 'span 2' }}>
                 <div className="ship-field-inline" style={{flex: 1}}>
                    CLASS: <input type="text" value={data.shipClass} onChange={e => handleChange('shipClass', e.target.value)} style={{flex: 1, minWidth: '50px'}} />
                 </div>
                 <div className="ship-field-inline">
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
                    <div className="ship-field-row">Fuel: <input type="number" style={{width:'80px'}} value={data.finances.fuelCost} onChange={e => handleChange('finances', {...data.finances, fuelCost: parseInt(e.target.value)||0})} /></div>
                    <div className="ship-field-row">Mortg: <input type="number" style={{width:'80px'}} value={data.finances.mortgage} onChange={e => handleChange('finances', {...data.finances, mortgage: parseInt(e.target.value)||0})} /></div>
                    <div className="ship-field-row">LifeSup: <input type="number" style={{width:'80px'}} value={data.finances.lifeSupport} onChange={e => handleChange('finances', {...data.finances, lifeSupport: parseInt(e.target.value)||0})} /></div>
                    <div className="ship-field-row">Salary: <input type="number" style={{width:'80px'}} value={data.finances.salaries} onChange={e => handleChange('finances', {...data.finances, salaries: parseInt(e.target.value)||0})} /></div>
                    <div className="ship-field-row">Maint: <input type="number" style={{width:'80px'}} value={data.finances.maintenance} onChange={e => handleChange('finances', {...data.finances, maintenance: parseInt(e.target.value)||0})} /></div>
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
                Cr <input 
                type="number" 
                value={data.credits} 
                onChange={e => handleChange('credits', parseInt(e.target.value) || 0)}
                style={{ fontSize: '1.4rem', width: '100%' }} 
                />
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
                                  updateData({ 
                                    passengers: remaining,
                                    availableStaterooms: data.availableStaterooms + p.staterooms,
                                    availableLowBerths: data.availableLowBerths + p.lowBerths,
                                    availableCargoTons: data.availableCargoTons + p.cargo,
                                    credits: data.credits - p.revenue
                                  });
                                }}
                                style={{ padding: '2px 5px', fontSize: '0.8rem', marginTop: '5px', borderColor: '#ff6666', color: '#ff6666' }}>
                                Refund
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
                                  updateData({ 
                                    freightLots: remaining,
                                    availableCargoTons: data.availableCargoTons + f.tons,
                                    credits: data.credits - f.revenue
                                  });
                                }}
                                style={{ padding: '2px 5px', fontSize: '0.8rem', marginTop: '5px', borderColor: '#ff6666', color: '#ff6666' }}>
                                Refund
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
                            </div>
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
      </div>
  );
}
