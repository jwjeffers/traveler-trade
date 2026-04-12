export interface Faction {
  name: string;
  power: string;
  type: string;
}

export interface WorldData {
  id: string;
  name: string;
  hex: string;
  uwp: string;
  size: number;
  atmosphere: number;
  temperature: number;
  temperatureClass?: string;
  hydrographics: number;
  population: number;
  government: number;
  governmentType?: string;
  lawLevel: number;
  starport: string;
  starportDetails?: string;
  techLevel: number;
  tradeCodes: string[];
  hasGasGiant?: boolean;
  bases?: string[];
  lore?: string;
  factions?: Faction[];
  culture?: string;
}

export const roll = (dice: number, sides: number = 6): number => {
  let total = 0;
  for (let i = 0; i < dice; i++) total += Math.floor(Math.random() * sides) + 1;
  return total;
};

const SYLLABLES_1 = ["A", "Al", "An", "Ar", "As", "Be", "Bo", "Ca", "Co", "De", "Do", "E", "El", "En", "Es", "Fa", "Fo", "Ga", "Go", "In", "Is", "Ka", "Ko", "Ma", "Mo", "Na", "Ne", "O", "Om", "Pa", "Qu", "Ra", "Re", "Sa", "So", "Ta", "Te", "U", "Ur", "Va", "Za", "Zir", "Xen"];
const SYLLABLES_2 = ["bar", "bor", "can", "cor", "dan", "dar", "dor", "fen", "gan", "gar", "len", "lan", "min", "mon", "nan", "nor", "pen", "pan", "ran", "ron", "sen", "san", "tan", "tor", "van", "vor", "zan", "zor", "gantu", "lax", "tix", "vox", "nix", "lux", "dox", "ros", "rus"];

export const generateRandomName = (): string => {
   const s1 = SYLLABLES_1[Math.floor(Math.random() * SYLLABLES_1.length)];
   const s2 = SYLLABLES_2[Math.floor(Math.random() * SYLLABLES_2.length)];
   const suffix = Math.random() > 0.7 ? ["ia", "a", "us", "on", " Prime", " Major", " Minor", " Secundus"][Math.floor(Math.random() * 8)] : "";
   return s1 + s2 + suffix;
};

export const toPseudoHex = (val: number): string => {
  if (val < 0) return '0';
  if (val > 33) return 'Z';
  return "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"[val] || '0';
};

export const calculateTradeCodes = (w: Partial<WorldData>): string[] => {
  const codes: string[] = [];
  const { size = 0, atmosphere = 0, hydrographics = 0, population = 0, government = 0 } = w;

  if (atmosphere >= 4 && atmosphere <= 9 && hydrographics >= 4 && hydrographics <= 8 && population >= 5 && population <= 7) codes.push("Ag");
  if (size === 0 && atmosphere === 0 && hydrographics === 0) codes.push("As");
  if (population === 0 && government === 0) codes.push("Ba");
  if (atmosphere >= 2 && atmosphere <= 9 && hydrographics === 0) codes.push("De");
  if (atmosphere >= 10 && hydrographics >= 1) codes.push("Fl");
  if (size >= 5 && atmosphere >= 4 && atmosphere <= 9 && hydrographics >= 4 && hydrographics <= 8) codes.push("Ga");
  if (population >= 9) codes.push("Hi");
  if (atmosphere <= 1 && hydrographics >= 1) codes.push("Ic");
  if ([0, 1, 2, 4, 7, 9].includes(atmosphere) && population >= 9) codes.push("In");
  if (population >= 1 && population <= 3) codes.push("Lo");
  if (atmosphere <= 3 && hydrographics <= 3 && population >= 6) codes.push("Na");
  if (population >= 4 && population <= 6) codes.push("Ni");
  if (atmosphere >= 2 && atmosphere <= 5 && hydrographics <= 3) codes.push("Po");
  if ([6, 8].includes(atmosphere) && population >= 6 && population <= 8 && government >= 4 && government <= 9) codes.push("Ri");
  if (atmosphere === 0) codes.push("Va");
  if (hydrographics >= 10) codes.push("Wa");
  return codes;
};

export const generateUWPString = (w: Partial<WorldData>): string => {
  return `${w.starport || 'X'}${toPseudoHex(w.size || 0)}${toPseudoHex(w.atmosphere || 0)}${toPseudoHex(w.hydrographics || 0)}${toPseudoHex(w.population || 0)}${toPseudoHex(w.government || 0)}${toPseudoHex(w.lawLevel || 0)}-${toPseudoHex(w.techLevel || 0)}`;
};

