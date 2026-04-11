
import type { CrewMember, CharacterData } from './ShipStatus';

const calculateDM = (stat: number) => Math.floor((stat - 6) / 2);
const formatDM = (dm: number) => dm >= 0 ? `+${dm}` : `${dm}`;

export function CharacterSheet({ crew, updateCrew }: { crew: CrewMember, updateCrew: (updates: Partial<CrewMember>) => void }) {
  
  const DEFAULT_SKILL_NAMES = [
    'Admin', 'Advocate', 'Animals', 'Art', 'Astrogation', 'Athletics', 'Broker', 
    'Carouse', 'Deception', 'Diplomat', 'Drive', 'Electronics', 'Flyer', 'Gambler', 
    'Gun Combat', 'Gunner', 'Heavy Weapons', 'Investigate', 'Jack-of-All-Trades', 
    'Language', 'Leadership', 'Mechanic', 'Melee', 'Medic', 'Navigation', 
    'Persuade', 'Pilot', 'Profession', 'Recon', 'Science', 'Seafarer', 'Stealth', 
    'Steward', 'Streetwise', 'Survival', 'Tactics', 'Vacc Suit'
  ];

  // Ensure the character has standard baseline character data before rendering.
  const data: CharacterData = crew.characterData || {
    title: '', age: '', species: '', homeworld: '', traits: '',
    str: 7, dex: 7, end: 7, int: 7, edu: 7, soc: 7,
    skills: [],
    equipment: '', weapons: '', armor: '', augments: '', 
    trainingSkill: '', trainingWeeks: '', trainingPeriods: '',
    wounds: '', careers: '', history: '', allies: '', contacts: '', rivals: '', enemies: '',
    personalCredits: 0
  };

  const hydratedSkills = DEFAULT_SKILL_NAMES.map((name, i) => {
    const existing = (data.skills || []).find(s => s.name === name);
    return existing || { id: name + '-' + i, name, level: 0 };
  });

  (data.skills || []).forEach(s => {
    if (!DEFAULT_SKILL_NAMES.includes(s.name)) {
      hydratedSkills.push(s);
    }
  });

  // Sort them alphabetically for a cleaner look
  hydratedSkills.sort((a, b) => a.name.localeCompare(b.name));

  const updateChar = (updates: Partial<CharacterData>) => {
    updateCrew({ characterData: { ...data, ...updates } });
  };

  const updateSkill = (id: string, field: 'level', val: any) => {
    updateChar({ skills: hydratedSkills.map(s => s.id === id ? { ...s, [field]: val } : s) });
  };

  return (
    <div className="panel" data-title={`[ PERSONAL DATA FILE: ${crew.name.toUpperCase()} ]`} style={{ padding: '20px' }}>
      
      {/* HEADER BLOCK */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', borderBottom: '1px solid var(--color-phosphor-dim)', paddingBottom: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 2, minWidth: '300px' }}>
          <h3 style={{ marginTop: 0, color: 'var(--color-phosphor)', borderBottom: '1px solid var(--color-phosphor)', display: 'inline-block' }}>BASIC INFO</h3>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><span style={{ display: 'inline-block', width: '120px', color: 'var(--color-phosphor-dim)' }}>NAME:</span> <input type="text" value={crew.name} onChange={e => updateCrew({ name: e.target.value })} style={{ flex: 1, borderBottom: '1px dashed var(--color-phosphor-dim)' }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><span style={{ display: 'inline-block', width: '120px', color: 'var(--color-phosphor-dim)' }}>TITLE/RANK:</span> <input type="text" value={data.title} onChange={e => updateChar({ title: e.target.value })} style={{ flex: 1, borderBottom: '1px dashed var(--color-phosphor-dim)' }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><span style={{ display: 'inline-block', width: '120px', color: 'var(--color-phosphor-dim)' }}>AGE:</span> <input type="text" value={data.age} onChange={e => updateChar({ age: e.target.value })} style={{ flex: 1, borderBottom: '1px dashed var(--color-phosphor-dim)' }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><span style={{ display: 'inline-block', width: '120px', color: 'var(--color-phosphor-dim)' }}>SPECIES:</span> <input type="text" value={data.species} onChange={e => updateChar({ species: e.target.value })} style={{ flex: 1, borderBottom: '1px dashed var(--color-phosphor-dim)' }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><span style={{ display: 'inline-block', width: '120px', color: 'var(--color-phosphor-dim)' }}>HOMEWORLD:</span> <input type="text" value={data.homeworld} onChange={e => updateChar({ homeworld: e.target.value })} style={{ flex: 1, borderBottom: '1px dashed var(--color-phosphor-dim)' }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><span style={{ display: 'inline-block', width: '120px', color: 'var(--color-phosphor-dim)' }}>TRAITS:</span> <input type="text" value={data.traits} onChange={e => updateChar({ traits: e.target.value })} style={{ flex: 1, borderBottom: '1px dashed var(--color-phosphor-dim)' }} /></div>
        </div>

        <div style={{ flex: 1, minWidth: '200px', borderLeft: '1px solid var(--color-phosphor-dim)', paddingLeft: '20px' }}>
           <h3 style={{ marginTop: 0, color: 'var(--color-phosphor)', borderBottom: '1px solid var(--color-phosphor)', display: 'inline-block' }}>UUP / SCORES</h3>
           {['str', 'dex', 'end', 'int', 'edu', 'soc'].map(statKey => {
             const statVal: number = (data as any)[statKey];
             const dm = calculateDM(statVal);
             return (
               <div key={statKey} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                 <span style={{ width: '50px', fontWeight: 'bold' }}>{statKey.toUpperCase()}:</span>
                 <input type="number" min="1" max="15" value={statVal} onChange={e => updateChar({ [statKey]: parseInt(e.target.value) || 0 })} style={{ width: '50px', textAlign: 'center', marginRight: '10px' }} />
                 <span style={{ color: dm >= 0 ? '#00ff00' : '#ff5555' }}>[ DM {formatDM(dm)} ]</span>
               </div>
             );
           })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* SKILLS */}
        <div style={{ flex: 2, minWidth: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-phosphor)' }}>
            <h3 style={{ margin: 0, color: 'var(--color-phosphor)' }}>TRAINING: SKILLS</h3>
          </div>
          <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
            {hydratedSkills.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.name}>{s.name}</span>
                <input type="number" value={s.level} onChange={e => updateSkill(s.id, 'level', parseInt(e.target.value) || 0)} style={{ width: '40px', textAlign: 'center', border: '1px solid var(--color-phosphor-dim)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* FINANCIALS & TRAINING META */}
        <div style={{ flex: 1, minWidth: '250px' }}>
           <h3 style={{ margin: 0, color: 'var(--color-phosphor)', borderBottom: '1px solid var(--color-phosphor)', paddingBottom: '2px' }}>PERSONAL WALLET</h3>
           <div style={{ marginTop: '10px', padding: '15px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--color-phosphor)' }}>
              <span style={{ color: 'var(--color-phosphor-dim)', fontSize: '0.9rem' }}>CREDITS BALANCE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                 <span style={{ fontSize: '1.2rem' }}>Cr</span>
                 <input type="number" value={data.personalCredits} onChange={e => updateChar({ personalCredits: parseInt(e.target.value) || 0 })} style={{ flex: 1, fontSize: '1.2rem', padding: '5px' }} />
              </div>
           </div>

           <h3 style={{ margin: 0, color: 'var(--color-phosphor)', borderBottom: '1px solid var(--color-phosphor)', paddingBottom: '2px', marginTop: '20px' }}>TRAINING DETAILS</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
             <div><label style={{ fontSize: '0.8rem', color: 'var(--color-phosphor-dim)' }}>Studied Skill:</label> <input type="text" value={data.trainingSkill} onChange={e => updateChar({ trainingSkill: e.target.value })} style={{ width: '100%', borderBottom: '1px dashed var(--color-phosphor-dim)' }} /></div>
             <div><label style={{ fontSize: '0.8rem', color: 'var(--color-phosphor-dim)' }}>Completed Weeks:</label> <input type="text" value={data.trainingWeeks} onChange={e => updateChar({ trainingWeeks: e.target.value })} style={{ width: '100%', borderBottom: '1px dashed var(--color-phosphor-dim)' }} /></div>
             <div><label style={{ fontSize: '0.8rem', color: 'var(--color-phosphor-dim)' }}>Completed Study Periods:</label> <input type="text" value={data.trainingPeriods} onChange={e => updateChar({ trainingPeriods: e.target.value })} style={{ width: '100%', borderBottom: '1px dashed var(--color-phosphor-dim)' }} /></div>
           </div>
        </div>
      </div>
      
      {/* EQUIPMENT BLOCK */}
      <h3 style={{ marginTop: '40px', color: 'var(--color-phosphor)', borderBottom: '1px solid var(--color-phosphor)' }}>INVENTORY</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '10px' }}>
        <div>
          <label style={{ display: 'block', color: 'var(--color-phosphor-dim)', marginBottom: '5px' }}>EQUIPMENT</label>
          <textarea value={data.equipment} onChange={e => updateChar({ equipment: e.target.value })} style={{ width: '100%', height: '100px', background: 'transparent', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor-dim)' }}></textarea>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--color-phosphor-dim)', marginBottom: '5px' }}>WEAPONS</label>
          <textarea value={data.weapons} onChange={e => updateChar({ weapons: e.target.value })} style={{ width: '100%', height: '100px', background: 'transparent', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor-dim)' }}></textarea>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--color-phosphor-dim)', marginBottom: '5px' }}>ARMOUR</label>
          <textarea value={data.armor} onChange={e => updateChar({ armor: e.target.value })} style={{ width: '100%', height: '100px', background: 'transparent', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor-dim)' }}></textarea>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--color-phosphor-dim)', marginBottom: '5px' }}>AUGMENTS & IMPLANTS</label>
          <textarea value={data.augments} onChange={e => updateChar({ augments: e.target.value })} style={{ width: '100%', height: '100px', background: 'transparent', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor-dim)' }}></textarea>
        </div>
      </div>

      {/* ADDITIONAL PDF SECTIONS */}
      <h3 style={{ marginTop: '40px', color: 'var(--color-phosphor)', borderBottom: '1px solid var(--color-phosphor)' }}>BIOGRAPHICAL & STATUS LOGS</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '15px' }}>
        <div>
          <label style={{ display: 'block', color: '#ffaaaa', marginBottom: '5px' }}>WOUNDS</label>
          <textarea value={data.wounds} onChange={e => updateChar({ wounds: e.target.value })} style={{ width: '100%', height: '80px', background: 'rgba(255,0,0,0.05)', color: 'var(--color-phosphor)', border: '1px solid #ff5555' }}></textarea>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--color-phosphor-dim)', marginBottom: '5px' }}>CAREERS</label>
          <textarea value={data.careers} onChange={e => updateChar({ careers: e.target.value })} style={{ width: '100%', height: '80px', background: 'transparent', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor-dim)' }}></textarea>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', color: 'var(--color-phosphor-dim)', marginBottom: '5px' }}>HISTORY & BACKGROUND</label>
          <textarea value={data.history} onChange={e => updateChar({ history: e.target.value })} style={{ width: '100%', height: '100px', background: 'transparent', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor-dim)' }}></textarea>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--color-phosphor-dim)', marginBottom: '5px' }}>ALLIES</label>
          <textarea value={data.allies} onChange={e => updateChar({ allies: e.target.value })} style={{ width: '100%', height: '80px', background: 'transparent', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor-dim)' }}></textarea>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--color-phosphor-dim)', marginBottom: '5px' }}>CONTACTS</label>
          <textarea value={data.contacts} onChange={e => updateChar({ contacts: e.target.value })} style={{ width: '100%', height: '80px', background: 'transparent', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor-dim)' }}></textarea>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--color-phosphor-dim)', marginBottom: '5px' }}>RIVALS</label>
          <textarea value={data.rivals} onChange={e => updateChar({ rivals: e.target.value })} style={{ width: '100%', height: '80px', background: 'transparent', color: 'var(--color-phosphor)', border: '1px solid var(--color-phosphor-dim)' }}></textarea>
        </div>
        <div>
          <label style={{ display: 'block', color: '#ffaaaa', marginBottom: '5px' }}>ENEMIES</label>
          <textarea value={data.enemies} onChange={e => updateChar({ enemies: e.target.value })} style={{ width: '100%', height: '80px', background: 'rgba(255,0,0,0.05)', color: 'var(--color-phosphor)', border: '1px solid #ff5555' }}></textarea>
        </div>
      </div>

    </div>
  );
}
