import { useState } from 'react';
import { TRADE_GOODS, MODIFIED_PRICE_TABLE, type TradeCode, type TradeGood } from './tradeGoodsData';
import { audioService } from './audioService';
import { useShipData } from './useShipData';

const ALL_CODES: TradeCode[] = ['Ag', 'As', 'Ba', 'De', 'Fl', 'Ga', 'Hi', 'Ht', 'Ic', 'In', 'Lo', 'Lt', 'Na', 'Ni', 'Po', 'Ri', 'Wa', 'Va', 'Amber', 'Red'];

function parseTradeCodes(uwp: string): TradeCode[] {
  const codes = new Set<TradeCode>();
  if (!uwp || uwp.length < 7) return [];
  
  const size = parseInt(uwp[1], 16);
  const atmo = parseInt(uwp[2], 16);
  const hydro = parseInt(uwp[3], 16);
  const pop = parseInt(uwp[4], 16);
  const gov = parseInt(uwp[5], 16);
  const law = parseInt(uwp[6], 16);
  const tl = uwp.length > 8 ? parseInt(uwp[8], 16) : 0;
  
  if (atmo >= 4 && atmo <= 9 && hydro >= 4 && hydro <= 8 && pop >= 5 && pop <= 7) codes.add('Ag');
  if (size === 0 && atmo === 0 && hydro === 0) codes.add('As');
  if (pop === 0 && gov === 0 && law === 0) codes.add('Ba');
  if (atmo >= 2 && atmo <= 9 && hydro === 0) codes.add('De');
  if (atmo >= 10 && hydro >= 1) codes.add('Fl');
  if (size >= 5 && atmo >= 4 && atmo <= 9 && hydro >= 4 && hydro <= 8) codes.add('Ga');
  if (pop >= 9) codes.add('Hi');
  if (tl >= 12) codes.add('Ht');
  if (atmo <= 1 && hydro >= 1) codes.add('Ic');
  if ([0, 1, 2, 4, 7, 9].includes(atmo) && pop >= 9) codes.add('In');
  if (pop >= 1 && pop <= 3) codes.add('Lo');
  if (tl <= 5) codes.add('Lt');
  if (atmo >= 0 && atmo <= 3 && hydro >= 0 && hydro <= 3 && pop >= 6) codes.add('Na');
  if (pop >= 4 && pop <= 6) codes.add('Ni');
  if (atmo >= 2 && atmo <= 5 && hydro >= 0 && hydro <= 3) codes.add('Po');
  if ([6, 8].includes(atmo) && pop >= 6 && pop <= 8 && [4, 9].includes(gov)) codes.add('Ri');
  if (hydro === 10) codes.add('Wa');
  if (atmo === 0) codes.add('Va');
  return Array.from(codes);
}

function calculateDM(dms: {code: TradeCode, bonus: number}[], activeCodes: TradeCode[]) {
  let highest = -999;
  for (const dm of dms) {
    if (activeCodes.includes(dm.code)) {
      if (dm.bonus > highest) highest = dm.bonus;
    }
  }
  return highest === -999 ? 0 : highest;
}