export const GOV_TYPES = [
    "No Government Structure", "Company/Corporation", "Participating Democracy", "Self-Perpetuating Oligarchy",
    "Representative Democracy", "Feudal Technocracy", "Captive Government", "Balkanisation",
    "Civil Service Bureaucracy", "Impersonal Bureaucracy", "Charismatic Dictator", "Non-Charismatic Leader",
    "Charismatic Oligarchy", "Religious Dictatorship", "Religious Autocracy", "Totalitarian Oligarchy"
];

const STARPORT_DETAILS: Record<string, string> = {
    'A': "Excellent quality facility handling major traffic. Features unrefined and refined fuel, a shipyard capable of both starship and small craft construction, and annual maintenance overhaul bays.",
    'B': "Good quality facility. Features unrefined and refined fuel, a shipyard capable of small craft construction, and full annual maintenance capabilities.",
    'C': "Routine quality facility. Only unrefined fuel is available. Shipyard capable of reasonable repairs, though not construction.",
    'D': "Poor quality facility. Features unrefined fuel but lacks dedicated repair or maintenance shipyard capabilities.",
    'E': "Frontier Installation. A bare patch of bedrock cleared for landing. No fuel, facilities, or bases.",
    'X': "No Starport. Absolutely no landing provisions are made."
};

const CULTURE_TABLE = [
    "Sexist", "Religious", "Artistic", "Ritualised", "Conservative", "Xenophobic",
    "Taboo", "Deceptive", "Liberal", "Honourable", "Influenced", "Fusion",
    "Synergistic", "Peaceful", "Obsessed", "Fashion", "Atavistic", "Progressive",
    "Recovering", "Nexus", "Tourist Attraction", "Violent", "Caste System", "Ritual Combat",
    "Elitist", "Egalitarian", "Entertaining", "Telepathy Focus", "Exclusive", "Secretive",
    "Militant", "Tolerant", "Transient", "Apathetic", "Traditional", "Free-spirited"
];

const FACTION_POWER = [
    "Obscure group", "Obscure group", "Marginal group", "Marginal group", "Significant group", 
    "Significant group", "Significant group", "Notable group", "Notable group", "Overwhelming power", "Overwhelming power"
];

