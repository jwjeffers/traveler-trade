export type Characteristic = 'str' | 'dex' | 'end' | 'int' | 'edu' | 'soc';
export type SkillName = string; // e.g. 'Admin', 'Pilot'

export interface TableRoll {
  type: 'stat' | 'skill';
  value: string;
}

export interface CareerAssignment {
  id: string;
  name: string;
  survivalStat: Characteristic;
  survivalTarget: number;
  advancementStat: Characteristic;
  advancementTarget: number;
  ranks: string[]; // rank titles, index is rank level
  commissionStat?: Characteristic;
  commissionTarget?: number;
  officerRanks?: string[];
}

export interface Career {
  id: string;
  name: string;
  description: string;
  qualifyStat: Characteristic;
  qualifyTarget: number;
  assignments: CareerAssignment[];
  personalDevelopment: TableRoll[];
  serviceSkills: TableRoll[];
  advancedEducation: TableRoll[];
  mishaps: string[];
  events: string[];
  musteringOutCash: number[];
  musteringOutBenefits: string[];
}

export const CalculateDM = (score: number) => {
  return Math.floor((score - 6) / 2);
};

export const Roll2D6 = () => {
  return Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
};

export const Roll1D6 = () => {
  return Math.floor(Math.random() * 6) + 1;
}

export const BackgroundSkills = [
  'Admin', 'Animals', 'Art', 'Astrogation', 'Athletics', 'Broker', 
  'Carouse', 'Deception', 'Diplomat', 'Drive', 'Electronics', 'Flyer', 
  'Language', 'Mechanic', 'Medic', 'Profession', 'Science', 'Seafarer', 
  'Streetwise', 'Survival', 'Vacc Suit'
];