export function SpeculativeTrade() {
  const [sourceUwp, setSourceUwp] = useState('');
  const [destUwp, setDestUwp] = useState('');
  
  const [sourceCodes, setSourceCodes] = useState<TradeCode[]>([]);
  const [destCodes, setDestCodes] = useState<TradeCode[]>([]);
  
  const [brokerSkill, setBrokerSkill] = useState<number>(0);
  const [supplierBroker, setSupplierBroker] = useState<number>(0);
  const [buyerBroker, setBuyerBroker] = useState<number>(0);

  const [selectedGood, setSelectedGood] = useState<TradeGood | null>(null);
  
  // Purchase State
  const [purchaseRoll, setPurchaseRoll] = useState<number>(0);
  
  // Sale State
  const [saleRoll, setSaleRoll] = useState<number>(0);
  const [showLegend, setShowLegend] = useState(false);

  const handleSourceUwp = (val: string) => {
    setSourceUwp(val);
    const codes = parseTradeCodes(val);
    setSourceCodes(codes);
    audioService.playKeystroke();
  };

  const handleDestUwp = (val: string) => {
    setDestUwp(val);
    const codes = parseTradeCodes(val);
    setDestCodes(codes);
    audioService.playKeystroke();
  };

  const toggleSourceCode = (code: TradeCode) => {
    setSourceCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
    audioService.playClick();
  };

  const toggleDestCode = (code: TradeCode) => {
    setDestCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
    audioService.playClick();
  };

  const roll3D = () => {
    return Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
  };

  const doPurchaseRoll = () => {
    if (!selectedGood) return;
    const baseRoll = roll3D();
    const purchaseDm = calculateDM(selectedGood.purchaseDMs, sourceCodes);
    const saleDm = calculateDM(selectedGood.saleDMs, sourceCodes); // Rule: minus supplier sale DM? "any DM from Sale column"
    // Wait, Purchase Roll = 3D + Broker + Purchase DM - Sale DM (using source codes) - Supplier Broker
    const finalRoll = baseRoll + brokerSkill + purchaseDm - saleDm - supplierBroker;
    setPurchaseRoll(finalRoll);
    audioService.playConfirm();
  };

  const doSaleRoll = () => {
    if (!selectedGood) return;
    const baseRoll = roll3D();
    const saleDm = calculateDM(selectedGood.saleDMs, destCodes);
    const purchaseDm = calculateDM(selectedGood.purchaseDMs, destCodes);
    // Sale Roll = 3D + Broker + Sale DM - Purchase DM (using dest codes) - Buyer Broker
    const finalRoll = baseRoll + brokerSkill + saleDm - purchaseDm - buyerBroker;
    setSaleRoll(finalRoll);
    audioService.playConfirm();
  };

  const getPriceMultiplier = (roll: number) => {
    const entry = MODIFIED_PRICE_TABLE.find(t => roll <= t.maxBound);
    if (!entry) return MODIFIED_PRICE_TABLE[MODIFIED_PRICE_TABLE.length - 1];
    return entry;
  };

  return (
    <div className="panel" data-title="[ SPECULATIVE TRADE ]">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        
        {/* Source Market */}
        <div style={{ border: '1px solid var(--color-phosphor-dim)', padding: '15px' }}>
          <h3 style={{ marginTop: 0, color: 'var(--color-phosphor)' }}>SOURCE MARKET</h3>
          
          <div className="ship-field-row">
             <span>Quick Parse UWP:</span>
             <input type="text" value={sourceUwp} onChange={e => handleSourceUwp(e.target.value.toUpperCase())} placeholder="e.g. A788899-A" style={{width: '120px'}}/>
          </div>
          <div style={{ marginTop: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '1rem', color: 'var(--color-phosphor-dim)' }}>Active Trade Codes:</span>
              <button 
                onClick={() => { setShowLegend(true); audioService.playClick(); }}
                style={{ padding: '2px 8px', fontSize: '0.9rem', borderColor: 'var(--color-phosphor-dim)', color: 'var(--color-phosphor-dim)' }}
              >[?]</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {ALL_CODES.map(c => (
                <button 
                  key={c} 
                  onClick={() => toggleSourceCode(c)}
                  style={{ 
                    padding: '6px 12px', fontSize: '1rem', fontWeight: 'bold', minWidth: '45px', textAlign: 'center',
                    background: sourceCodes.includes(c) ? 'var(--color-phosphor)' : 'transparent',
                    color: sourceCodes.includes(c) ? 'var(--color-bg)' : 'var(--color-phosphor-dim)',
                    borderColor: 'var(--color-phosphor-dim)'
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
             <div className="ship-field-row">
               <span>Player Broker:</span>
               <input type="number" value={brokerSkill} onChange={e => setBrokerSkill(parseInt(e.target.value)||0)} style={{width: '60px'}}/>
             </div>
             <div className="ship-field-row">
               <span>Supplier Broker:</span>
               <input type="number" value={supplierBroker} onChange={e => setSupplierBroker(parseInt(e.target.value)||0)} style={{width: '60px'}}/>
             </div>
          </div>
        </div>

        {/* Dest Market */}
        <div style={{ border: '1px solid var(--color-phosphor-dim)', padding: '15px' }}>
           <h3 style={{ marginTop: 0, color: '#dca3ff' }}>DESTINATION MARKET</h3>
           <div className="ship-field-row">
             <span>Quick Parse UWP:</span>
             <input type="text" value={destUwp} onChange={e => handleDestUwp(e.target.value.toUpperCase())} placeholder="e.g. C543211-5" style={{width: '120px', borderColor: '#dca3ff'}}/>
          </div>
          <div style={{ marginTop: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '1rem', color: 'var(--color-phosphor-dim)' }}>Active Trade Codes:</span>
              <button 
                onClick={() => { setShowLegend(true); audioService.playClick(); }}
                style={{ padding: '2px 8px', fontSize: '0.9rem', borderColor: 'var(--color-phosphor-dim)', color: 'var(--color-phosphor-dim)' }}
              >[?]</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {ALL_CODES.map(c => (
                <button 
                  key={c} 
                  onClick={() => toggleDestCode(c)}
                  style={{ 
                    padding: '6px 12px', fontSize: '1rem', fontWeight: 'bold', minWidth: '45px', textAlign: 'center',
                    background: destCodes.includes(c) ? '#dca3ff' : 'transparent',
                    color: destCodes.includes(c) ? '#050000' : '#dca3ff',
                    borderColor: '#dca3ff'
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
             <div className="ship-field-row">
               <span>Player Broker:</span>
               <input type="number" value={brokerSkill} onChange={e => setBrokerSkill(parseInt(e.target.value)||0)} style={{width: '60px'}}/>
             </div>
             <div className="ship-field-row">
               <span>Buyer Broker:</span>
               <input type="number" value={buyerBroker} onChange={e => setBuyerBroker(parseInt(e.target.value)||0)} style={{width: '60px'}}/>
             </div>
          </div>
        </div>
      </div>

      {/* CALCULATOR PANEL */}
      {selectedGood && (
        <div style={{ padding: '15px', border: '1px solid #00ff00', marginBottom: '20px', background: 'rgba(0,255,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#00ff00' }}>[ {selectedGood.d66} ] {selectedGood.type.toUpperCase()}</h3>
            <button onClick={() => { setSelectedGood(null); audioService.playClick(); }} style={{ padding: '2px 8px', borderColor: '#00ff00', color: '#00ff00' }}>CLOSE</button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-phosphor-dim)' }}>Qty: {selectedGood.tons} Tons | Base: Cr {selectedGood.basePrice.toLocaleString()}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
             {/* Purchase Column */}
             <div style={{ borderTop: '1px dashed var(--color-phosphor-dim)', paddingTop: '10px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Source Purch DM: {calculateDM(selectedGood.purchaseDMs, sourceCodes)}</span>
                  <span>Source Sale DM: -{calculateDM(selectedGood.saleDMs, sourceCodes)}</span>
               </div>
               <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                 <button onClick={doPurchaseRoll} style={{ flex: 1, borderColor: '#00ff00' }}>ROLL PURCHASE (3D)</button>
                 {purchaseRoll !== 0 && (
                   <div style={{ background: 'var(--color-phosphor)', color: 'var(--color-bg)', padding: '5px 10px', fontWeight: 'bold' }}>
                     {purchaseRoll}
                   </div>
                 )}
               </div>
               {purchaseRoll !== 0 && (
                 <div style={{ marginTop: '10px', fontSize: '1.2rem', color: '#00ff00' }}>
                   Cost: Cr {Math.round(selectedGood.basePrice * getPriceMultiplier(purchaseRoll).purchase).toLocaleString()} / Ton <span style={{fontSize: '0.8rem'}}>({Math.round(getPriceMultiplier(purchaseRoll).purchase * 100)}%)</span>
                 </div>
               )}
             </div>

             {/* Sale Column */}
             <div style={{ borderTop: '1px dashed #dca3ff', paddingTop: '10px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dca3ff' }}>
                  <span>Dest Sale DM: {calculateDM(selectedGood.saleDMs, destCodes)}</span>
                  <span>Dest Purch DM: -{calculateDM(selectedGood.purchaseDMs, destCodes)}</span>
               </div>
               <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                 <button onClick={doSaleRoll} style={{ flex: 1, borderColor: '#dca3ff', color: '#dca3ff' }}>ROLL SALE (3D)</button>
                 {saleRoll !== 0 && (
                   <div style={{ background: '#dca3ff', color: '#050000', padding: '5px 10px', fontWeight: 'bold' }}>
                     {saleRoll}
                   </div>
                 )}
               </div>
               {saleRoll !== 0 && (
                 <div style={{ marginTop: '10px', fontSize: '1.2rem', color: '#dca3ff' }}>
                   Sell: Cr {Math.round(selectedGood.basePrice * getPriceMultiplier(saleRoll).sale).toLocaleString()} / Ton <span style={{fontSize: '0.8rem'}}>({Math.round(getPriceMultiplier(saleRoll).sale * 100)}%)</span>
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div style={{ overflowY: 'auto', maxHeight: '500px', border: '1px solid var(--color-phosphor-dim)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg)', zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid var(--color-phosphor)' }}>
              <th style={{ padding: '8px' }}>D66</th>
              <th style={{ padding: '8px' }}>Type</th>
              <th style={{ padding: '8px' }}>Base Cr</th>
              <th style={{ padding: '8px' }}>Source Purch DM</th>
              <th style={{ padding: '8px', color: '#dca3ff' }}>Dest Sale DM</th>
              <th style={{ padding: '8px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {TRADE_GOODS.map(g => {
              const srcDm = calculateDM(g.purchaseDMs, sourceCodes);
              const destDm = calculateDM(g.saleDMs, destCodes);
              const isCommon = g.availability === 'All';
              
              // Determine if good is naturally available at source based on Trade Codes
              let isSourceAvail = isCommon;
              if (Array.isArray(g.availability)) {
                if (g.availability.some(a => sourceCodes.includes(a))) isSourceAvail = true;
              }

              return (
                <tr key={g.d66} style={{ 
                  borderBottom: '1px solid var(--color-phosphor-dim)', 
                  opacity: g.d66 === 66 ? 0.3 : 1,
                  background: selectedGood?.d66 === g.d66 ? 'rgba(0,255,0,0.1)' : 'transparent'
                }}>
                  <td style={{ padding: '8px' }}>{g.d66}</td>
                  <td style={{ padding: '8px' }}>
                    {g.type}
                    {g.isIllegal && <span style={{ color: '#ff5555', marginLeft: '5px' }}>[ILGL]</span>}
                    {isSourceAvail ? <span style={{ color: '#00ff00', marginLeft: '5px', fontSize:'0.7rem' }}>[LOCAL]</span> : null}
                  </td>
                  <td style={{ padding: '8px' }}>{g.basePrice.toLocaleString()}</td>
                  <td style={{ padding: '8px', color: srcDm > 0 ? '#00ff00' : 'var(--color-phosphor)' }}>{srcDm > 0 ? `+${srcDm}` : srcDm}</td>
                  <td style={{ padding: '8px', color: destDm > 0 ? '#dca3ff' : 'var(--color-phosphor)' }}>{destDm > 0 ? `+${destDm}` : destDm}</td>
                  <td style={{ padding: '8px' }}>
                    {g.d66 !== 66 && (
                      <button 
                        onClick={() => { 
                          setSelectedGood(g); 
                          setPurchaseRoll(0); 
                          setSaleRoll(0); 
                          audioService.playKeystroke(); 
                        }} 
                        style={{ padding: '2px 5px', fontSize: '0.8rem' }}>
                        SELECT
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* LEGEND MODAL */}
      {showLegend && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="panel" style={{ maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid var(--color-phosphor)', background: '#050000', padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--color-phosphor)', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, color: 'var(--color-phosphor)' }}>TRADE CODE GLOSSARY</h2>
              <button onClick={() => { setShowLegend(false); audioService.playClick(); }} style={{ padding: '5px 15px', borderColor: 'var(--color-phosphor)' }}>CLOSE</button>
            </div>
            
            <div style={{ fontSize: '0.9rem', color: 'var(--color-phosphor-dim)', lineHeight: '1.4' }}>
              <h3 style={{ color: '#00ff00', marginTop: '15px', marginBottom: '5px' }}>Planetary Economies</h3>
              <p><b>Ag (Agricultural):</b> Bountiful environments. Specialize in farming and mass food production.</p>
              <p><b>In (Industrial):</b> Densely populated worlds focused on heavy manufacturing and machinery.</p>
              <p><b>Na (Non-Agricultural):</b> Worlds where farming on a large scale is impossible; must import food.</p>
              <p><b>Ni (Non-Industrial):</b> Developing or sparsely populated worlds lacking heavy industry.</p>
              <p><b>Ri (Rich):</b> Prosperous worlds with high living standards. Great for luxury goods.</p>
              <p><b>Po (Poor):</b> Disadvantaged worlds struggling to survive; only afford cheap essentials.</p>

              <h3 style={{ color: '#00ff00', marginTop: '20px', marginBottom: '5px' }}>Demographics & Technology</h3>
              <p><b>Hi (High Population):</b> Billions of residents. Huge consumers of raw materials.</p>
              <p><b>Lo (Low Population):</b> Outposts or colonies with less than ten thousand inhabitants.</p>
              <p><b>Ht (High Tech):</b> TL 12+. Required for state-of-the-art cybernetics and weaponry.</p>
              <p><b>Lt (Low Tech):</b> TL 5-. Primitive worlds where basic modern tech is incredibly valuable.</p>
              <p><b>Ba (Barren):</b> Dead worlds with zero population, government, and law.</p>

              <h3 style={{ color: '#00ff00', marginTop: '20px', marginBottom: '5px' }}>Biospheres & Geography</h3>
              <p><b>As (Asteroid):</b> Zero-G mining belts. Excellent for ore/gem extraction, require survival imports.</p>
              <p><b>De (Desert):</b> Worlds completely lacking surface water. Water and wood command massive premiums.</p>
              <p><b>Fl (Fluid Oceans):</b> Worlds with exotic, non-water oceans (e.g., methane). Good for petrochemicals.</p>
              <p><b>Ga (Garden):</b> Near-perfect Earth-like worlds, highly valued for biological exports.</p>
              <p><b>Ic (Ice-Capped):</b> Frozen planets locked in eternal winter with frozen oceans.</p>
              <p><b>Wa (Water World):</b> Planets composed almost entirely of deep oceans with no landmasses.</p>
              <p><b>Va (Vacuum):</b> Worlds completely devoid of any atmosphere. Requires domes/bunkers.</p>

              <h3 style={{ color: '#ff5555', marginTop: '20px', marginBottom: '5px' }}>Travel Advisories (TAS Zones)</h3>
              <p><b>Amber (Amber Zone):</b> Dangerous worlds (weather, war, or laws). Trade is risky but lucrative.</p>
              <p><b>Red (Red Zone):</b> Interdicted worlds. Travel is illegal; trade here is high-risk smuggling.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