export const generateLore = (w: Partial<WorldData>): string => {
   const sentences: string[] = [];
   
   const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
   
   // Population & Govt
   if (w.population === 0) {
      sentences.push(rand([
          `${w.name || 'This world'} is an uninhabited barren rock drifting in the void.`,
          `Devoid of life, ${w.name} is entirely uninhabited by sentient species.`,
          `No permanent population exists on ${w.name}.`
      ]));
   } else if (w.population! < 4) {
      sentences.push(rand([
          `${w.name} is a remote frontier outpost maintained by a sparse population.`,
          `A minuscule, isolated population clings to survival on ${w.name}.`,
          `Only a handful of rugged pioneers call ${w.name} home.`
      ]));
   } else if (w.population! > 8) {
      sentences.push(rand([
          `${w.name} is a densely populated core world teeming with billions.`,
          `Massive hive cities and urban sprawl pack billions of souls onto ${w.name}.`,
          `Overpopulation defines ${w.name}, an incredibly dense world.`
      ]));
   } else {
      sentences.push(rand([
          `${w.name} is an established colony world.`,
          `A stable population thrives across the surface of ${w.name}.`,
          `Millions reside harmoniously across the settlements of ${w.name}.`
      ]));
   }

   // Law level & Gov
   if (w.population! > 0) {
       sentences.push(rand([
           `The ruling body is classified as a ${w.governmentType}.`,
           `Global civilization is organized under a ${w.governmentType}.`
       ]));
       
       if (w.lawLevel! >= 13) {
           sentences.push(rand([
               `Life here revolves around strict obedience, with extreme law level enforcement.`,
               `Totalitarian mandates dictate everyday life, enforced by heavy, omnipresent policing.`
           ]));
       } else if (w.lawLevel! <= 2) {
           sentences.push(rand([
               `The local society is highly decentralized with virtually no restricting laws.`,
               `Anarchy freely reigns in a society absent of meaningful armament restrictions.`
           ]));
       }
   }

   // Physical properties
   if (w.temperatureClass === 'Frozen' || w.temperatureClass === 'Cold') {
       sentences.push(rand([
           `The surface is an unforgiving ${w.temperatureClass.toLowerCase()} wasteland.`,
           `Temperatures rarely break freezing on this completely ${w.temperatureClass.toLowerCase()} world.`
       ]));
   } else if (w.temperatureClass === 'Roasting' || w.temperatureClass === 'Hot') {
       sentences.push(rand([
           `Intense heat scours the ${w.temperatureClass.toLowerCase()} surface incessantly.`,
           `Survival requires thermal shielding from the blistering, ${w.temperatureClass.toLowerCase()} environment.`
       ]));
   } else {
       sentences.push(rand([
           `The climate remains widely temperate and hospitable.`,
           `Average temperatures fall within moderate, life-sustaining norms.`
       ]));
   }

   if (w.atmosphere === 0 || w.atmosphere === 1) {
       sentences.push(`Surface structures are entirely enclosed or subterranean due to the lack of a breathable atmosphere.`);
   } else if (w.atmosphere! >= 10) {
       sentences.push(`Toxic or insidious corrosive storms regularly ravage the hostile exterior environment.`);
   } 
   
   if (w.hydrographics! >= 9) {
       sentences.push(`Massive planet-wide oceans dominate the pristine surface.`);
   } else if (w.hydrographics! <= 1 && w.population! > 0) {
       sentences.push(`Water is fiercely rationed across its expansive, desolate deserts.`);
   }
   
   // Trade/Bases features
   if (w.bases?.includes('Naval') && w.bases?.includes('Scout')) {
       sentences.push(`A massive joint Naval and Scout military presence secures the sector architecture from this strategic stronghold.`);
   } else if (w.bases?.includes('Naval')) {
       sentences.push(`A sprawling Naval base orbits the mainworld, projecting significant fleet power into neighboring subsectors.`);
   } else if (w.bases?.includes('Scout')) {
       sentences.push(`The local Scout waystation provides vital navigation data and refueling for deep space survey operations.`);
   }

   // Append Factions & Details as Bullet Points
   if (w.population! > 0) {
       sentences.push(`\n\n• Starport: ${w.starportDetails}`);
       if (w.culture) sentences.push(`\n• Cultural Differences: ${w.culture}`);
       if (w.factions && w.factions.length > 0) {
           sentences.push(`\n• Factions:\n` + w.factions.map(f => `  - ${f.name} [${f.type}] : ${f.power}`).join('\n'));
       }
   }

   return sentences.join(" ");
};

