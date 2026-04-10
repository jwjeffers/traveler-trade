import { useState } from 'react';
import type { ShipData, LedgerEntry, FreightLot, TradeGoodItem, Passenger, MiscCargoItem } from './ShipStatus';
import { audioService } from './audioService';
import { TRADE_GOODS } from './tradeGoodsData';

interface InventoryManagerProps {
  shipData: ShipData;
  updateShipData: (updates: Partial<ShipData>) => void;
}

export function InventoryManager({ shipData, updateShipData }: InventoryManagerProps) {
  const [category, setCategory] = useState<'Passenger' | 'Freight' | 'Trade' | 'Misc'>('Misc');
  
  // Generic fields
  const [description, setDescription] = useState('');
  const [tons, setTons] = useState('');
  
  // Trade Good fields
  const [tradeGoodSelection, setTradeGoodSelection] = useState<string>('Custom'); // "Custom" or a D66 string
  const [tradePrice, setTradePrice] = useState('');

  // Passenger fields
  const [passengerType, setPassengerType] = useState('High'); // High, Middle, Basic, Low
  const [staterooms, setStaterooms] = useState('');
  const [lowBerths, setLowBerths] = useState('');

  // Finance Fields
  const [financeImpact, setFinanceImpact] = useState<'None' | 'Income' | 'Expense'>('None');
  const [financeAmount, setFinanceAmount] = useState('');

  const [popupMessage, setPopupMessage] = useState('');

  const handleSubmit = () => {
    audioService.playClick();
    
    // Parse common numbers
    let reqTons = parseInt(tons) || 0;
    const reqAmount = parseInt(financeAmount) || 0;
    const reqStaterooms = parseInt(staterooms) || 0;
    const reqLowBerths = parseInt(lowBerths) || 0;

    // Validate based on category limits
    if (category !== 'Passenger' && reqTons > shipData.availableCargoTons) {
      setPopupMessage(`[ ERROR ] Insufficient cargo space. Only ${shipData.availableCargoTons}T available.`);
      audioService.playError();
      return;
    }

    if (category === 'Passenger') {
      if (reqStaterooms > shipData.availableStaterooms) {
        setPopupMessage(`[ ERROR ] Insufficient staterooms. Only ${shipData.availableStaterooms} available.`);
        audioService.playError();
        return;
      }
      if (reqLowBerths > shipData.availableLowBerths) {
        setPopupMessage(`[ ERROR ] Insufficient low berths. Only ${shipData.availableLowBerths} available.`);
        audioService.playError();
        return;
      }
      if (reqTons > shipData.availableCargoTons) { // passengers can bring cargo
        setPopupMessage(`[ ERROR ] Insufficient cargo space for passenger luggage.`);
        audioService.playError();
        return;
      }
    }

    // Validate Finance
    if (financeImpact === 'Expense' && reqAmount > shipData.credits) {
      setPopupMessage(`[ ERROR ] Insufficient corporate funds to log this expense.`);
      audioService.playError();
      return;
    }

    if (!description && category !== 'Trade') {
      setPopupMessage(`[ ERROR ] Description is required.`);
      audioService.playError();
      return;
    }

    // Construct Ledger if necessary
    let newLedger: LedgerEntry | null = null;
    let newCredits = shipData.credits;
    if (financeImpact !== 'None' && reqAmount > 0) {
      if (financeImpact === 'Expense') {
        newCredits -= reqAmount;
      } else {
        newCredits += reqAmount;
      }
      newLedger = {
        id: 'cust-' + Date.now(),
        timestamp: new Date().toISOString(),
        type: financeImpact,
        amount: reqAmount,
        description: `Custom ${financeImpact === 'Income' ? 'Revenue' : 'Expense'}: ${description || 'Inventory Update'}`
      };
    }

    // Prepare Updates
    let updates: Partial<ShipData> = {
      credits: newCredits,
      availableCargoTons: shipData.availableCargoTons - reqTons,
      ledgers: newLedger ? [...(shipData.ledgers || []), newLedger] : shipData.ledgers
    };

    // Inject the specific Object
    const uid = 'item-' + Date.now() + Math.random();
    if (category === 'Passenger') {
      const newPassenger: Passenger = {
        id: uid,
        name: description,
        type: passengerType,
        revenue: financeImpact === 'Income' ? reqAmount : 0,
        staterooms: reqStaterooms,
        lowBerths: reqLowBerths,
        cargo: reqTons
      };
      updates.passengers = [...(shipData.passengers || []), newPassenger];
      updates.availableStaterooms = shipData.availableStaterooms - reqStaterooms;
      updates.availableLowBerths = shipData.availableLowBerths - reqLowBerths;
    } 
    else if (category === 'Freight') {
      const newFreight: FreightLot = {
        id: uid,
        type: description,
        tons: reqTons,
        revenue: financeImpact === 'Income' ? reqAmount : 0,
        shipper: 'Custom Entry'
      };
      updates.freightLots = [...(shipData.freightLots || []), newFreight];
    }
    else if (category === 'Misc') {
      const newMisc: MiscCargoItem = {
        id: uid,
        description: description,
        tons: reqTons
      };
      updates.miscCargo = [...(shipData.miscCargo || []), newMisc];
    }
    else if (category === 'Trade') {
      let finalD66: number | string = 'CUST';
      let finalType = description || 'Custom Trade Good';
      if (tradeGoodSelection !== 'Custom') {
        const found = TRADE_GOODS.find(g => g.d66.toString() === tradeGoodSelection);
        if (found) {
          finalD66 = found.d66;
          finalType = found.type;
        }
      }

      const newTrade: TradeGoodItem = {
        id: uid,
        d66: finalD66,
        type: finalType,
        tons: reqTons,
        purchasePrice: parseInt(tradePrice) || 0
      };
      updates.tradeGoods = [...(shipData.tradeGoods || []), newTrade];
    }

    updateShipData(updates);
    audioService.playConfirm();
    
    // Reset inputs
    setDescription('');
    setTons('');
    setFinanceAmount('');
    setStaterooms('');
    setLowBerths('');
    setTradePrice('');
    setPopupMessage('[ SUCCESS ] Inventory manifests and ledgers synchronized.');
  };

  return (
    <div className="panel" data-title="[ INVENTORY MANAGER ]">
      <p style={{ color: 'var(--color-phosphor-dim)', marginBottom: '20px' }}>
        Force-inject arbitrary manifests, personnel, or speculative materials directly into ship systems.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '20px' }}>
        
        {/* Left Col: Category Selector */}
        <div style={{ borderRight: '1px solid var(--color-phosphor)', paddingRight: '20px' }}>
           <label style={{ display: 'block', marginBottom: '10px', color: 'var(--color-phosphor)' }}>CATEGORY OVERRIDE</label>
           {['Passenger', 'Freight', 'Trade', 'Misc'].map(cat => (
             <button
               key={cat}
               onClick={() => { setCategory(cat as any); audioService.playClick(); }}
               style={{ 
                 display: 'block', width: '100%', marginBottom: '10px', textAlign: 'left',
                 background: category === cat ? 'var(--color-phosphor)' : 'transparent',
                 color: category === cat ? 'var(--color-bg)' : 'var(--color-phosphor)'
               }}
             >
               {cat.toUpperCase()}
             </button>
           ))}
        </div>

        {/* Right Col: Fields */}
        <div>
          {/* Passenger Fields */}
          {category === 'Passenger' && (
            <>
              <div className="ship-field-row" style={{ marginBottom: '15px' }}>
                <span>Passenger / Log Name:</span>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Imperial Attaché" />
              </div>
              <div className="ship-field-row" style={{ marginBottom: '15px' }}>
                <span>Ticket Class:</span>
                <select value={passengerType} onChange={e => setPassengerType(e.target.value)}>
                  <option value="High">High</option>
                  <option value="Middle">Middle</option>
                  <option value="Basic">Basic</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="ship-field-row" style={{ marginBottom: '15px' }}>
                <span>Deduct Staterooms:</span>
                <input type="number" min="0" value={staterooms} onChange={e => setStaterooms(e.target.value)} />
              </div>
              <div className="ship-field-row" style={{ marginBottom: '15px' }}>
                <span>Deduct Low Berths:</span>
                <input type="number" min="0" value={lowBerths} onChange={e => setLowBerths(e.target.value)} />
              </div>
              <div className="ship-field-row" style={{ marginBottom: '0px' }}>
                <span>Luggage (Cargo Tons):</span>
                <input type="number" min="0" value={tons} onChange={e => setTons(e.target.value)} />
              </div>
            </>
          )}

          {/* Freight & Misc Fields */}
          {(category === 'Freight' || category === 'Misc') && (
            <>
              <div className="ship-field-row" style={{ marginBottom: '15px' }}>
                <span>{category === 'Freight' ? 'Freight Description:' : 'Item Description:'}</span>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder={category === 'Freight' ? 'e.g. Farm Machinery' : 'e.g. Scavenged Ship Parts'} />
              </div>
              <div className="ship-field-row" style={{ marginBottom: '0px' }}>
                <span>Mass (Cargo Tons):</span>
                <input type="number" min="0" value={tons} onChange={e => setTons(e.target.value)} />
              </div>
            </>
          )}

          {/* Trade Game Fields */}
          {category === 'Trade' && (
            <>
              <div className="ship-field-row" style={{ marginBottom: '15px' }}>
                <span>Trade Good Type:</span>
                <select value={tradeGoodSelection} onChange={e => setTradeGoodSelection(e.target.value)}>
                  <option value="Custom">-- Custom Code [CUST] --</option>
                  {TRADE_GOODS.map(g => (
                    <option key={g.d66} value={g.d66}>[{g.d66}] {g.type}</option>
                  ))}
                </select>
              </div>
              {tradeGoodSelection === 'Custom' && (
                <div className="ship-field-row" style={{ marginBottom: '15px' }}>
                  <span>Custom Type Name:</span>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Unsanctioned Alien Relics" />
                </div>
              )}
              <div className="ship-field-row" style={{ marginBottom: '15px' }}>
                <span>Lot Mass (Tons):</span>
                <input type="number" min="0" value={tons} onChange={e => setTons(e.target.value)} />
              </div>
              <div className="ship-field-row" style={{ marginBottom: '0px' }}>
                <span>Purchased At (Cr/Ton):</span>
                <input type="number" min="0" value={tradePrice} onChange={e => setTradePrice(e.target.value)} />
              </div>
            </>
          )}

          {/* Finance Block */}
          <div style={{ marginTop: '30px', padding: '15px', border: '1px dashed var(--color-phosphor-dim)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: 'var(--color-phosphor)' }}>ACCOUNT LEDGER OVERRIDE</h3>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
               {['None', 'Income', 'Expense'].map(f => (
                 <button
                   key={f}
                   onClick={() => setFinanceImpact(f as any)}
                   style={{
                     flex: 1,
                     padding: '5px',
                     borderColor: financeImpact === f ? (f === 'Expense' ? '#ff5555' : f === 'Income' ? '#00ff00' : 'var(--color-phosphor)') : 'var(--color-phosphor-dim)',
                     color: financeImpact === f ? (f === 'Expense' ? '#ff5555' : f === 'Income' ? '#00ff00' : 'var(--color-phosphor)') : 'var(--color-phosphor-dim)'
                   }}
                 >
                   {f.toUpperCase()}
                 </button>
               ))}
            </div>
            {financeImpact !== 'None' && (
              <div className="ship-field-row">
                <span style={{ color: financeImpact === 'Expense' ? '#ff5555' : '#00ff00' }}>
                  {financeImpact === 'Expense' ? 'Total Cost (Cr):' : 'Total Revenue (Cr):'}
                </span>
                <input type="number" min="0" value={financeAmount} onChange={e => setFinanceAmount(e.target.value)} />
              </div>
            )}
          </div>

          <button onClick={handleSubmit} style={{ marginTop: '20px', width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold' }}>
            INJECT MANIFEST RECORD
          </button>
        </div>
      </div>

      {/* Error Popup overlay */}
      {popupMessage && (
        <div 
           style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
           onClick={() => setPopupMessage('')}>
          <div className="panel" onClick={e => e.stopPropagation()} style={{ border: `2px solid ${popupMessage.includes('ERROR') ? '#ff5555' : '#00ff00'}`, boxShadow: `0 0 30px ${popupMessage.includes('ERROR') ? 'rgba(255, 85, 85, 0.4)' : 'rgba(0, 255, 0, 0.4)'}`, background: '#050000', padding: '30px', maxWidth: '500px', textAlign: 'center' }}>
            <h2 style={{ color: popupMessage.includes('ERROR') ? '#ff5555' : '#00ff00', marginTop: 0, letterSpacing: '2px' }}>
              {popupMessage.includes('ERROR') ? 'SYSTEM ALERT' : 'RECORD APPENDED'}
            </h2>
            <div style={{ fontSize: '1.2rem', margin: '30px 0', color: 'var(--color-phosphor)' }}>
              {popupMessage}
            </div>
            <div style={{ marginTop: '30px' }}>
              <button 
                onClick={() => { setPopupMessage(''); audioService.playClick(); }}
                style={{ borderColor: popupMessage.includes('ERROR') ? '#ff5555' : '#00ff00', color: popupMessage.includes('ERROR') ? '#ff5555' : '#00ff00', padding: '10px 40px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                ACKNOWLEDGE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