export const Careers: Record<string, Career> = {
  merchant: {
    id: 'merchant',
    name: 'Merchant',
    description: 'You are employed by a commercial enterprise or operate as an independent trader.',
    qualifyStat: 'int',
    qualifyTarget: 4,
    assignments: [
      { id: 'merchantMarine', name: 'Merchant Marine', survivalStat: 'int', survivalTarget: 5, advancementStat: 'int', advancementTarget: 7, ranks: ['Crew', 'Senior Crew', '4th Officer', '3rd Officer', '2nd Officer', '1st Officer', 'Captain'] },
      { id: 'freeTrader', name: 'Free Trader', survivalStat: 'dex', survivalTarget: 6, advancementStat: 'int', advancementTarget: 6, ranks: ['Tramp', '-', '-', '-', '-', '-', '-'] },
      { id: 'broker', name: 'Broker', survivalStat: 'edu', survivalTarget: 5, advancementStat: 'int', advancementTarget: 7, ranks: ['Agent', 'Experienced', 'Dealer', '-', '-', '-', '-'] }
    ],
    personalDevelopment: [ { type: 'stat', value: 'str' }, { type: 'stat', value: 'dex' }, { type: 'stat', value: 'end' }, { type: 'stat', value: 'int' }, { type: 'skill', value: 'Language' }, { type: 'skill', value: 'Streetwise' } ],
    serviceSkills: [ { type: 'skill', value: 'Drive' }, { type: 'skill', value: 'Vacc Suit' }, { type: 'skill', value: 'Broker' }, { type: 'skill', value: 'Steward' }, { type: 'skill', value: 'Electronics' }, { type: 'skill', value: 'Persuade' } ],
    advancedEducation: [ { type: 'skill', value: 'Engineer' }, { type: 'skill', value: 'Astrogation' }, { type: 'skill', value: 'Electronics' }, { type: 'skill', value: 'Pilot' }, { type: 'skill', value: 'Admin' }, { type: 'skill', value: 'Advocate' } ],
    mishaps: [
      "Disaster! You are bankrupted or fired. You must leave this career.",
      "Your ship is destroyed or extensively damaged. Lose 1 Benefit roll.",
      "A deal goes totally wrong. You are blamed. You must leave this career.",
      "You are betrayed by a friend or contact. Gain a Rival.",
      "Pirates or hijacked ship! You survive but the trauma is steep. Injured.",
      "A bureaucratic failure traps you in regulations. You are ousted."
    ],
    events: [
      "Disaster (Roll on mishap table, but you don't automatically leave).",
      "You make a lucrative deal. Gain +1 Benefit roll.",
      "You are offered the chance to smuggle illegal cargo. If taken, you make great cash but risk jail.",
      "You face a corporate or trader lawsuit. Gain Advocate 1 or an Enemy.",
      "A sudden boom in trade. Gain Broker 1 or Streetwise 1.",
      "You are entangled in political or corporate intrigue. Gain an Ally and a Rival.",
      "You develop connections with a wealthy trader. Gain $+10,000.",
      "Life Event. (Someone is born, dies, etc).",
      "You spend extensive time learning your trade. Gain +1 to any one skill you already have.",
      "You foil a piracy attempt or an underhanded deal. Gain a Contact and $+5,000.",
      "You acquire a small share in a ship or business. Gain +1 Benefit roll.",
      "Outstanding Performance. You are automatically promoted."
    ],
    musteringOutCash: [1000, 5000, 10000, 20000, 20000, 40000, 50000],
    musteringOutBenefits: ['Blade', 'Stat:int', 'Stat:edu', 'Gun', 'Weapon', 'Free Trader Port Access', 'Ship Share']
  },
  scout: {
    id: 'scout',
    name: 'Scout',
    description: 'You are an explorer, surveyor, or courier pushing the frontiers of known space.',
    qualifyStat: 'int',
    qualifyTarget: 5,
    assignments: [
      { id: 'courier', name: 'Courier', survivalStat: 'end', survivalTarget: 5, advancementStat: 'edu', advancementTarget: 9, ranks: ['-', '-', '-', '-', '-', '-', '-'] },
      { id: 'surveyor', name: 'Surveyor', survivalStat: 'end', survivalTarget: 6, advancementStat: 'int', advancementTarget: 9, ranks: ['-', 'Scout', 'Senior Scout', '-', '-', '-', '-'] },
      { id: 'explorer', name: 'Explorer', survivalStat: 'end', survivalTarget: 7, advancementStat: 'edu', advancementTarget: 7, ranks: ['-', 'Scout', 'Senior Scout', '-', '-', '-', '-'] }
    ],
    personalDevelopment: [ { type: 'stat', value: 'str' }, { type: 'stat', value: 'dex' }, { type: 'stat', value: 'end' }, { type: 'stat', value: 'int' }, { type: 'stat', value: 'edu' }, { type: 'skill', value: 'Jack-of-All-Trades' } ],
    serviceSkills: [ { type: 'skill', value: 'Survival' }, { type: 'skill', value: 'Vacc Suit' }, { type: 'skill', value: 'Astrogation' }, { type: 'skill', value: 'Pilot' }, { type: 'skill', value: 'Navigation' }, { type: 'skill', value: 'Mechanic' } ],
    advancedEducation: [ { type: 'skill', value: 'Medic' }, { type: 'skill', value: 'Electronics' }, { type: 'skill', value: 'Astrogation' }, { type: 'skill', value: 'Recon' }, { type: 'skill', value: 'Science' }, { type: 'skill', value: 'Diplomat' } ],
    mishaps: [
      "Disaster! Injured and discharged.",
      "Your ship takes severe damage. You are blamed and discharged.",
      "You discover something you shouldn't have known. Gain an Enemy and flee.",
      "Psychological issues from extended isolation. Leave the service.",
      "A mission goes catastrophically wrong. Lose all benefits from this term.",
      "A mix up leaves you stranded for years. Age 2 extra years and leave."
    ],
    events: [
      "Disaster (Roll on mishap table, but you don't automatically leave).",
      "You make contact with an alien race or strange culture. Gain a Contact.",
      "You survey an incredibly rich, virgin system. Gain $+10,000 bonus.",
      "You are stranded on a hostile world. Gain Survival 1.",
      "You perform a heroic rescue. Gain an Ally.",
      "You discover a valuable artifact or ancient ruin. Gain Science 1 or +1 Benefit roll.",
      "Life Event.",
      "You spend extensive time learning your trade. Gain +1 to any one skill.",
      "Your ship is upgraded or you work closely with a new prototype. Gain Mechanic 1.",
      "You form a deep bond with your crewmates. Gain an Ally.",
      "You are recognized for excellent service. Automatically promoted."
    ],
    musteringOutCash: [20000, 20000, 30000, 30000, 50000, 50000, 50000],
    musteringOutBenefits: ['Ship Share', 'Stat:int', 'Stat:edu', 'Weapon', 'Weapon', 'Scout Ship', 'Scout Ship']
  },
  citizen: {
    id: 'citizen',
    name: 'Citizen',
    description: 'You are an ordinary individual engaged in one of many trades or professions.',
    qualifyStat: 'edu',
    qualifyTarget: 5,
    assignments: [
      { id: 'corporate', name: 'Corporate', survivalStat: 'soc', survivalTarget: 6, advancementStat: 'int', advancementTarget: 6, ranks: ['Associate', 'Manager', 'Executive', 'Senior Exec', 'Director', 'VP', 'CEO'] },
      { id: 'worker', name: 'Worker', survivalStat: 'end', survivalTarget: 4, advancementStat: 'edu', advancementTarget: 8, ranks: ['-', 'Foreman', 'Supervisor', '-', '-', '-', '-'] },
      { id: 'colonist', name: 'Colonist', survivalStat: 'end', survivalTarget: 5, advancementStat: 'end', advancementTarget: 7, ranks: ['-', '-', 'Leader', '-', '-', '-', '-'] }
    ],
    personalDevelopment: [ { type: 'stat', value: 'edu' }, { type: 'stat', value: 'int' }, { type: 'skill', value: 'Carouse' }, { type: 'skill', value: 'Gambler' }, { type: 'skill', value: 'Drive' }, { type: 'skill', value: 'Jack-of-All-Trades' } ],
    serviceSkills: [ { type: 'skill', value: 'Drive' }, { type: 'skill', value: 'Flyer' }, { type: 'skill', value: 'Streetwise' }, { type: 'skill', value: 'Melee' }, { type: 'skill', value: 'Steward' }, { type: 'skill', value: 'Profession' } ],
    advancedEducation: [ { type: 'skill', value: 'Art' }, { type: 'skill', value: 'Advocate' }, { type: 'skill', value: 'Diplomat' }, { type: 'skill', value: 'Language' }, { type: 'skill', value: 'Admin' }, { type: 'skill', value: 'Broker' } ],
    mishaps: [
      "Severe illness or injury. Discharged.",
      "Your colony or workplace is destroyed. Flee.",
      "You are framed for a corporate crime. Gain an Enemy and lose your job.",
      "A massive recession hits. You are laid off.",
      "An unresolvable dispute with a local authority or gang. Flee or die.",
      "Betrayed by a close associate. Discharged."
    ],
    events: [
      "Disaster (Roll on mishap table, but you don't automatically leave).",
      "You do something that betters your society. Gain +1 SOC.",
      "You uncover a corporate or political secret. Gain a Contact or Enemy.",
      "You are drawn into local politics. Gain Advocate 1 or Persuade 1.",
      "Your business venture thrives. Gain $+5,000.",
      "You befriend a person of deep influence. Gain an Ally.",
      "Life Event.",
      "You spend extensive time learning. Gain +1 to any skill.",
      "A major technological or social shift. Gain Science 1 or Electronics 1.",
      "You perform a critical community service. Gain a Contact.",
      "Outstanding performance. Automatically promoted."
    ],
    musteringOutCash: [1000, 5000, 10000, 10000, 10000, 50000, 100000],
    musteringOutBenefits: ['Ship Share', 'Stat:soc', 'Stat:int', 'Gun', 'TAS Membership', 'TAS Membership', 'High Passage']
  },
  drifter: {
    id: 'drifter',
    name: 'Drifter',
    description: 'You are a wanderer, scraping by on the fringes of society. (FALLBACK CAREER)',
    qualifyStat: 'str', // Automatically succeed if forced
    qualifyTarget: 0,
    assignments: [
      { id: 'wanderer', name: 'Wanderer', survivalStat: 'end', survivalTarget: 7, advancementStat: 'int', advancementTarget: 7, ranks: ['-', '-', '-', '-', '-', '-', '-'] }
    ],
    personalDevelopment: [ { type: 'stat', value: 'str' }, { type: 'stat', value: 'end' }, { type: 'stat', value: 'dex' }, { type: 'skill', value: 'Language' }, { type: 'skill', value: 'Profession' }, { type: 'skill', value: 'Jack-of-All-Trades' } ],
    serviceSkills: [ { type: 'skill', value: 'Athletics' }, { type: 'skill', value: 'Melee' }, { type: 'skill', value: 'Recon' }, { type: 'skill', value: 'Streetwise' }, { type: 'skill', value: 'Stealth' }, { type: 'skill', value: 'Survival' } ],
    advancedEducation: [ { type: 'skill', value: 'Navigation' }, { type: 'skill', value: 'Medic' }, { type: 'skill', value: 'Electronics' }, { type: 'skill', value: 'Mechanic' }, { type: 'skill', value: 'Broker' }, { type: 'skill', value: 'Astrogation' } ],
    mishaps: [ "Attacked and left for dead.", "Law enforcement hassles you.", "Scammed out of everything.", "Harsh environment takes its toll.", "Arrested.", "A terrible accident occurs." ],
    events: [ "Disaster.", "Find a mentor. Gain a skill.", "Perform a great feat. Gain Ally.", "Work pays off. Gain +1 Benefit.", "Hard times. Survive.", "Hard times. Survive.", "Life Event.", "Find something valuable.", "Make a contact.", "Make a rival.", "Promoted automatically." ],
    musteringOutCash: [0, 0, 1000, 2000, 3000, 4000, 8000],
    musteringOutBenefits: ['Contact', 'Weapon', 'Ally', 'Weapon', 'Stat:edu', 'Two Ship Shares', 'Unknown Relic']
  },
  navy: {
    id: 'navy',
    name: 'Navy',
    description: 'Members of the interstellar space navy, engaging in combat and exploration.',
    qualifyStat: 'int',
    qualifyTarget: 6,
    assignments: [
      { 
        id: 'line', 
        name: 'Line / Crew', 
        survivalStat: 'int', survivalTarget: 5, 
        advancementStat: 'edu', advancementTarget: 7, 
        ranks: ['Spacehand Recruit', 'Spacehand Apprentice', 'Able Spacehand', 'Petty Officer 3rd', 'Petty Officer 2nd', 'Petty Officer 1st', 'Chief Petty Officer'],
        commissionStat: 'soc', commissionTarget: 8,
        officerRanks: ['Ensign', 'Sublieutenant', 'Lieutenant', 'Commander', 'Captain', 'Admiral']
      }
    ],
    personalDevelopment: [ { type: 'stat', value: 'str' }, { type: 'stat', value: 'dex' }, { type: 'stat', value: 'end' }, { type: 'stat', value: 'int' }, { type: 'stat', value: 'edu' }, { type: 'stat', value: 'soc' } ],
    serviceSkills: [ { type: 'skill', value: 'Pilot' }, { type: 'skill', value: 'Vacc Suit' }, { type: 'skill', value: 'Athletics' }, { type: 'skill', value: 'Gunner' }, { type: 'skill', value: 'Mechanic' }, { type: 'skill', value: 'Gun Combat' } ],
    advancedEducation: [ { type: 'skill', value: 'Electronics' }, { type: 'skill', value: 'Astrogation' }, { type: 'skill', value: 'Engineer' }, { type: 'skill', value: 'Drive' }, { type: 'skill', value: 'Navigation' }, { type: 'skill', value: 'Admin' } ],
    mishaps: [ "Severely injured in combat.", "Take the blame for a friendly fire incident.", "Spacecraft is destroyed.", "Captured by enemies.", "Mutiny or court martial.", "Bad physiological reaction to anti-rad drugs." ],
    events: [ "Disaster.", "Foiled a crime. Gain Ally.", "Advanced training. Gain skill.", "Heroism. Gain $+10,000.", "Secret mission.", "Diplomatic duty.", "Life Event.", "Serve on a prestigious vessel.", "Commanding officer takes an interest.", "Combat engagement.", "Outstanding performance!" ],
    musteringOutCash: [1000, 5000, 5000, 10000, 20000, 50000, 50000],
    musteringOutBenefits: ['TAS Membership', 'Stat:int', 'Stat:edu', 'Weapon', 'TAS Membership', 'Ship\'s Boat', 'Two Ship Shares']
  },
  agent: {
    id: 'agent',
    name: 'Agent',
    description: 'Law enforcement or intelligence operative dealing with threats to society.',
    qualifyStat: 'int', qualifyTarget: 6,
    assignments: [
      { id: 'law', name: 'Law Enforcement', survivalStat: 'end', survivalTarget: 6, advancementStat: 'int', advancementTarget: 6, ranks: ['Rookie', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain', 'Chief', 'Commissioner'] },
      { id: 'intel', name: 'Intelligence', survivalStat: 'int', survivalTarget: 7, advancementStat: 'int', advancementTarget: 5, ranks: ['Operative', 'Field Agent', 'Special Agent', 'Section Chief', 'Director', 'Deputy', 'Director General'] }
    ],
    personalDevelopment: [ { type: 'stat', value: 'str' }, { type: 'stat', value: 'dex' }, { type: 'stat', value: 'end' }, { type: 'stat', value: 'int' }, { type: 'stat', value: 'edu' }, { type: 'stat', value: 'soc' } ],
    serviceSkills: [ { type: 'skill', value: 'Streetwise' }, { type: 'skill', value: 'Drive' }, { type: 'skill', value: 'Investigate' }, { type: 'skill', value: 'Flyer' }, { type: 'skill', value: 'Recon' }, { type: 'skill', value: 'Gun Combat' } ],
    advancedEducation: [ { type: 'skill', value: 'Advocate' }, { type: 'skill', value: 'Language' }, { type: 'skill', value: 'Computers' }, { type: 'skill', value: 'Medic' }, { type: 'skill', value: 'Deception' }, { type: 'skill', value: 'Admin' } ],
    mishaps: [ "Severe injury in the line of duty.", "Cover blown. Mission compromised.", "Betrayed by a contact.", "Political fallout. You are scapegoated.", "Kidnapped and tortured.", "Mental breakdown from stress." ],
    events: [ "Disaster.", "Completed a tough case. Gain Ally.", "Advanced training. Gain skill.", "Commendation. Gain $+10000.", "Undercover mission.", "Desk job.", "Life Event.", "Saved a VIP.", "Foiled a conspiracy.", "Corruption everywhere.", "Outstanding performance!" ],
    musteringOutCash: [1000, 2000, 5000, 7500, 10000, 25000, 50000],
    musteringOutBenefits: ['Weapon', 'Contact', 'Stat:int', 'Weapon', 'Ally', 'Ship Share', 'High Passage']
  },
  army: {
    id: 'army',
    name: 'Army',
    description: 'Members of the planetary or imperial armed planetary forces.',
    qualifyStat: 'end', qualifyTarget: 5,
    assignments: [
      { 
        id: 'infantry', name: 'Infantry', 
        survivalStat: 'str', survivalTarget: 6, 
        advancementStat: 'edu', advancementTarget: 7,
        ranks: ['Private', 'Lance Corporal', 'Corporal', 'Sergeant', 'Staff Sergeant', 'Gunnery Sergeant', 'Sergeant Major'],
        commissionStat: 'soc', commissionTarget: 8,
        officerRanks: ['Lieutenant', 'Captain', 'Major', 'Lt Colonel', 'Colonel', 'General']
      }
    ],
    personalDevelopment: [ { type: 'stat', value: 'str' }, { type: 'stat', value: 'dex' }, { type: 'stat', value: 'end' }, { type: 'skill', value: 'Athletics' }, { type: 'skill', value: 'Melee' }, { type: 'skill', value: 'Gun Combat' } ],
    serviceSkills: [ { type: 'skill', value: 'Drive' }, { type: 'skill', value: 'Athletics' }, { type: 'skill', value: 'Gunner' }, { type: 'skill', value: 'Recon' }, { type: 'skill', value: 'Melee' }, { type: 'skill', value: 'Heavy Weapons' } ],
    advancedEducation: [ { type: 'skill', value: 'Tactics' }, { type: 'skill', value: 'Electronics' }, { type: 'skill', value: 'Navigation' }, { type: 'skill', value: 'Explosives' }, { type: 'skill', value: 'Engineer' }, { type: 'skill', value: 'Survival' } ],
    mishaps: [ "Severe injury in combat.", "Your unit is wiped out.", "Friendly fire incident.", "Captured by enemies.", "Court martialed.", "Suffered PTSD." ],
    events: [ "Disaster.", "Hero in battle. Gain Ally.", "Special forces training. Gain skill.", "Decorated. Gain $+10000.", "Garrison duty.", "Peacekeeping mission.", "Life Event.", "Saved your commanding officer.", "Surrounded and cut off.", "Brutal campaign.", "Outstanding performance!" ],
    musteringOutCash: [1000, 2000, 5000, 10000, 10000, 20000, 30000],
    musteringOutBenefits: ['Weapon', 'Stat:str', 'Stat:end', 'Armor', 'Weapon', 'Ship Share', 'High Passage']
  },
  entertainer: {
    id: 'entertainer',
    name: 'Entertainer',
    description: 'Individuals acting, singing, or performing in sports across the stars.',
    qualifyStat: 'int', qualifyTarget: 5,
    assignments: [
      { id: 'artist', name: 'Artist', survivalStat: 'soc', survivalTarget: 5, advancementStat: 'int', advancementTarget: 6, ranks: ['Amateur', 'Talent', 'Professional', 'Recognized', 'Famous', 'Celebrity', 'Icon'] }
    ],
    personalDevelopment: [ { type: 'stat', value: 'dex' }, { type: 'stat', value: 'int' }, { type: 'stat', value: 'soc' }, { type: 'skill', value: 'Language' }, { type: 'skill', value: 'Carouse' }, { type: 'skill', value: 'Persuade' } ],
    serviceSkills: [ { type: 'skill', value: 'Art' }, { type: 'skill', value: 'Athletics' }, { type: 'skill', value: 'Deception' }, { type: 'skill', value: 'Stealth' }, { type: 'skill', value: 'Profession' }, { type: 'skill', value: 'Carouse' } ],
    advancedEducation: [ { type: 'skill', value: 'Art' }, { type: 'skill', value: 'Streetwise' }, { type: 'skill', value: 'Broker' }, { type: 'skill', value: 'Language' }, { type: 'skill', value: 'Admin' }, { type: 'skill', value: 'Science' } ],
    mishaps: [ "Public scandal.", "Financially ruined.", "Sued for plagiarism.", "Critic shreds your reputation.", "Banned from core worlds.", "Accident ruins a performance." ],
    events: [ "Disaster.", "Hit performance! Gain Ally.", "Learn a new art form. Gain skill.", "Lucrative contrct. Gain $+10000.", "Touring in deep space.", "Hired by a noble.", "Life Event.", "Stalker causes problems.", "Award winning.", "Blackmailed.", "Outstanding performance!" ],
    musteringOutCash: [0, 0, 1000, 5000, 10000, 40000, 100000],
    musteringOutBenefits: ['Contact', 'Stat:soc', 'Ally', 'Stat:int', 'Contact', 'Yacht Share', 'Two Yacht Shares']
  },
  marine: {
    id: 'marine',
    name: 'Marine',
    description: 'Elite forces carried aboard naval vessels, experts in boarding and planetary assault.',
    qualifyStat: 'end', qualifyTarget: 6,
    assignments: [
      { 
        id: 'starMarine', name: 'Star Marine', 
        survivalStat: 'end', survivalTarget: 6, 
        advancementStat: 'edu', advancementTarget: 6,
        ranks: ['Marine', 'Lance Corporal', 'Corporal', 'Sergeant', 'Gunnery Sergeant', 'Sergeant Major', 'Force Sergeant Major'],
        commissionStat: 'soc', commissionTarget: 8,
        officerRanks: ['Lieutenant', 'Captain', 'Major', 'Lt Colonel', 'Colonel', 'Brigadier']
      }
    ],
    personalDevelopment: [ { type: 'stat', value: 'str' }, { type: 'stat', value: 'dex' }, { type: 'stat', value: 'end' }, { type: 'skill', value: 'Gambler' }, { type: 'skill', value: 'Melee' }, { type: 'skill', value: 'Melee' } ],
    serviceSkills: [ { type: 'skill', value: 'Athletics' }, { type: 'skill', value: 'Vacc Suit' }, { type: 'skill', value: 'Tactics' }, { type: 'skill', value: 'Heavy Weapons' }, { type: 'skill', value: 'Gun Combat' }, { type: 'skill', value: 'Gun Combat' } ],
    advancedEducation: [ { type: 'skill', value: 'Medic' }, { type: 'skill', value: 'Survival' }, { type: 'skill', value: 'Explosives' }, { type: 'skill', value: 'Engineer' }, { type: 'skill', value: 'Pilot' }, { type: 'skill', value: 'Astrogation' } ],
    mishaps: [ "Missing limb or severe injury.", "Unit wiped out in Drop Assault.", "Spacecraft destroyed.", "Captured by enemies.", "Refused an illegal order.", "Caught in a bioweapon attack." ],
    events: [ "Disaster.", "Hero in boarding action. Gain Ally.", "Special forces training. Gain skill.", "Decorated. Gain $+10000.", "Shipboard security.", "Planetary assault.", "Life Event.", "Saved a comrade.", "Surrounded and cut off.", "Brutal campaign.", "Outstanding performance!" ],
    musteringOutCash: [1000, 2000, 5000, 10000, 15000, 30000, 40000],
    musteringOutBenefits: ['Weapon', 'Armor', 'Stat:end', 'Weapon', 'Armor', 'Ship Share', 'High Passage']
  },
  nobility: {
    id: 'nobility',
    name: 'Nobility',
    description: 'Individuals holding high social standing, wealth, and power in the Imperium.',
    qualifyStat: 'soc', qualifyTarget: 10,
    assignments: [
      { id: 'administrator', name: 'Administrator', survivalStat: 'int', survivalTarget: 4, advancementStat: 'edu', advancementTarget: 6, ranks: ['-', 'Clerk', 'Secretary', 'Minister', 'Duke', 'Archduke', 'Emperor'] }
    ],
    personalDevelopment: [ { type: 'stat', value: 'str' }, { type: 'stat', value: 'dex' }, { type: 'stat', value: 'end' }, { type: 'stat', value: 'int' }, { type: 'stat', value: 'edu' }, { type: 'stat', value: 'soc' } ],
    serviceSkills: [ { type: 'skill', value: 'Admin' }, { type: 'skill', value: 'Advocate' }, { type: 'skill', value: 'Carouse' }, { type: 'skill', value: 'Persuade' }, { type: 'skill', value: 'Leadership' }, { type: 'skill', value: 'Diplomat' } ],
    advancedEducation: [ { type: 'skill', value: 'Admin' }, { type: 'skill', value: 'Advocate' }, { type: 'skill', value: 'Language' }, { type: 'skill', value: 'Broker' }, { type: 'skill', value: 'Diplomat' }, { type: 'skill', value: 'Science' } ],
    mishaps: [ "Assassination attempt injures you.", "Stripped of title.", "Bankrupted.", "Family disgrace.", "Exiled from court.", "Caught in a revolution." ],
    events: [ "Disaster.", "Form a powerful alliance. Gain Ally.", "Intensive tutoring. Gain skill.", "Inheritance. Gain $+50000.", "Diplomatic mission.", "Host a grand gala.", "Life Event.", "Target of a scheme.", "Discover a secret.", "Expand your influence.", "Outstanding performance!" ],
    musteringOutCash: [5000, 10000, 50000, 50000, 100000, 100000, 200000],
    musteringOutBenefits: ['Yacht Share', 'Two Yacht Shares', 'Stat:soc', 'High Passage', 'High Passage', 'Yacht', 'Estate']
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    description: 'Criminals, thieves, and outlaws operating outside the bounds of the law.',
    qualifyStat: 'dex', qualifyTarget: 6,
    assignments: [
      { id: 'thief', name: 'Thief', survivalStat: 'dex', survivalTarget: 6, advancementStat: 'int', advancementTarget: 6, ranks: ['Henchman', 'Lookout', 'Footpad', 'Burglar', 'Master Thief', 'Lieutenant', 'Crime Boss'] }
    ],
    personalDevelopment: [ { type: 'stat', value: 'str' }, { type: 'stat', value: 'dex' }, { type: 'stat', value: 'end' }, { type: 'stat', value: 'int' }, { type: 'skill', value: 'Carouse' }, { type: 'skill', value: 'Melee' } ],
    serviceSkills: [ { type: 'skill', value: 'Deception' }, { type: 'skill', value: 'Recon' }, { type: 'skill', value: 'Athletics' }, { type: 'skill', value: 'Stealth' }, { type: 'skill', value: 'Streetwise' }, { type: 'skill', value: 'Gun Combat' } ],
    advancedEducation: [ { type: 'skill', value: 'Electronics' }, { type: 'skill', value: 'Mechanic' }, { type: 'skill', value: 'Medic' }, { type: 'skill', value: 'Investigate' }, { type: 'skill', value: 'Advocate' }, { type: 'skill', value: 'Broker' } ],
    mishaps: [ "Severely injured by rivals.", "Betrayed by gang. Lose ally.", "Busted. Go to prison.", "Stole from the wrong person.", "Heist goes terribly wrong.", "Bounty put on you." ],
    events: [ "Disaster.", "Massive payout! Gain $+10000.", "Learned from a master. Gain skill.", "Perfect heist.", "Smuggling run.", "Laying low.", "Life Event.", "Made a powerful enemy.", "Taken in by syndicate.", "Double crossed.", "Outstanding performance!" ],
    musteringOutCash: [0, 0, 1000, 10000, 20000, 50000, 100000],
    musteringOutBenefits: ['Weapon', 'Contact', 'Stat:str', 'Stat:dex', 'Ship Share', 'High Passage', 'Corsair']
  },
  scholar: {
    id: 'scholar',
    name: 'Scholar',
    description: 'Researchers and scientists studying the universe and its secrets.',
    qualifyStat: 'int', qualifyTarget: 6,
    assignments: [
      { id: 'scientist', name: 'Scientist', survivalStat: 'edu', survivalTarget: 4, advancementStat: 'int', advancementTarget: 8, ranks: ['Assistant', 'Researcher', 'Post-Doc', 'Senior Researcher', 'Lead Scientist', 'Department Head', 'Institute Director'] }
    ],
    personalDevelopment: [ { type: 'stat', value: 'int' }, { type: 'stat', value: 'edu' }, { type: 'stat', value: 'soc' }, { type: 'skill', value: 'Language' }, { type: 'skill', value: 'Computers' }, { type: 'skill', value: 'Science' } ],
    serviceSkills: [ { type: 'skill', value: 'Admin' }, { type: 'skill', value: 'Science' }, { type: 'skill', value: 'Science' }, { type: 'skill', value: 'Computers' }, { type: 'skill', value: 'Investigate' }, { type: 'skill', value: 'Electronics' } ],
    advancedEducation: [ { type: 'skill', value: 'Science' }, { type: 'skill', value: 'Engineer' }, { type: 'skill', value: 'Navigation' }, { type: 'skill', value: 'Medic' }, { type: 'skill', value: 'Advocate' }, { type: 'skill', value: 'Language' } ],
    mishaps: [ "Lab explosion.", "Funding pulled.", "Research stolen.", "Exiled for unethical experiments.", "Expedition disaster.", "Driven out of academy." ],
    events: [ "Disaster.", "Publish revolutionary paper.", "Sent to exotic conference. Gain skill.", "Major grant. Gain $+10000.", "Arduous field research.", "Tedious teaching duty.", "Life Event.", "Discovered a new phenomenon.", "Rival steals your credit.", "Breakthrough.", "Outstanding performance!" ],
    musteringOutCash: [1000, 5000, 10000, 20000, 30000, 40000, 60000],
    musteringOutBenefits: ['Contact', 'Stat:int', 'Stat:edu', 'Computer', 'Science Equip', 'Lab Ship Share', 'Two Lab Ship Shares']
  }
};

export const PreCareers = {
  university: {
    name: "University",
    entryStat: "edu" as Characteristic,
    entryTarget: 7,
    graduationStat: "int" as Characteristic,
    graduationTarget: 7,
  },
  militaryAcademy: {
    name: "Military Academy",
    entryStat: "end" as Characteristic,
    entryTarget: 8,
    graduationStat: "int" as Characteristic,
    graduationTarget: 8,
  }
};