export const generateWorld = (name: string = "Unnamed", hex: string = "0000"): WorldData => {
  // Physical
  let size = roll(2) - 2;
  if (size < 0) size = 0;

  let atmosphere = roll(2) - 7 + size;
  if (atmosphere < 0) atmosphere = 0;

  let tempRoll = roll(2);
  if (atmosphere <= 1) tempRoll += 0;
  else if (atmosphere <= 3) tempRoll -= 2;
  else if (atmosphere === 4 || atmosphere === 5 || atmosphere === 14) tempRoll -= 1;
  else if (atmosphere === 6 || atmosphere === 7) tempRoll += 0;
  else if (atmosphere === 8 || atmosphere === 9) tempRoll += 1;
  else if (atmosphere === 10 || atmosphere === 13 || atmosphere === 15) tempRoll += 2;
  else if (atmosphere === 11 || atmosphere === 12) tempRoll += 6;
  
  let temperature = tempRoll; 
  let temperatureClass = "Temperate";
  if (tempRoll <= 2) temperatureClass = "Frozen";
  else if (tempRoll >= 3 && tempRoll <= 4) temperatureClass = "Cold";
  else if (tempRoll >= 5 && tempRoll <= 9) temperatureClass = "Temperate";
  else if (tempRoll >= 10 && tempRoll <= 11) temperatureClass = "Hot";
  else if (tempRoll >= 12) temperatureClass = "Roasting";
  
  let hydrographics = roll(2) - 7 + atmosphere;
  if (size <= 1) hydrographics = 0;
  if (atmosphere <= 1 || (atmosphere >= 10 && atmosphere <= 12)) hydrographics -= 4;
  if (tempRoll >= 10 && tempRoll <= 11) hydrographics -= 2; 
  else if (tempRoll >= 12) hydrographics -= 6;
  
  if (hydrographics < 0) hydrographics = 0;
  if (hydrographics > 10) hydrographics = 10;

  // Societal
  let population = roll(2) - 2;
  if (population < 0) population = 0;

  let government = roll(2) - 7 + population;
  if (population === 0) government = 0;
  if (government < 0) government = 0;
  let govIdx = Math.min(government, 15);
  let governmentType = GOV_TYPES[govIdx];

  let lawLevel = roll(2) - 7 + government;
  if (population === 0) lawLevel = 0;
  if (lawLevel < 0) lawLevel = 0;

  // Starport
  let spMod = 0;
  if (population >= 9) spMod = 2;
  else if (population === 8) spMod = 1;
  else if (population <= 4 && population >= 3) spMod = -1;
  else if (population <= 2) spMod = -2;
  
  const spRoll = roll(2) + spMod;
  let starport = 'E';
  if (spRoll <= 2) starport = 'X';
  else if (spRoll === 3 || spRoll === 4) starport = 'E';
  else if (spRoll === 5 || spRoll === 6) starport = 'D';
  else if (spRoll === 7 || spRoll === 8) starport = 'C';
  else if (spRoll === 9 || spRoll === 10) starport = 'B';
  else if (spRoll >= 11) starport = 'A';
  
  let starportDetails = STARPORT_DETAILS[starport];

  // Tech Level
  let tlRoll = roll(1);
  if (starport === 'A') tlRoll += 6;
  else if (starport === 'B') tlRoll += 4;
  else if (starport === 'C') tlRoll += 2;
  else if (starport === 'X') tlRoll -= 4;

  if (size <= 1) tlRoll += 2;
  else if (size <= 4) tlRoll += 1;

  if (atmosphere <= 3 || atmosphere >= 10) tlRoll += 1;
  if (hydrographics === 9) tlRoll += 1;
  else if (hydrographics === 10) tlRoll += 2;

  if (population >= 1 && population <= 5) tlRoll += 1;
  else if (population === 9) tlRoll += 2;
  else if (population === 10) tlRoll += 4;
  else if (population >= 11) tlRoll += 5;

  if (government === 0 || government === 5) tlRoll += 1;
  else if (government === 13) tlRoll -= 2;

  let techLevel = tlRoll;
  if (techLevel < 0) techLevel = 0;
  if (population === 0) techLevel = 0;

  const uwp = generateUWPString({ starport, size, atmosphere, hydrographics, population, government, lawLevel, techLevel });
  const tradeCodes = calculateTradeCodes({ size, atmosphere, hydrographics, population, government, lawLevel });

  const hasGasGiant = roll(2) <= 10;
  const bases: string[] = [];
  
  if (starport === 'A') {
    if (roll(2) >= 8) bases.push('Naval');
    if (roll(2) >= 10) bases.push('Scout');
  } else if (starport === 'B') {
    if (roll(2) >= 8) bases.push('Naval');
    if (roll(2) >= 9) bases.push('Scout');
  } else if (starport === 'C') {
    if (roll(2) >= 8) bases.push('Scout');
  } else if (starport === 'D') {
    if (roll(2) >= 7) bases.push('Scout');
  }

  // Factions & Culture (MGT2 additions)
  let culture = undefined;
  const factions: Faction[] = [];
  
  if (population > 0) {
      culture = CULTURE_TABLE[Math.floor(Math.random() * CULTURE_TABLE.length)];
      
      const numFactions = roll(1, 3); // 1d3 Factions
      for (let i=0; i<numFactions; i++) {
          let fGov = roll(2) - 7 + government;
          if (fGov < 0) fGov = 0;
          let fGovType = GOV_TYPES[Math.min(fGov, 15)];
          
          let fPow = roll(2);
          let powerDesc = FACTION_POWER[Math.min(Math.max(fPow - 2, 0), 10)];
          
          factions.push({
              name: generateRandomName(),
              power: powerDesc,
              type: fGovType
          });
      }
  }

  const worldBasis: WorldData = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    hex,
    uwp,
    size,
    atmosphere,
    temperature,
    temperatureClass,
    hydrographics,
    population,
    government,
    governmentType,
    lawLevel,
    starport,
    starportDetails,
    techLevel,
    tradeCodes,
    hasGasGiant,
    bases,
    culture,
    factions
  };
  
  return {
    ...worldBasis,
    lore: generateLore(worldBasis)
  };
};
