import { useState } from 'react';
import type { CharacterData, CrewMember } from './ShipStatus';
import { 
  CalculateDM, Roll2D6, Roll1D6, BackgroundSkills, Careers, PreCareers 
} from './data/careerData';
import type { Career, CareerAssignment, Characteristic } from './data/careerData';

type GenPhase = 'INIT' | 'STATS' | 'BACKGROUND' | 'PRE_CAREER' | 'QUALIFICATION' | 'TERM_LOOP' | 'COMMISSION_ADVANCEMENT' | 'INJURY_CRISIS' | 'TERM_END' | 'MUSTERING_OUT' | 'DONE' | 'DEATH';

export function CharacterGenerator({ onComplete, onCancel }: { onComplete: (crew: CrewMember) => void, onCancel: () => void }) {
  const [phase, setPhase] = useState<GenPhase>('INIT');
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'flowchart'>('flowchart');
  
  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  // Character State Tracker
  const [name, setName] = useState('');
  const [stats, setStats] = useState({ str: 0, dex: 0, end: 0, int: 0, edu: 0, soc: 0 });
  const [skills, setSkills] = useState<{ id: string, name: string, level: number }[]>([]);
  const [age, setAge] = useState(18);
  const [terms, setTerms] = useState(0);
  const [cash, setCash] = useState(0);
  const [benefits, setBenefits] = useState<string[]>([]);
  
  // Career Tracking
  const [career, setCareer] = useState<Career | null>(null);
  const [assignment, setAssignment] = useState<CareerAssignment | null>(null);
  const [rank, setRank] = useState(0); // Enlisted Rank
  const [benefitsPulls, setBenefitsPulls] = useState(0);

  // New Mechanics State
  const [previousCareers, setPreviousCareers] = useState<string[]>([]);
  const [isOfficer, setIsOfficer] = useState(false);
  const [officerRank, setOfficerRank] = useState(0);
  const [draftUsed, setDraftUsed] = useState(false);

  // Derived/phase state moved out of renderers
  const [bgSelectedSkills, setBgSelectedSkills] = useState<string[]>([]);
  const [allocatedCashRolls, setAllocatedCashRolls] = useState(0);
  const [pendingSkillRolls, setPendingSkillRolls] = useState(0);
  const [medicalDebt, setMedicalDebt] = useState(0);


  
  const addOrUpdateSkill = (name: string, level: number = 0) => {
    setSkills(prev => {
      const existing = prev.find(s => s.name === name);
      if (existing) {
        if (level > existing.level) return prev.map(s => s.name === name ? { ...s, level } : s);
        return prev;
      }
      return [...prev, { id: crypto.randomUUID(), name, level: Math.max(0, level) }];
    });
  };

  const incrementSkill = (name: string) => {
    setSkills(prev => {
      const existing = prev.find(s => s.name === name);
      if (existing) return prev.map(s => s.name === name ? { ...s, level: s.level + 1 } : s);
      return [...prev, { id: crypto.randomUUID(), name, level: 1 }];
    });
  };

  const getStat = (s: Characteristic) => stats[s];
  const modifyStat = (s: Characteristic, val: number) => {
    setStats(prev => {
        const newVal = Math.min(15, prev[s] + val);
        if (newVal <= 0 && phase !== 'DEATH') {
            addLog(`CRITICAL FAILURE: ${s.toUpperCase()} dropped to 0!`);
            setTimeout(() => setPhase('DEATH'), 0);
        }
        return { ...prev, [s]: Math.max(0, newVal) };
    });
  };

  // ---- PHASES ----

  const rollStats = () => {
    const rolled = { str: Roll2D6(), dex: Roll2D6(), end: Roll2D6(), int: Roll2D6(), edu: Roll2D6(), soc: Roll2D6() };
    setStats(rolled);
    addLog(`Rolled Characteristics: STR ${rolled.str}, DEX ${rolled.dex}, END ${rolled.end}, INT ${rolled.int}, EDU ${rolled.edu}, SOC ${rolled.soc}`);
    setPhase('BACKGROUND');
  };

  const selectBackground = (selectedSkills: string[]) => {
    selectedSkills.forEach(s => addOrUpdateSkill(s, 0));
    addLog(`Gained background skills: ${selectedSkills.join(', ')} at Level 0`);
    setPhase('PRE_CAREER');
  };

  const attemptPreCareer = (type: 'university' | 'militaryAcademy' | 'skip') => {
    if (type === 'skip') {
       addLog('Skipped pre-career education.');
       setPhase('QUALIFICATION');
       return;
    }
    
    const pre = type === 'university' ? PreCareers.university : PreCareers.militaryAcademy;
    const entryRoll = Roll2D6() + CalculateDM(getStat(pre.entryStat));
    if (entryRoll >= pre.entryTarget) {
       addLog(`Accepted into ${pre.name}! Age +4 years.`);
       setAge(a => a + 4);
       
       const gradRoll = Roll2D6() + CalculateDM(getStat(pre.graduationStat));
       if (gradRoll >= pre.graduationTarget) {
          addLog(`Graduated from ${pre.name} with Honors! +1 EDU and special skills.`);
          modifyStat('edu', 1);
          if (type === 'university') incrementSkill('Science');
          if (type === 'militaryAcademy') { incrementSkill('Vacc Suit'); incrementSkill('Tactics'); }
       } else {
          addLog(`Failed to graduate from ${pre.name}. You drop out.`);
       }
       setPhase('QUALIFICATION');
    } else {
       addLog(`Denied entry into ${pre.name} (Rolled ${entryRoll} vs ${pre.entryTarget}).`);
       setPhase('QUALIFICATION');
    }
  };

  const attemptQualification = (careerId: string) => {
    const targetCareer = Careers[careerId];
    
    // Auto-succeed if forced into Drifter
    if (careerId === 'drifter') {
       addLog(`Entered Drifter fallback career.`);
       setCareer(targetCareer);
       setAssignment(targetCareer.assignments[0]);
       setPhase('TERM_LOOP');
       return;
    }

    const val = getStat(targetCareer.qualifyStat);
    const dm = CalculateDM(val) - previousCareers.length;
    const roll = Roll2D6() + dm;

    if (roll >= targetCareer.qualifyTarget) {
       addLog(`Qualified for ${targetCareer.name}! (Rolled ${roll} vs ${targetCareer.qualifyTarget})`);
       setCareer(targetCareer);
       // Reset ranks for new career
       setRank(0);
       setIsOfficer(false);
       setOfficerRank(0);
       // Auto select first assignment for MVP flow
       setAssignment(targetCareer.assignments[0]);
       setPhase('TERM_LOOP');
    } else {
       addLog(`Failed to qualify for ${targetCareer.name} (Rolled ${roll} vs ${targetCareer.qualifyTarget}).`);
       addLog('You must enter the Draft or the Drifter career.');
       setCareer(null);
       setAssignment(null);
       // Stay in qualification phase but UI will now show Draft/Drifter fallback
    }
  };

  const attemptDraft = () => {
    setDraftUsed(true);
    const draftTarget = Roll1D6();
    let draftedCareerId = 'merchant';
    if (draftTarget >= 4) draftedCareerId = 'navy';
    if (draftTarget === 6) draftedCareerId = 'scout';
    
    addLog(`Drafted into ${Careers[draftedCareerId].name}!`);
    setCareer(Careers[draftedCareerId]);
    setAssignment(Careers[draftedCareerId].assignments[0]);
    setPhase('TERM_LOOP');
  };

  const resolveTermInit = (tablePick: 'personalDevelopment' | 'serviceSkills' | 'advancedEducation') => {
    if (!career || !assignment) return;
    
    addLog(`--- Term ${terms + 1} Begins (${career.name}) ---`);

    // 1. Basic Training for Term 1 of FIRST career
    if (terms === 0 && previousCareers.length === 0) {
      addLog(`Basic Training: Received all service skills at Level 0.`);
      career.serviceSkills.forEach(s => {
        if (s.type === 'skill') addOrUpdateSkill(s.value, 0);
      });
    }

    // 2. Skill Table Roll
    const table = career[tablePick];
    const roll = Roll1D6() - 1;
    const result = table[roll];
    if (result.type === 'stat') {
      modifyStat(result.value as Characteristic, 1);
      addLog(`Skill Roll: Gained +1 to ${result.value.toUpperCase()}`);
    } else {
      incrementSkill(result.value);
      addLog(`Skill Roll: Gained +1 to ${result.value} skill`);
    }

    // 3. Survival
    const survStat = getStat(assignment.survivalStat);
    const survDM = CalculateDM(survStat);
    const survivalRoll = Roll2D6() + survDM;
    if (survivalRoll < assignment.survivalTarget) {
      const mishap = career.mishaps[Roll1D6() - 1];
      addLog(`MISHAP! Rolled ${survivalRoll} vs Target ${assignment.survivalTarget}. Event: ${mishap}`);
      setTerms(t => t + 1);
      setAge(a => a + 4);
      addLog('You have been discharged from this career. (No term benefit roll gained for this failed term).');
      
      const rankBonus = isOfficer ? officerRank : rank;
      let rb = 0; if (rankBonus >= 5) rb = 3; else if (rankBonus >= 3) rb = 2; else if (rankBonus >= 1) rb = 1;
      if (rb > 0) {
         addLog(`Retained Rank Bonus: Earned +${rb} Mustering Out pull(s) for your high rank!`);
         setBenefitsPulls(b => b + rb);
      }

      setPreviousCareers(prev => [...prev, career.id]);
      setCareer(null);
      setAssignment(null);
      
      if (mishap.toLowerCase().includes('injur')) {
          setPhase('INJURY_CRISIS');
      } else {
          setPhase('TERM_END'); // Special redirect to term end where they can't continue
      }
      return;
    } else {
      addLog(`Survival passed: Rolled ${survivalRoll} (Target ${assignment.survivalTarget})`);
    }

    // 4. Event
    const evRoll = Roll2D6() - 2; 
    const eventText = career.events[evRoll];
    addLog(`Event: ${eventText}`);

    setPhase('COMMISSION_ADVANCEMENT');
  };

  const handleCommissionAdvancement = (action: 'commission' | 'advancement' | 'skip') => {
     if (!career || !assignment) return;
     
     if (action === 'skip') {
        addLog(`Skipped rank advancement.`);
        completeTermLoop();
        return;
     }

     if (action === 'commission') {
        const commRoll = Roll2D6() + CalculateDM(getStat(assignment.commissionStat!));
        if (commRoll >= assignment.commissionTarget!) {
           setIsOfficer(true);
           setOfficerRank(1);
           addLog(`Commission Success! Promoted to Officer Rank 1 (${assignment.officerRanks?.[0] || 'O1'})`);
           setPendingSkillRolls(p => p + 1);
        } else {
           addLog(`Commission Failed (Rolled ${commRoll} vs ${assignment.commissionTarget}).`);
        }
     }

     if (action === 'advancement') {
        const advRoll = Roll2D6() + CalculateDM(getStat(assignment.advancementStat));
        if (advRoll >= assignment.advancementTarget) {
           if (isOfficer) {
              const newRank = officerRank + 1;
              setOfficerRank(newRank);
              addLog(`Advancement Passed! Promoted to Officer Rank ${newRank} (${assignment.officerRanks?.[newRank-1] || 'O'+newRank})`);
           } else {
              const newRank = rank + 1;
              setRank(newRank);
              addLog(`Advancement Passed! Promoted to Enlisted Rank ${newRank} (${assignment.ranks[newRank] || 'E'+newRank})`);
           }
           setPendingSkillRolls(p => p + 1);
        } else {
           addLog(`Advancement Failed (Rolled ${advRoll} vs ${assignment.advancementTarget}).`);
        }
     }
     
     completeTermLoop();
  };

  const handlePendingSkillBonus = (typePick: 'personalDevelopment' | 'serviceSkills') => {
     if (!career || !assignment || pendingSkillRolls <= 0) return;
     const table = career[typePick];
     const result = table[Roll1D6() - 1];
     if (result.type === 'stat') {
       modifyStat(result.value as Characteristic, 1);
       addLog(`Bonus Rank Roll: Gained +1 to ${result.value.toUpperCase()}`);
     } else {
       incrementSkill(result.value);
       addLog(`Bonus Rank Roll: Gained +1 to ${result.value} skill`);
     }
     setPendingSkillRolls(p => p - 1);
  };

  const completeTermLoop = () => {
    setTerms(t => t + 1);
    setAge(a => a + 4);
    setBenefitsPulls(b => b + 1);
    setPhase('TERM_END');
  };

  const processTermEnd = (choice: 'continue' | 'leave' | 'muster') => {
     // Check Aging Crisis here before resolving choice
     if (age >= 34) {
       const agingRoll = Roll2D6() - Math.floor((age - 34) / 4);
       if (agingRoll < 1) {
         addLog(`[!] AGING CRISIS! Your body is breaking down. (Simulated Effect: Core Stats Degraded)`);
         modifyStat('str', -1); modifyStat('dex', -1); modifyStat('end', -1);
         const debt = 10000;
         setMedicalDebt(d => d + debt);
         addLog(`Aging Crisis Medical Debt incurred: Cr ${debt.toLocaleString()}`);
       } else {
         addLog(`Survived aging with no major physical deterioration.`);
       }
     }

     if (choice === 'muster' || choice === 'leave') {
       if (career) {
          const rankBonus = isOfficer ? officerRank : rank;
          let rb = 0; if (rankBonus >= 5) rb = 3; else if (rankBonus >= 3) rb = 2; else if (rankBonus >= 1) rb = 1;
          if (rb > 0) {
             addLog(`Rank Bonus: Earned +${rb} Mustering Out pull(s) for your high rank in ${career.name}!`);
             setBenefitsPulls(b => b + rb);
          }
          setPreviousCareers(prev => [...prev, career.id]);
          setCareer(null);
          setAssignment(null);
       }
       if (choice === 'muster') setPhase('MUSTERING_OUT');
       else setPhase('QUALIFICATION');
     } else {
       setPhase('TERM_LOOP');
     }
  };

  const musterOut = (rolls: { cash: number, benefits: number }) => {
    let activeCareer = career || (previousCareers.length > 0 ? Careers[previousCareers[previousCareers.length - 1]] : null);
    if (!activeCareer) {
        addLog('Error: No career data found for mustering out.');
        return;
    }

    addLog(`--- Mustering Out (${activeCareer.name}) ---`);
    let myCash = cash;
    let myBen = [...benefits];

    for (let i = 0; i < rolls.cash; i++) {
        let maxIdx = activeCareer.musteringOutCash.length - 1;
        let cRoll = Math.min(Roll1D6() - 1, maxIdx);
        let amount = activeCareer.musteringOutCash[cRoll];
        myCash += amount;
        addLog(`Cash Roll: Cr ${amount.toLocaleString()}`);
    }

    for (let i = 0; i < rolls.benefits; i++) {
        let maxIdx = activeCareer.musteringOutBenefits.length - 1;
        let bRoll = Math.min(Roll1D6() - 1, maxIdx);
        let ben = activeCareer.musteringOutBenefits[bRoll];
        myBen.push(ben);
        addLog(`Benefit Roll: ${ben}`);
    }

    if (medicalDebt > 0) {
        addLog(`Settling Medical Debt: Cr ${medicalDebt.toLocaleString()}`);
        if (myCash >= medicalDebt) {
          myCash -= medicalDebt;
          setMedicalDebt(0);
          addLog(`Paid medical debt in full! Remaining cash: Cr ${myCash.toLocaleString()}`);
        } else {
          setMedicalDebt(medicalDebt - myCash);
          myCash = 0;
          addLog(`Paid as much debt as possible. Remaining debt carried over.`);
        }
    }

    setCash(myCash);
    setBenefits(myBen);
    setPhase('DONE');
  };

  const finish = () => {
    const finalData: CharacterData = {
      title: isOfficer ? `(O${officerRank}) ${assignment?.officerRanks?.[officerRank-1] || ''}` : `(E${rank}) ${assignment?.ranks[rank] || ''}`,
      age: age.toString(),
      species: 'Human',
      homeworld: 'Unknown Base',
      traits: '',
      str: stats.str, dex: stats.dex, end: stats.end,
      int: stats.int, edu: stats.edu, soc: stats.soc,
      skills: skills,
      equipment: benefits.join(', '),
      weapons: '', armor: '', augments: '', 
      trainingSkill: '', trainingWeeks: '', trainingPeriods: '',
      wounds: '', careers: career ? `${career.name} (${terms} terms)` : '', 
      history: logs.join('\n'), 
      allies: '', contacts: '', rivals: '', enemies: '',
      personalCredits: cash
    };

    onComplete({
      id: crypto.randomUUID(),
      name: name || 'Unknown Generated',
      roles: assignment?.name || 'Vagabond',
      type: 'Player',
      salary: 1000,
      payrollShare: 1,
      characterData: finalData
    });
  };

  // -------------- RENDERERS --------------

  const rStats = () => (
    <div>
      <h3>Step 1: Determine Characteristics</h3>
      <p>Roll 2D6 six times and record the results for your stats.</p>
      <button onClick={rollStats} style={{ padding: '10px 20px', fontSize: '1.2rem', cursor: 'pointer', background: 'var(--color-phosphor)', color: '#000' }}>ROLL STATS</button>
    </div>
  );

  const rBackground = () => {
    // Select 3 + EDU DM skills
    const maxSkills = 3 + Math.max(0, CalculateDM(stats.edu));
    const toggle = (s: string) => {
      if (bgSelectedSkills.includes(s)) setBgSelectedSkills(bgSelectedSkills.filter(x => x !== s));
      else if (bgSelectedSkills.length < maxSkills) setBgSelectedSkills([...bgSelectedSkills, s]);
    }
    return (
      <div>
        <h3>Step 2: Background Skills</h3>
        <p>Your Education DM is {CalculateDM(stats.edu)}. Select up to <strong>{maxSkills}</strong> level 0 background skills.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
          {BackgroundSkills.map(s => (
            <button 
              key={s} 
              onClick={() => toggle(s)}
              disabled={!bgSelectedSkills.includes(s) && bgSelectedSkills.length >= maxSkills}
              style={{
                background: bgSelectedSkills.includes(s) ? 'var(--color-phosphor)' : 'transparent',
                color: bgSelectedSkills.includes(s) ? '#000' : 'var(--color-phosphor-dim)',
                border: '1px solid var(--color-phosphor)',
                padding: '5px 10px', cursor: 'pointer'
              }}
            >{s}</button>
          ))}
        </div>
        <button 
           onClick={() => selectBackground(bgSelectedSkills)} 
           style={{ marginTop: '20px', padding: '10px', background: 'rgba(0,255,0,0.2)', border: '1px solid #0f0', color: '#0f0' }}>CONFIRM & CONTINUE (SELECTED: {bgSelectedSkills.length}/{maxSkills})</button>
      </div>
    );
  };

  const rPreCareer = () => (
    <div>
      <h3>Step 3: Pre-Career Education</h3>
      <p>Attempt to enter University or a Military Academy before starting a standard career path. Taking a pre-career counts as one 4-year term.</p>
      <div style={{ display: 'flex', gap: '15px' }}>
         <button onClick={() => attemptPreCareer('university')} style={{ padding: '10px' }}>Attempt University (EDU 7+)</button>
         <button onClick={() => attemptPreCareer('militaryAcademy')} style={{ padding: '10px' }}>Attempt Military Academy (END 8+)</button>
         <button onClick={() => attemptPreCareer('skip')} style={{ padding: '10px', background: 'transparent', borderColor: 'var(--color-phosphor-dim)', color: 'var(--color-phosphor-dim)' }}>Skip Pre-Career</button>
      </div>
    </div>
  );

  const rQualify = () => {
    // If the user has a career right now, they failed qualification and need Draft/Drifter
    const needsFallback = career === null && logs[logs.length-1]?.includes('enter the Draft');
    
    if (needsFallback) {
       return (
         <div style={{ border: '1px solid #ff5555', padding: '15px', color: '#ffaaaa' }}>
            <h3>Qualification Failed</h3>
            <p>You failed your qualification attempt. You must choose a fallback path:</p>
            <div style={{ display: 'flex', gap: '15px' }}>
               <button disabled={draftUsed} onClick={() => attemptDraft()} style={{ padding: '10px', borderColor: draftUsed ? '#444' : '#ff5555', color: draftUsed ? '#444' : '#ffaaaa' }}>
                  {draftUsed ? 'DRAFT ALREADY USED VIA LIFETIME' : 'SUBMIT TO MILITARY DRAFT'}
               </button>
               <button onClick={() => attemptQualification('drifter')} style={{ padding: '10px', borderColor: '#ff5555' }}>
                  BECOME A DRIFTER
               </button>
            </div>
         </div>
       )
    }

    return (
      <div>
        <h3>Step 4: Career Qualification</h3>
        <p>Choose a career to attempt entry. Previous careers DM: {previousCareers.length > 0 ? `-${previousCareers.length}` : '0'}</p>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {Object.values(Careers).filter(c => c.id !== 'drifter').map(c => {
             const disabled = previousCareers.includes(c.id);
             return (
              <div key={c.id} style={{ border: '1px solid var(--color-phosphor-dim)', padding: '15px', flex: '1', minWidth: '250px', opacity: disabled ? 0.4 : 1 }}>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-phosphor)' }}>{c.name}</h4>
                <p style={{ fontSize: '0.9rem' }}>{c.description}</p>
                <button 
                  disabled={disabled}
                  onClick={() => attemptQualification(c.id)}
                  style={{ display: 'block', width: '100%', marginBottom: '5px', padding: '10px', cursor: disabled ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-phosphor)' }}>
                  ATTEMPT QUALIFICATION (Roll {c.qualifyTarget}+ on {c.qualifyStat.toUpperCase()})
                </button>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  const rTermLoop = () => {
    if (!career || !assignment) return null;
    return (
      <div>
        <h3>Term {terms + 1} - {career.name} / {assignment.name}</h3>
        <p>You must roll on a Skill & Training table for this term.</p>
        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
          <button onClick={() => resolveTermInit('personalDevelopment')} style={{ flex: 1, padding: '10px' }}>Personal Development Table</button>
          <button onClick={() => resolveTermInit('serviceSkills')} style={{ flex: 1, padding: '10px' }}>Service Skills Table</button>
          {getStat('edu') >= 8 ? <button onClick={() => resolveTermInit('advancedEducation')} style={{ flex: 1, padding: '10px' }}>Advanced Education Table</button> : <button disabled style={{ flex: 1, padding: '10px', opacity: 0.5 }}>Adv. Edu (Req EDU 8+)</button>}
        </div>
      </div>
    );
  };

  const rCommissionAdvancement = () => {
     if (pendingSkillRolls > 0) {
        return (
          <div style={{ border: '1px solid #00ff00', padding: '15px' }}>
             <h3>Rank Promoted - Select Bonus Skill Table</h3>
             <p>Select a table to roll your bonus skill from promotion:</p>
             <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => handlePendingSkillBonus('serviceSkills')} style={{ flex: 1, padding: '10px' }}>Service Skills</button>
                <button onClick={() => handlePendingSkillBonus('personalDevelopment')} style={{ flex: 1, padding: '10px' }}>Personal Dev</button>
             </div>
          </div>
        )
     }

     const canCommission = assignment?.commissionTarget !== undefined && !isOfficer;
     const currentRankString = isOfficer ? `O${officerRank}` : `E${rank}`;

     return (
        <div>
           <h3>Rank Progression</h3>
           <p>Current Rank Status: {currentRankString}</p>
           <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              {canCommission && (
                 <button onClick={() => handleCommissionAdvancement('commission')} style={{ padding: '10px', borderColor: '#dca3ff', color: '#dca3ff' }}>
                    ATTEMPT COMMISSION ({assignment!.commissionStat!.toUpperCase()} {assignment!.commissionTarget}+)
                 </button>
              )}
              <button onClick={() => handleCommissionAdvancement('advancement')} style={{ padding: '10px' }}>
                 ATTEMPT ADVANCEMENT ({assignment!.advancementStat.toUpperCase()} {assignment!.advancementTarget}+)
              </button>
              <button onClick={() => handleCommissionAdvancement('skip')} style={{ padding: '10px', borderColor: 'var(--color-phosphor-dim)', color: 'var(--color-phosphor-dim)' }}>
                 SKIP (REMAIN AT RANK)
              </button>
           </div>
        </div>
     );
  };

  const resolveInjury = () => {
     const roll = Roll1D6();
     addLog(`Injury Roll: ${roll}`);
     let damage = 0;
     if (roll === 1) { addLog('Critically injured. All physical stats reduced.'); damage = 3; }
     else if (roll === 2 || roll === 3) { addLog('Severely injured. Stat reduced.'); damage = 2; }
     else if (roll === 4 || roll === 5) { addLog('Injured. Stat reduced.'); damage = 1; }
     else { addLog('Lightly injured. No permanent physical penalties!'); }

     if (damage > 0) {
        modifyStat('str', -1);
        if (damage > 1) modifyStat('dex', -1);
        if (damage > 2) modifyStat('end', -1);
        const debt = damage * 5000;
        setMedicalDebt(d => d + debt);
        addLog(`Medical Care Debt increased by Cr ${debt.toLocaleString()}`);
     }

     setPhase('TERM_END'); // Return to standard flow
  };

  const rInjuryCrisis = () => (
     <div style={{ border: '2px solid #ff5555', padding: '15px', background: 'rgba(255,0,0,0.1)' }}>
        <h3 style={{ color: '#ffaaaa' }}>SEVERE INJURY</h3>
        <p>You have suffered a severe injury! Roll on the Injury Table to determine physical stat damage and mandatory medical debt.</p>
        <button onClick={resolveInjury} style={{ display: 'block', width: '100%', padding: '15px', background: '#550000', color: '#ffaaaa', border: '1px solid #ff5555', fontSize: '1.1rem' }}>ROLL INJURY TABLE</button>
     </div>
  );

  const rTermEnd = () => {
     const isFired = career === null;
     if (isFired) {
        return (
           <div>
              <h3>Term MISHAP</h3>
              <p>You have been discharged from your career due to a survival mishap. You must find a new trajectory or retire.</p>
              <div style={{ display: 'flex', gap: '15px' }}>
                 <button onClick={() => processTermEnd('leave')} style={{ padding: '10px' }}>ATTEMPT NEW CAREER</button>
                 <button onClick={() => processTermEnd('muster')} style={{ padding: '10px', borderColor: '#ff5555', color: '#ffaaaa' }}>MUSTER OUT / RETIRE</button>
              </div>
           </div>
        );
     }

     return (
       <div>
         <h3>Term {terms} Concluded</h3>
         <p>You have successfully completed another term in {career?.name}. You may continue advancing in this career, leave for a new one, or retire.</p>
         {age >= 34 && <p style={{ color: '#ffaaaa' }}>WARNING: You are 34 or older. You will roll for an Aging Crisis if you continue or muster out now.</p>}
         <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
           <button onClick={() => processTermEnd('continue')} style={{ padding: '10px', borderColor: '#00ff00' }}>CONTINUE IN CURRENT CAREER</button>
           <button onClick={() => processTermEnd('leave')} style={{ padding: '10px' }}>RESIGN & SEEK NEW CAREER</button>
           <button onClick={() => processTermEnd('muster')} style={{ padding: '10px', borderColor: '#ff5555', color: '#ffaaaa' }}>RETIRE & MUSTER OUT</button>
         </div>
       </div>
     )
  };

  const rMuster = () => {
    const cashRolls = allocatedCashRolls;
    const benRolls = benefitsPulls - allocatedCashRolls;
    
    return (
      <div>
        <h3>Mustering Out</h3>
        <p>You have survived {terms} terms and have <strong>{benefitsPulls}</strong> Benefit rolls. Allocate them between Cash (Max 3) and Benefits.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Cash Rolls: {cashRolls}</span>
            <div>
              <button disabled={cashRolls === 0} onClick={() => { setAllocatedCashRolls(c => c - 1); }}>-</button>
              <button disabled={cashRolls >= 3 || benRolls === 0} onClick={() => { setAllocatedCashRolls(c => c + 1); }}>+</button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
             <span>Benefit Rolls: {benRolls}</span>
          </div>
          <button 
             onClick={() => musterOut({ cash: cashRolls, benefits: benRolls })}
             style={{ padding: '10px', background: 'var(--color-phosphor)', color: '#000', fontWeight: 'bold', marginTop: '10px' }}>ROLL MUSTERING BENEFITS</button>
        </div>
      </div>
    )
  }

  const rDone = () => (
    <div>
      <h3>Character Complete</h3>
      <p>Name: <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ borderBottom: '1px solid var(--color-phosphor)', fontSize: '1.2rem', padding: '5px' }} placeholder="Enter Name..." /></p>
      <p>Cash: Cr {cash.toLocaleString()}</p>
      <p>Benefits: {benefits.join(', ')}</p>
      <button onClick={finish} disabled={!name.trim()} style={{ background: '#0f0', color: '#000', padding: '15px 30px', fontWeight: 'bold' }}>SAVE AND CLOSE TO ROSTER</button>
    </div>
  );

  const rDeath = () => (
    <div style={{ color: '#ffaaaa', border: '2px solid #ff0000', padding: '30px', background: 'rgba(50,0,0,0.8)' }}>
       <h2>/// VITAL SIGNS LOST ///</h2>
       <p style={{ fontSize: '1.2rem' }}>Your character has sustained critical trauma. A physical characteristic has dropped to zero.</p>
       <p style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#ff5555' }}>THEY HAVE DIED DURING CHARACTER GENERATION.</p>
       <button onClick={onCancel} style={{ display: 'block', width: '100%', marginTop: '30px', padding: '15px', background: '#550000', color: '#ffaaaa', border: '1px solid #ff0000', fontSize: '1.2rem', cursor: 'pointer' }}>TERMINATE CHARACTER RECORD</button>
    </div>
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', padding: '40px' }}>
       {/* LEFT CONTENT PANE */}
       <div style={{ flex: 2, background: '#111', border: '1px solid var(--color-phosphor)', padding: '30px', overflowY: 'auto' }}>
          <h2 style={{ color: 'var(--color-phosphor)', borderBottom: '1px solid var(--color-phosphor)', paddingBottom: '10px' }}>[ LIFEPATH GENERATION ENGINE ]</h2>
          
          {phase === 'INIT' && <button onClick={() => setPhase('STATS')} style={{ padding: '10px', fontSize: '1.2rem', cursor: 'pointer' }}>Begin Character Generation</button>}
          {phase === 'STATS' && rStats()}
          {phase === 'BACKGROUND' && rBackground()}
          {phase === 'PRE_CAREER' && rPreCareer()}
          {phase === 'QUALIFICATION' && rQualify()}
          {phase === 'TERM_LOOP' && rTermLoop()}
          {phase === 'COMMISSION_ADVANCEMENT' && rCommissionAdvancement()}
          {phase === 'INJURY_CRISIS' && rInjuryCrisis()}
          {phase === 'TERM_END' && rTermEnd()}
          {phase === 'MUSTERING_OUT' && rMuster()}
          {phase === 'DONE' && rDone()}
          {phase === 'DEATH' && rDeath()}

          <button onClick={onCancel} style={{ position: 'absolute', top: '50px', right: '50px', border: 'none', background: 'transparent', color: '#ffaaaa', cursor: 'pointer', fontSize: '1.2rem' }}>X CLOSE SESSION</button>
       </div>

       {/* RIGHT LOG / TRACKING PANE */}
       <div style={{ flex: 1, marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TRACKER */}
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', border: '1px solid var(--color-phosphor-dim)' }}>
             <h3 style={{ margin: 0, color: 'var(--color-phosphor)' }}>CURRENT STATUS</h3>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '10px' }}>
                 <span>Age: {age}</span><span>Terms: {terms}</span>
                 <span>STR: {stats.str} [{CalculateDM(stats.str)}]</span><span>INT: {stats.int} [{CalculateDM(stats.int)}]</span>
                 <span>DEX: {stats.dex} [{CalculateDM(stats.dex)}]</span><span>EDU: {stats.edu} [{CalculateDM(stats.edu)}]</span>
                 <span>END: {stats.end} [{CalculateDM(stats.end)}]</span><span>SOC: {stats.soc} [{CalculateDM(stats.soc)}]</span>
             </div>
             {career && (
                <div style={{ marginTop: '10px', color: '#dca3ff' }}>
                   Career: {career.name} - Rank: {isOfficer ? `O${officerRank}` : `E${rank}`}
                </div>
             )}
             <h4 style={{ marginTop: '15px', color: 'var(--color-phosphor-dim)' }}>SKILLS</h4>
             <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                {skills.map(s => (
                   <div key={s.id}>{s.name} - {s.level}</div>
                ))}
             </div>
          </div>

          {/* TOGGLE TABS */}
          <div style={{ display: 'flex' }}>
             <button onClick={() => setActiveTab('logs')} style={{ flex: 1, padding: '5px', borderBottom: activeTab === 'logs' ? '1px solid transparent' : '1px solid var(--color-phosphor)', background: activeTab === 'logs' ? 'transparent' : 'rgba(0,0,0,0.5)' }}>LIFEPATH LOGS</button>
             <button onClick={() => setActiveTab('flowchart')} style={{ flex: 1, padding: '5px', borderBottom: activeTab === 'flowchart' ? '1px solid transparent' : '1px solid var(--color-phosphor)', background: activeTab === 'flowchart' ? 'transparent' : 'rgba(0,0,0,0.5)' }}>FLOWCHART</button>
          </div>

          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', padding: '20px', border: '1px solid var(--color-phosphor-dim)', borderTop: 'none', display: 'flex', flexDirection: 'column' }}>
             {activeTab === 'logs' && (
                <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.9rem', color: '#88dd88' }}>
                   {logs.map((L, i) => <div key={i} style={{ marginBottom: '5px' }}>&gt; {L}</div>)}
                </div>
             )}
             {activeTab === 'flowchart' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', height: '100%', overflowY: 'auto' }}>
                   <div style={{ padding: '10px', border: phase === 'STATS' ? '2px solid #00ff00' : '1px dashed var(--color-phosphor-dim)', color: phase === 'STATS' ? '#00ff00' : 'inherit', width: '80%', textAlign: 'center' }}>[1] ROLL STATS</div>
                   <span>↓</span>
                   <div style={{ padding: '10px', border: phase === 'BACKGROUND' ? '2px solid #00ff00' : '1px dashed var(--color-phosphor-dim)', color: phase === 'BACKGROUND' ? '#00ff00' : 'inherit', width: '80%', textAlign: 'center' }}>[2] BACKGROUND SKILLS</div>
                   <span>↓</span>
                   <div style={{ padding: '10px', border: phase === 'PRE_CAREER' ? '2px solid #00ff00' : '1px dashed var(--color-phosphor-dim)', color: phase === 'PRE_CAREER' ? '#00ff00' : 'inherit', width: '80%', textAlign: 'center' }}>[3] PRE-CAREER (OPTIONAL)</div>
                   <span>↓</span>
                   <div style={{ padding: '10px', border: phase === 'QUALIFICATION' ? '2px solid #00ff00' : '1px dashed var(--color-phosphor-dim)', color: phase === 'QUALIFICATION' ? '#00ff00' : 'inherit', width: '80%', textAlign: 'center' }}>[4] QUALIFICATION / DRAFT</div>
                   <span>↓</span>
                   <div style={{ padding: '10px', border: phase === 'TERM_LOOP' ? '2px solid #00ff00' : '1px dashed var(--color-phosphor-dim)', color: phase === 'TERM_LOOP' ? '#00ff00' : 'inherit', width: '80%', textAlign: 'center' }}>[5] TERM LOOP (SURVIVAL/EVENT)</div>
                   <span>↓</span>
                   <div style={{ padding: '10px', border: phase === 'COMMISSION_ADVANCEMENT' ? '2px solid #00ff00' : '1px dashed var(--color-phosphor-dim)', color: phase === 'COMMISSION_ADVANCEMENT' ? '#00ff00' : 'inherit', width: '80%', textAlign: 'center' }}>[6] RANK & COMMISSION</div>
                   <span>↓</span>
                   <div style={{ padding: '10px', border: phase === 'TERM_END' ? '2px solid #00ff00' : '1px dashed var(--color-phosphor-dim)', color: phase === 'TERM_END' ? '#00ff00' : 'inherit', width: '80%', textAlign: 'center' }}>[7] RE-ENLIST OR MUSTER</div>
                   <span>↓ (Muster Out)</span>
                   <div style={{ padding: '10px', border: (phase === 'MUSTERING_OUT' || phase === 'DONE') ? '2px solid #00ff00' : '1px dashed var(--color-phosphor-dim)', color: (phase === 'MUSTERING_OUT' || phase === 'DONE') ? '#00ff00' : 'inherit', width: '80%', textAlign: 'center' }}>[8] BENEFITS & SAVING</div>
                </div>
             )}
          </div>
       </div>
    </div>
  );
}
