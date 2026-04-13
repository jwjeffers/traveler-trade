export const rollD6 = (): number => Math.floor(Math.random() * 6) + 1;

export const rollD66 = (): number => {
  const tens = rollD6() * 10;
  const ones = rollD6();
  return tens + ones;
};

export const rollD66String = (): string => rollD66().toString();

export const PATRONS: Record<string, string> = {
  "11": "Assassin", "12": "Belter", "13": "Broker", "14": "Bureaucrat", "15": "Clerk", "16": "Cleric",
  "21": "Corporate Executive", "22": "Corporate Reporter", "23": "Corporate Secretary", "24": "Corsair", "25": "Criminal Syndicate", "26": "Cultist",
  "31": "Diplomat", "32": "Doctor", "33": "Eccentric", "34": "Engineer", "35": "Entertainer", "36": "Ex-Scout",
  "41": "Free Trader", "42": "Government Official", "43": "Heir", "44": "Investigator", "45": "Major Noble", "46": "Marine Officer",
  "51": "Mercenary", "52": "Minor Noble", "53": "Naval Officer", "54": "Physician", "55": "Planetary Governor", "56": "Police Officer",
  "61": "Researcher", "62": "Scientist", "63": "Scout", "64": "Smuggler", "65": "Speculator", "66": "Worker"
};

export const MISSIONS: Record<string, string> = {
  "11": "Assassinate a target", "12": "Frame a target", "13": "Destroy a target", "14": "Steal from a target", "15": "Aid in a burglary", "16": "Stop a burglary",
  "21": "Retrieve data or an object", "22": "Smuggle data or an object", "23": "Escort a VIP", "24": "Defend a target", "25": "Explore a new sector", "26": "Find a lost objective",
  "31": "Investigate a crime", "32": "Investigate an anomaly", "33": "Spy on a target", "34": "Transport a VIP safely", "35": "Transport goods secretly", "36": "Transport dangerous goods",
  "41": "Rescue a captive", "42": "Rescue a stranded vessel", "43": "Sabotage a facility", "44": "Hijack a ship", "45": "Protect a target", "46": "Blackmail a target",
  "51": "Bribe a target", "52": "Intimidate a target", "53": "Infiltrate a facility", "54": "Distract opposition", "55": "Serve as a decoy", "56": "Ferry a target secretly",
  "61": "Hunt a dangerous animal", "62": "Explore an ancient ruin", "63": "Resolve a local dispute", "64": "Test an experimental ship/weapon", "65": "Recover a derelict", "66": "Transport passengers or cargo"
};

export const TARGETS: Record<string, string> = {
  "11": "Local Animal or Creature", "12": "Ancient Artifact", "13": "Antique Item", "14": "Bank / Financial Institution", "15": "Military Base / Installation", "16": "Bunker / Safehouse",
  "21": "Corporate Executive / VIP", "22": "Computer System / Database", "23": "Crime Lord / Syndicate Boss", "24": "Cult / Secret Society", "25": "Cure / Vaccine", "26": "Data Disk / Encrypted File",
  "31": "Diplomat / Ambassador", "32": "Doctor / Medical Expert", "33": "Entertainer / Celebrity", "34": "Expedition / Researchers", "35": "Fake Goods / Forgeries", "36": "Family Member",
  "41": "Historical Monument", "42": "Illegal Narcotics / Contraband", "43": "Military Secrets", "44": "Noble / Royal Figure", "45": "Ores / Precious Metals", "46": "Patron / The Client Themselves",
  "51": "Planetary Governor", "52": "Police / Security Checkpoint", "53": "Political Faction / Party", "54": "Refugees / Exiles", "55": "Religious Relic", "56": "Scientist / Inventor",
  "61": "Derelict Starship", "62": "Pirate Starship", "63": "Military Starship", "64": "Advanced Technology", "65": "Valuable Cargo / Freight", "66": "Land Vehicle / Grav Craft"
};

export const OPPOSITION: Record<string, string> = {
  "11": "Animals / Wildlife", "12": "Hostile Aliens", "13": "Hostile Environment (Weather, Radiation)", "14": "Local Law Enforcement", "15": "Imperial Navy", "16": "Imperial Marines",
  "21": "Corporate Security Forces", "22": "Bounty Hunters", "23": "Criminal Syndicate", "24": "Sector Privateers / Pirates", "25": "Religious Fanatics", "26": "Political Terrorists",
  "31": "The Targets themselves", "32": "A rival Mercenary Group", "33": "Secret Society", "34": "Corrupt Officials", "35": "Automated Security / Drones", "36": "Disease / Viral Outbreak",
  "41": "Local Militia", "42": "Planetary Army", "43": "Rebel Faction", "44": "A completely unrelated third party", "45": "The Patron's own organization", "46": "Vampire Fleet / Rogue AI",
  "51": "Mutants / Genetic Aberrations", "52": "Ancient Defenses", "53": "Starport Authorities", "54": "Customs Officials", "55": "Undercover Agents / Spies", "56": "Smugglers",
  "61": "Bored Nobles looking for sport", "62": "A powerful Psychic / Psion", "63": "Angry Mob / Rioting Citizens", "64": "Rival Explorers", "65": "Debt Collectors", "66": "The Patron is actually the opposition"
};

export const COMPLICATIONS: string[] = [
  "The job is exactly as it appears. No hidden surprises.",
  "The job is a setup or trap. The patron intends to betray the characters.",
  "A third party is also involved and wants the same objective.",
  "The original target is not what was expected (e.g., an animal instead of a person, a fake item).",
  "The law or police are already involved and watching the situation.",
  "The job takes much longer, or forces the crew into a much more dangerous environment than agreed upon."
];

export interface MissionProfile {
  id: string;
  patronRoll: string;
  patron: string;
  missionRoll: string;
  mission: string;
  targetRoll: string;
  target: string;
  oppositionRoll: string;
  opposition: string;
  complicationRoll: number;
  complication: string;
  rewardBase: number;
  assignedLocation?: string;
}

export const generateMissionProfile = (): MissionProfile => {
  const patronRoll = rollD66String();
  const missionRoll = rollD66String();
  const targetRoll = rollD66String();
  const oppositionRoll = rollD66String();
  const complicationRoll = rollD6();
  
  // Basic scaling reward 5000 to 50000 Cr as a simple starting point.
  const rewardBase = (rollD6() * 5000) + (rollD6() * 2000);

  return {
    id: Date.now().toString(),
    patronRoll,
    patron: PATRONS[patronRoll] || "Unknown",
    missionRoll,
    mission: MISSIONS[missionRoll] || "Unknown",
    targetRoll,
    target: TARGETS[targetRoll] || "Unknown",
    oppositionRoll,
    opposition: OPPOSITION[oppositionRoll] || "Unknown",
    complicationRoll,
    complication: COMPLICATIONS[complicationRoll - 1],
    rewardBase
  };
};
